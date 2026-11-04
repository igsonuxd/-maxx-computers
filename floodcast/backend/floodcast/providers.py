"""Data providers. The API and the dataset builder depend only on this interface.

LiveProvider talks to USGS, Open-Meteo and StreamStats. DemoProvider generates labelled
synthetic data. `get_provider()` picks one from FLOODCAST_SOURCE_MODE.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Protocol

import pandas as pd

from . import config, sources


class Provider(Protocol):
    name: str

    def fetch_discharge(self, site_no: str, lat: float, lon: float, start: date, end: date) -> pd.Series: ...
    def fetch_forcing(self, lat: float, lon: float, start: date, end: date) -> pd.DataFrame: ...
    def fetch_attributes(self, lat: float, lon: float, rcode: str | None = None) -> dict[str, float]: ...


class LiveProvider:
    name = config.DATA_SOURCE_LIVE

    def fetch_discharge(self, site_no: str, lat: float, lon: float, start: date, end: date) -> pd.Series:
        return sources.fetch_discharge(site_no, start, end)

    def fetch_forcing(self, lat: float, lon: float, start: date, end: date) -> pd.DataFrame:
        return sources.fetch_forcing(lat, lon, start, end)

    def fetch_attributes(self, lat: float, lon: float, rcode: str | None = None) -> dict[str, float]:
        return sources.fetch_attributes(lat, lon, rcode)


def get_provider() -> Any:
    if config.SOURCE_MODE == "demo":
        from .demo import DemoProvider
        return DemoProvider()
    return LiveProvider()
