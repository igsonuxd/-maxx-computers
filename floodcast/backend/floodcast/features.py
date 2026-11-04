"""Feature engineering shared by training, evaluation and estimation.

Every feature on day t uses only information from day t or earlier, so the model
cannot see the future. Catchment attributes are static per basin: they are what lets
the model make predictions for a river that has no gauge history.
"""
from __future__ import annotations

import math
from datetime import date, timedelta

import numpy as np
import pandas as pd

WARMUP_DAYS = 30  # extra forcing history fetched before the requested window
PRECIP_WINDOWS = (1, 3, 7, 14, 30)

FORCING_COLUMNS = ("precip_mm", "temp_c", "soil_moisture")

# StreamStats parameter codes used as catchment attributes.
ATTRIBUTE_CODES = ("DRNAREA", "BSLDEM250", "ELEV", "SOILPERM")
ATTRIBUTE_COLUMNS = ("log_drainage_area", "basin_slope_pct", "mean_elevation_ft", "soil_permeability")

CORE_FEATURES = tuple(f"precip_{w}d" for w in PRECIP_WINDOWS) + ("temp_c", "soil_moisture")

FEATURE_COLUMNS = (
    *(f"precip_{w}d" for w in PRECIP_WINDOWS),
    "temp_c",
    "temp_anom_30d",
    "soil_moisture",
    "soil_moisture_7d",
    "doy_sin",
    "doy_cos",
    *ATTRIBUTE_COLUMNS,
)


def forcing_start(start: date) -> date:
    """First day of forcing needed so that antecedent (30-day) features are complete."""
    return start - timedelta(days=WARMUP_DAYS)


def attribute_values(attrs: dict[str, float]) -> dict[str, float]:
    area = attrs.get("DRNAREA")
    return {
        "log_drainage_area": math.log(area) if area and area > 0 else math.nan,
        "basin_slope_pct": attrs.get("BSLDEM250", math.nan),
        "mean_elevation_ft": attrs.get("ELEV", math.nan),
        "soil_permeability": attrs.get("SOILPERM", math.nan),
    }


def missing_attribute_codes(attrs: dict[str, float]) -> list[str]:
    return [code for code in ATTRIBUTE_CODES if code not in attrs]


def build_features(forcing: pd.DataFrame, attrs: dict[str, float]) -> pd.DataFrame:
    """Daily feature table. Index: date. Columns: FEATURE_COLUMNS."""
    if forcing.empty:
        return pd.DataFrame(columns=list(FEATURE_COLUMNS), dtype=float)

    f = forcing.sort_index()
    f = f[~f.index.duplicated(keep="last")].asfreq("D")
    precip = f["precip_mm"]
    temp = f["temp_c"]
    soil = f["soil_moisture"]

    out = pd.DataFrame(index=f.index)
    for w in PRECIP_WINDOWS:
        out[f"precip_{w}d"] = precip.rolling(w, min_periods=1).sum()
    out["temp_c"] = temp
    out["temp_anom_30d"] = temp - temp.rolling(30, min_periods=10).mean()
    out["soil_moisture"] = soil
    out["soil_moisture_7d"] = soil.rolling(7, min_periods=3).mean()

    doy = f.index.day_of_year.to_numpy(dtype=float)
    out["doy_sin"] = np.sin(2 * np.pi * doy / 365.25)
    out["doy_cos"] = np.cos(2 * np.pi * doy / 365.25)

    for key, value in attribute_values(attrs).items():
        out[key] = value

    return out[list(FEATURE_COLUMNS)]
