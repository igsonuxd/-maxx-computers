"""Feature engineering (shared contract with the web model in
src/lib/floodcast/model.ts — keep feature names/formulas in sync).

Two model families (leakage discipline, Brief §7):
- Model B (OFFICIAL predictions.csv): weather + catchment + seasonality ONLY.
  Never uses test-period discharge (hidden). Safe for test.csv.
- Model A (LIVE web forecasting): Model B + lagged OBSERVED discharge, where
  those lags come from USGS observed history (legitimate at inference time).
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from config import CATCHMENT_FEATURES

API_DECAYS = (0.85, 0.92, 0.97)


def antecedent_precip_index(precip: np.ndarray, decay: float) -> np.ndarray:
    out = np.zeros(len(precip))
    acc = 0.0
    for i, p in enumerate(precip):
        acc = decay * acc + (p if np.isfinite(p) else 0.0)
        out[i] = acc
    return out


def add_features(df: pd.DataFrame, with_discharge_lags: bool) -> pd.DataFrame:
    df = df.sort_values(["station_id", "date"]).copy()
    df["temp_mean"] = (df["temperature_2m_max"] + df["temperature_2m_min"]) / 2.0
    doy = df["date"].dt.dayofyear
    df["doy_sin"] = np.sin(2 * np.pi * doy / 365.25)
    df["doy_cos"] = np.cos(2 * np.pi * doy / 365.25)
    df["month"] = df["date"].dt.month
    df["log_drnarea"] = np.log1p(df["DRNAREA"])
    parts = []
    for _, g in df.groupby("station_id", sort=False):
        g = g.copy()
        p = g["precipitation_sum"]
        for lag in (1, 2, 3, 7):
            g[f"precip_lag{lag}"] = p.shift(lag)
        for w in (3, 7, 14, 30, 90):
            g[f"precip_roll{w}"] = p.rolling(w, min_periods=1).sum()
            g[f"precip_max{w}"] = p.rolling(w, min_periods=1).max()
        for k in API_DECAYS:
            g[f"api_{int(k*100)}"] = antecedent_precip_index(p.to_numpy(float), k)
        for col in ("soil_moisture_0_to_7cm", "temp_mean"):
            g[f"{col}_lag1"] = g[col].shift(1)
            g[f"{col}_roll7"] = g[col].rolling(7, min_periods=1).mean()
            g[f"{col}_roll30"] = g[col].rolling(30, min_periods=1).mean()
        g["rain_x_soil"] = g["precip_roll7"] * g["soil_moisture_0_to_7cm"]
        g["rain_per_area"] = g["precip_roll7"]  # depth already area-normalised
        g["melt_proxy"] = np.maximum(g["temp_mean"] - 2.0, 0) * (g["ELEV"] / 1000.0)
        if with_discharge_lags and "discharge_cfs" in g.columns:
            q = g["discharge_cfs"]
            for lag in (1, 2, 3, 7, 14):
                g[f"q_lag{lag}"] = q.shift(lag)
            for w in (7, 14, 30):
                g[f"q_roll_mean{w}"] = q.shift(1).rolling(w, min_periods=1).mean()
                g[f"q_roll_max{w}"] = q.shift(1).rolling(w, min_periods=1).max()
            g["log_q_lag1"] = np.log1p(g["q_lag1"])
        parts.append(g)
    return pd.concat(parts).sort_values(["station_id", "date"]).reset_index(drop=True)


FEATURES_B = (
    ["precipitation_sum", "temperature_2m_max", "temperature_2m_min", "temp_mean",
     "soil_moisture_0_to_7cm"]
    + [f"precip_lag{l}" for l in (1, 2, 3, 7)]
    + [f"precip_roll{w}" for w in (3, 7, 14, 30, 90)]
    + [f"precip_max{w}" for w in (3, 7, 14, 30, 90)]
    + [f"api_{int(k*100)}" for k in API_DECAYS]
    + ["soil_moisture_0_to_7cm_lag1", "soil_moisture_0_to_7cm_roll7",
       "soil_moisture_0_to_7cm_roll30", "temp_mean_lag1", "temp_mean_roll7",
       "temp_mean_roll30", "rain_x_soil", "melt_proxy"]
    + ["ELEV", "FOREST", "SLOPE_PCT", "IMPERVIOUS"]  # raw DRNAREA excluded on
    # purpose: target is log specific discharge (q/area) so unseen huge/tiny
    # basins regionalise safely; scale enters via log_drnarea only.
    + ["log_drnarea", "lat", "lon"]
    + ["doy_sin", "doy_cos", "month"]
)

FEATURES_A = FEATURES_B + (
    [f"q_lag{l}" for l in (1, 2, 3, 7, 14)]
    + [f"q_roll_mean{w}" for w in (7, 14, 30)]
    + [f"q_roll_max{w}" for w in (7, 14, 30)]
    + ["log_q_lag1"]
)
