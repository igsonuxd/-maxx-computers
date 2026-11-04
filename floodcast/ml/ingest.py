"""Data ingestion for FLOODCAST.

Priority order (never fabricates silently):
1. Official competition CSVs in floodcast/data/official/ (train.csv etc.).
2. Live downloads: USGS NWIS daily values (param 00060) + Open-Meteo archive,
   joined with StreamStats catchment features from config.py.
3. OFFLINE DEMO generator (physics-based, seeded) — used ONLY when 1+2 are
   unavailable (e.g. this sandbox has no USGS/Open-Meteo egress). Every frame
   it produces is tagged source='demo_synthetic'. Replace with official data
   at Hour 0. It exists so the full pipeline is runnable/testable anywhere.
"""
from __future__ import annotations
import math
import numpy as np
import pandas as pd

from config import (STATIONS, STATION_BY_ID, USGS_DV_URL, USGS_PARAM_DISCHARGE,
                    OPENMETEO_ARCHIVE_URL, OPENMETEO_DAILY, OPENMETEO_HOURLY_SOIL,
                    OFFICIAL_DIR, DEMO_TRAIN, DEMO_TEST, RANDOM_SEED)

WEATHER_COLS = ["precipitation_sum", "temperature_2m_max",
                "temperature_2m_min", "soil_moisture_0_to_7cm"]


# ---------------------------------------------------------------- live USGS
def fetch_usgs_daily(station_ids, start, end, timeout=60):
    """USGS NWIS daily discharge (00060, cfs). Returns DataFrame or raises."""
    import requests
    params = {"format": "json", "sites": ",".join(station_ids),
              "startDT": start, "endDT": end,
              "parameterCd": USGS_PARAM_DISCHARGE, "statCd": "00003"}
    r = requests.get(USGS_DV_URL, params=params, timeout=timeout)
    r.raise_for_status()
    rows = []
    for ts in r.json()["value"]["timeSeries"]:
        sid = ts["sourceInfo"]["siteCode"][0]["value"].zfill(8)
        for block in ts["values"]:
            for v in block["value"]:
                try:
                    val = float(v["value"])
                except (TypeError, ValueError):
                    continue
                if val < 0:
                    continue
                rows.append({"station_id": sid, "date": v["dateTime"][:10],
                             "discharge_cfs": val,
                             "qualifiers": ",".join(v.get("qualifiers", []))})
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    return df


def fetch_openmeteo_archive(lat, lon, start, end, timeout=60):
    """Open-Meteo historical weather: daily precip/temp + hourly soil moisture
    (0-7cm) aggregated to daily mean. Matched by lat/lon/date per spec."""
    import requests
    params = {"latitude": lat, "longitude": lon, "start_date": start,
              "end_date": end, "daily": ",".join(OPENMETEO_DAILY),
              "hourly": OPENMETEO_HOURLY_SOIL, "timezone": "UTC"}
    r = requests.get(OPENMETEO_ARCHIVE_URL, params=params, timeout=timeout)
    r.raise_for_status()
    j = r.json()
    daily = pd.DataFrame({"date": pd.to_datetime(j["daily"]["time"])})
    for c in OPENMETEO_DAILY:
        daily[c] = j["daily"][c]
    soil = pd.DataFrame({"t": pd.to_datetime(j["hourly"]["time"]),
                         "s": j["hourly"][OPENMETEO_HOURLY_SOIL]})
    soil["date"] = soil["t"].dt.normalize()
    soil_daily = soil.groupby("date")["s"].mean().rename(OPENMETEO_HOURLY_SOIL)
    return daily.merge(soil_daily, on="date", how="left")


def download_live_dataset(start="2018-01-01", end="2024-12-31"):
    """Full 3-source join exactly as spec: station_id join + lat/lon/date join."""
    ids = [s["station_id"] for s in STATIONS]
    hydro = fetch_usgs_daily(ids, start, end)
    frames = []
    for s in STATIONS:
        w = fetch_openmeteo_archive(s["lat"], s["lon"], start, end)
        w["station_id"] = s["station_id"]
        frames.append(w)
    weather = pd.concat(frames, ignore_index=True)
    return build_dataset(hydro, weather, source="usgs+openmeteo_live")


