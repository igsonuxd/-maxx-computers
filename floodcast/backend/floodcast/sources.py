"""Live upstream clients: USGS NWIS (discharge), Open-Meteo (weather, soil), StreamStats (catchments).

All calls go through `get_json`, which caches raw responses on disk, retries transient
failures, and refuses to hit the network unless SOURCE_MODE is "live".
"""
from __future__ import annotations

import hashlib
import json
import logging
import math
import re
from datetime import date
from pathlib import Path
from typing import Any

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from . import config
from .features import ATTRIBUTE_CODES

log = logging.getLogger("floodcast.sources")

USGS_DV_URL = "https://waterservices.usgs.gov/nwis/dv/"
USGS_DISCHARGE_PARAM = "00060"  # discharge, cubic feet per second
USGS_NODATA = -999999.0

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

STREAMSTATS_WATERSHED_URL = "https://streamstats.usgs.gov/streamstatsservices/watershed.geojson"
STREAMSTATS_GLOBAL_URL = "https://streamstats.usgs.gov/streamstatsservices/globalwatershed.geojson"


class SourceError(RuntimeError):
    """An upstream source failed, is disabled, or returned unusable data."""


_session: requests.Session | None = None


def _get_session() -> requests.Session:
    global _session
    if _session is None:
        session = requests.Session()
        retry = Retry(
            total=3,
            backoff_factor=1.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=("GET",),
        )
        session.mount("https://", HTTPAdapter(max_retries=retry))
        session.headers["User-Agent"] = config.USER_AGENT
        _session = session
    return _session


def _cache_path(url: str, params: dict[str, Any]) -> Path:
    raw = url + json.dumps(params, sort_keys=True, default=str)
    return config.CACHE_DIR / f"{hashlib.sha256(raw.encode()).hexdigest()[:32]}.json"


def get_json(url: str, params: dict[str, Any]) -> dict[str, Any]:
    """GET a JSON document, using the on-disk cache when possible."""
    path = _cache_path(url, params)
    if path.exists():
        return json.loads(path.read_text())
    if config.SOURCE_MODE != "live":
        raise SourceError("Live sources are disabled (FLOODCAST_SOURCE_MODE is not 'live').")
    try:
        response = _get_session().get(url, params=params, timeout=config.HTTP_TIMEOUT_S)
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise SourceError(f"Request to {url} failed: {exc}") from exc
    config.CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload))
    return payload


# ---------------------------------------------------------------- USGS NWIS
def parse_usgs_dv(payload: dict[str, Any]) -> pd.Series:
    """Daily mean discharge (cfs) from a NWIS `dv` JSON response. Missing values become NaN."""
    series_list = (payload or {}).get("value", {}).get("timeSeries", []) or []
    if not series_list:
        return pd.Series(dtype=float, name="discharge_cfs", index=pd.DatetimeIndex([]))

    rows = (series_list[0].get("values") or [{}])[0].get("value") or []
    stamps, values = [], []
    for row in rows:
        stamps.append(str(row.get("dateTime", ""))[:10])
        try:
            value = float(row.get("value"))
        except (TypeError, ValueError):
            value = math.nan
        if value <= USGS_NODATA + 1 or value < 0:
            value = math.nan
        values.append(value)

    index = pd.to_datetime(stamps, errors="coerce")
    series = pd.Series(values, index=pd.DatetimeIndex(index), name="discharge_cfs", dtype=float)
    series = series[series.index.notna()]
    return series[~series.index.duplicated(keep="last")].sort_index()


def fetch_discharge(site_no: str, start: date, end: date) -> pd.Series:
    params = {
        "format": "json",
        "sites": site_no,
        "parameterCd": USGS_DISCHARGE_PARAM,
        "startDT": start.isoformat(),
        "endDT": end.isoformat(),
        "siteStatus": "all",
    }
    return parse_usgs_dv(get_json(USGS_DV_URL, params))


