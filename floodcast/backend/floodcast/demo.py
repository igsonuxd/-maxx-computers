"""Synthetic demo world, for development and tests only.

Everything produced here is labelled `synthetic-demo` end to end. Demo flows come from a
simple linear-reservoir rainfall-runoff toy, not from measurements, and the API never
publishes evaluation scores computed from demo data.
"""
from __future__ import annotations

import zlib
from datetime import date
from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd

from . import config
from .dataset import build_dataset, window, write_dataset
from .features import FORCING_COLUMNS
from .pipeline import TARGET, evaluate_and_save, train_and_save

DEMO_ORIGIN = date(2000, 1, 1)
DEMO_END = date(2035, 12, 31)
DEMO_STATION_COUNT = 12


def _seed(tag: str, lat: float, lon: float) -> int:
    return zlib.crc32(f"{tag}|{lat:.4f}|{lon:.4f}".encode())


def synthetic_attributes(lat: float, lon: float) -> dict[str, float]:
    rng = np.random.default_rng(_seed("attr", lat, lon))
    return {
        "DRNAREA": float(np.exp(rng.normal(np.log(60.0), 0.9))),
        "BSLDEM250": float(rng.uniform(2.0, 30.0)),
        "ELEV": float(rng.uniform(100.0, 2500.0)),
        "SOILPERM": float(rng.uniform(0.5, 5.0)),
    }


@lru_cache(maxsize=128)
def _series(lat: float, lon: float) -> pd.DataFrame:
    rng = np.random.default_rng(_seed("series", lat, lon))
    idx = pd.date_range(DEMO_ORIGIN, DEMO_END, freq="D")
    n = len(idx)
    doy = idx.day_of_year.to_numpy(dtype=float)
    season = np.sin(2 * np.pi * (doy - 100) / 365.25)

    wet = rng.random(n) < np.clip(0.28 + 0.12 * season, 0.05, 0.6)
    precip = rng.gamma(0.7, 14.0, n) * wet
    temp = 12 + 11 * season - 0.5 * (lat - 40) + rng.normal(0, 2.5, n)

    store = 0.0
    wetness = np.empty(n)
    for i in range(n):
        store = 0.93 * store + precip[i]
        wetness[i] = store
    soil = np.clip(0.12 + 0.36 * (1 - np.exp(-wetness / 45)), 0.05, 0.5)

    attrs = synthetic_attributes(lat, lon)
    k = 0.07 / (1 + 0.03 * attrs["BSLDEM250"])
    reservoir = 15.0
    runoff = np.empty(n)
    for i in range(n):
        et = 0.12 * max(temp[i], 0.0) / 10.0
        reservoir = max(reservoir + precip[i] - et, 0.0)
        out = min(k * reservoir * (0.6 + 0.8 * soil[i] / 0.5), reservoir)
        reservoir -= out
        runoff[i] = out

    # mm/day over DRNAREA sq mi -> cubic feet per second (1 mm/day/sq mi ~= 1.0587 cfs)
    cfs = runoff * attrs["DRNAREA"] * 1.0587 * np.exp(rng.normal(0, 0.05, n))
    return pd.DataFrame(
        {"precip_mm": precip, "temp_c": temp, "soil_moisture": soil, TARGET: cfs},
        index=idx,
    )


def _key(lat: float, lon: float) -> tuple[float, float]:
    return round(float(lat), 4), round(float(lon), 4)


class DemoProvider:
    name = config.DATA_SOURCE_DEMO

    def fetch_discharge(self, site_no: str, lat: float, lon: float, start: date, end: date) -> pd.Series:
        return window(_series(*_key(lat, lon))[TARGET], start, end)

    def fetch_forcing(self, lat: float, lon: float, start: date, end: date) -> pd.DataFrame:
        return window(_series(*_key(lat, lon))[list(FORCING_COLUMNS)], start, end)

    def fetch_attributes(self, lat: float, lon: float, rcode: str | None = None) -> dict[str, float]:
        return synthetic_attributes(*_key(lat, lon))


def demo_station_frame(count: int = DEMO_STATION_COUNT) -> pd.DataFrame:
    rng = np.random.default_rng(20240601)
    rows = []
    for i in range(count):
        rows.append({
            "site_no": f"DEMO-{i + 1:02d}",
            "name": f"Synthetic basin {i + 1:02d}",
            "latitude": round(float(rng.uniform(36.0, 45.0)), 4),
            "longitude": round(float(rng.uniform(-110.0, -75.0)), 4),
            "rcode": None,
        })
    return pd.DataFrame(rows)


def run_demo(start: date = date(2000, 1, 1), end: date = date(2023, 12, 31),
             station_count: int = DEMO_STATION_COUNT) -> dict[str, Any]:
    provider = DemoProvider()
    stations = demo_station_frame(station_count)
    dataset, station_meta, skipped = build_dataset(stations, start, end, provider)
    write_dataset(dataset, station_meta, config.DATA_SOURCE_DEMO, start, end, skipped)
    train_meta = train_and_save(dataset, config.DATA_SOURCE_DEMO)
    report = evaluate_and_save(dataset, config.DATA_SOURCE_DEMO)
    return {"data_source": config.DATA_SOURCE_DEMO, "n_rows": int(len(dataset)),
            "n_stations": train_meta["n_stations"], "evaluation_rows": report["n_rows"]}