def build_dataset(hydro, weather, source):
    """Join discharge + weather + StreamStats; validate missing/dupes."""
    df = hydro.merge(weather, on=["station_id", "date"], how="inner")
    catch = pd.DataFrame([{k: s[k] for k in
                           ("station_id", "DRNAREA", "ELEV", "FOREST",
                            "SLOPE_PCT", "IMPERVIOUS", "lat", "lon")}
                          for s in STATIONS])
    df = df.merge(catch, on="station_id", how="left")
    df = df.drop_duplicates(["station_id", "date"]).sort_values(
        ["station_id", "date"]).reset_index(drop=True)
    # soil moisture: short gaps forward-filled per station (<=3 days)
    df["soil_moisture_0_to_7cm"] = (df.groupby("station_id")
                                    ["soil_moisture_0_to_7cm"]
                                    .transform(lambda x: x.ffill(limit=3)))
    df["source"] = source
    report = {c: int(df[c].isna().sum()) for c in df.columns if df[c].isna().any()}
    print(f"[ingest] {source}: {len(df)} rows, missing={report or 'none'}")
    return df


# ------------------------------------------------------------ demo generator
def _seasonal_precip(rng, doy, climate):
    ang = 2 * math.pi * (doy - 1) / 365.25
    if climate == "mediterranean_snowmelt":      # wet winter, dry summer
        lam = 0.28 + 0.24 * math.cos(ang - 0.2)
    elif climate == "continental_central":       # spring/summer convective
        lam = 0.30 + 0.10 * math.sin(ang - 0.6)
    elif climate == "subtropical_south_flash":   # erratic, intense storms
        lam = 0.24 + 0.06 * math.sin(ang)
    else:                                        # humid east, year-round
        lam = 0.32 + 0.06 * math.sin(ang + 0.4)
    storm = rng.random() < 0.012                 # storm-cluster extremes
    if rng.random() < lam:
        depth = rng.gamma(shape=1.6, scale=7.0)
        return depth * (rng.uniform(2.5, 5.0) if storm else 1.0)
    return 0.0