# ---------------------------------------------------------------- Open-Meteo
def parse_open_meteo(payload: dict[str, Any]) -> pd.DataFrame:
    """Daily precipitation (mm), mean temperature (C) and soil moisture (m3/m3, daily mean)."""
    daily = payload.get("daily") or {}
    hourly = payload.get("hourly") or {}
    columns = ["precip_mm", "temp_c", "soil_moisture"]
    if not daily.get("time"):
        return pd.DataFrame(columns=columns, index=pd.DatetimeIndex([], name="date"), dtype=float)

    index = pd.DatetimeIndex(pd.to_datetime(daily["time"])).normalize()
    frame = pd.DataFrame(index=index)
    frame["precip_mm"] = pd.to_numeric(pd.Series(daily.get("precipitation_sum", [])), errors="coerce").to_numpy()
    frame["temp_c"] = pd.to_numeric(pd.Series(daily.get("temperature_2m_mean", [])), errors="coerce").to_numpy()

    soil_values = hourly.get("soil_moisture_0_to_7cm") or []
    if soil_values and hourly.get("time"):
        hourly_index = pd.DatetimeIndex(pd.to_datetime(hourly["time"]))
        soil = pd.Series(pd.to_numeric(pd.Series(soil_values), errors="coerce").to_numpy(), index=hourly_index)
        frame["soil_moisture"] = soil.resample("D").mean().reindex(index).to_numpy()
    else:
        frame["soil_moisture"] = float("nan")

    frame.index.name = "date"
    return frame[~frame.index.duplicated(keep="last")].sort_index()


def fetch_forcing(lat: float, lon: float, start: date, end: date) -> pd.DataFrame:
    """Daily forcing for a point, requested one calendar year at a time."""
    frames = []
    for year in range(start.year, end.year + 1):
        chunk_start = max(start, date(year, 1, 1))
        chunk_end = min(end, date(year, 12, 31))
        params = {
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "start_date": chunk_start.isoformat(),
            "end_date": chunk_end.isoformat(),
            "daily": "precipitation_sum,temperature_2m_mean",
            "hourly": "soil_moisture_0_to_7cm",
            "timezone": "UTC",
        }
        frames.append(parse_open_meteo(get_json(OPEN_METEO_ARCHIVE_URL, params)))
    if not frames:
        return pd.DataFrame(columns=["precip_mm", "temp_c", "soil_moisture"], dtype=float)
    combined = pd.concat(frames).sort_index()
    return combined[~combined.index.duplicated(keep="last")]


# ---------------------------------------------------------------- StreamStats
def _to_float(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if math.isfinite(value) else None
    if isinstance(value, str):
        match = re.search(r"-?\d+(?:\.\d+)?", value)
        return float(match.group()) if match else None
    return None


def parse_streamstats(payload: Any) -> dict[str, float]:
    """Collect the catchment parameters we need from any nesting of StreamStats JSON.

    StreamStats nests parameters differently across services, so the parser walks the
    whole document and takes the first {"code": ..., "value": ...} entry per code.
    """
    wanted = set(ATTRIBUTE_CODES)
    found: dict[str, float] = {}

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            code = node.get("code")
            if isinstance(code, str) and code.upper() in wanted and code.upper() not in found:
                value = _to_float(node.get("value"))
                if value is not None:
                    found[code.upper()] = value
            for child in node.values():
                walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)

    walk(payload)
    return found


def fetch_attributes(lat: float, lon: float, rcode: str | None = None) -> dict[str, float]:
    """Catchment attributes at a point. `rcode` is the StreamStats region (state) code, e.g. 'CT'."""
    base = {"xlocation": lon, "ylocation": lat, "crs": 4326, "includeparameters": "true"}
    if rcode:
        url = STREAMSTATS_WATERSHED_URL
        params = {**base, "rcode": rcode.upper(), "includeflowtypes": "false", "includefeatures": "false"}
    else:
        url = STREAMSTATS_GLOBAL_URL
        params = base
    return parse_streamstats(get_json(url, params))