def generate_demo_dataset(train_period=DEMO_TRAIN, test_period=DEMO_TEST):
    """Physics-based rainfall-runoff synthesis (bucket soil + routed runoff +
    baseflow recession + snowmelt pulse). Deterministic per station."""
    frames = []
    dates = pd.date_range(train_period[0], test_period[1], freq="D")
    for s in STATIONS:
        rng = np.random.default_rng(RANDOM_SEED + int(s["station_id"]) % 10000)
        area = s["DRNAREA"]
        runoff_k = (0.55 - 0.004 * s["FOREST"] + 0.02 * s["IMPERVIOUS"]
                    + 0.008 * s["SLOPE_PCT"])  # forest↓, impervious/slope↑
        base = 0.55 * area ** 0.92 / 10.0 if area < 50000 else area * 0.42
        # Mississippi-scale baseflow sanity
        if s["station_id"] == "07010000":
            base = 120000.0
        temp_mean_local = {"TX": 20, "CA": 16, "NC": 15, "MO": 13}.get(s["state"], 13)
        soil, quick, slow, snowpack = 0.22, 0.0, base, 0.0
        rows = []
        for d in dates:
            doy = d.dayofyear
            ang = 2 * math.pi * (doy - 1) / 365.25
            tmean = temp_mean_local + 11 * math.sin(ang - 1.9) + rng.normal(0, 3)
            tmax, tmin = tmean + rng.uniform(4, 8), tmean - rng.uniform(4, 8)
            precip = _seasonal_precip(rng, doy, s["climate"])
            # snow accumulation/melt (mountain-fed basins)
            melt = 0.0
            if s["ELEV"] > 900:
                if tmean < 1.0:
                    snowpack += precip
                    precip_eff = 0.0
                else:
                    melt = min(snowpack, 0.12 * snowpack * max(tmean, 0) / 5.0)
                    snowpack -= melt
                    precip_eff = precip
            else:
                precip_eff = precip
            et = max(0.0, 0.10 + 0.012 * tmean) * (0.4 + 0.6 * soil)
            soil = float(np.clip(soil + 0.012 * precip_eff - 0.05 * et
                                 - 0.01 * soil + rng.normal(0, 0.004), 0.05, 0.45))
            sat = (soil - 0.05) / 0.40
            runoff_mm = runoff_k * (0.25 + 0.75 * sat ** 1.6) * precip_eff + 0.5 * melt
            quick = 0.55 * quick + runoff_mm
            slow = 0.985 * slow + 0.015 * base * (0.6 + 0.8 * sat)
            conv = area * 0.028  # mm/day over basin -> cfs scale (demo calibration)
            if s["station_id"] == "07010000":
                conv = area * 0.0016  # huge-basin routing attenuation
            q = max(1.0, (slow + quick * conv) * float(np.exp(rng.normal(0, 0.10))))
            rows.append({"station_id": s["station_id"], "date": d,
                         "precipitation_sum": round(float(precip), 2),
                         "temperature_2m_max": round(float(tmax), 1),
                         "temperature_2m_min": round(float(tmin), 1),
                         "soil_moisture_0_to_7cm": round(float(soil), 3),
                         "discharge_cfs": round(float(q), 1),
                         "qualifiers": "DEMO"})
        f = pd.DataFrame(rows)
        for k in ("DRNAREA", "ELEV", "FOREST", "SLOPE_PCT", "IMPERVIOUS", "lat", "lon"):
            f[k] = s[k]
        frames.append(f)
    df = pd.concat(frames, ignore_index=True)
    df["source"] = "demo_synthetic"
    train = df[(df.date >= train_period[0]) & (df.date <= train_period[1])].copy()
    test_full = df[(df.date >= test_period[0]) & (df.date <= test_period[1])].copy()
    test = test_full.drop(columns=["discharge_cfs"])  # hidden target, like official
    print(f"[ingest] DEMO generated: train={len(train)} test={len(test)} rows "
          "(source=demo_synthetic — replace with official data)")
    hidden = test_full[["station_id", "date", "discharge_cfs"]].copy()
    return train, test, hidden


# ------------------------------------------------------------------- loaders
def station_metadata_frame():
    return pd.DataFrame([{k: s[k] for k in
                          ("station_id", "name", "river", "state", "lat", "lon",
                           "DRNAREA", "ELEV", "FOREST", "SLOPE_PCT", "IMPERVIOUS")}
                         for s in STATIONS])


def load_official():
    """Returns (train, test, hidden_y=None) if official CSVs exist, else None."""
    tr, te = OFFICIAL_DIR / "train.csv", OFFICIAL_DIR / "test.csv"
    if not (tr.exists() and te.exists()):
        return None
    train, test = pd.read_csv(tr), pd.read_csv(te)
    for d in (train, test):
        d["station_id"] = d["station_id"].astype(str).str.zfill(8)
        d["date"] = pd.to_datetime(d["date"])
        for k in ("DRNAREA", "ELEV", "FOREST", "SLOPE_PCT", "IMPERVIOUS"):
            if k not in d.columns:
                d[k] = d["station_id"].map(
                    lambda x: STATION_BY_ID.get(x, {}).get(k, np.nan))
        d["source"] = "official_csv"
    print(f"[ingest] official CSVs: train={len(train)} test={len(test)}")
    return train, test, None


def load_data(prefer_live=False):
    """train, test, demo_hidden_y(or None), mode"""
    off = load_official()
    if off:
        return off[0], off[1], None, "official_csv"
    if prefer_live:
        try:
            df = download_live_dataset()
            cut = pd.Timestamp(DEMO_TEST[0])
            train = df[df.date < cut].copy()
            test_full = df[df.date >= cut].copy()
            return train, test_full.drop(columns=["discharge_cfs"]), \
                test_full[["station_id", "date", "discharge_cfs"]].copy(), \
                "usgs+openmeteo_live"
        except Exception as e:  # noqa: BLE001 - explicit fallback, never silent
            print(f"[ingest] live download failed ({e}); using demo generator")
    train, test, hidden = generate_demo_dataset()
    return train, test, hidden, "demo_synthetic"
