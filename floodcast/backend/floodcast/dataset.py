"""Assemble the training table: one row per station per day, with features and observed flow."""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path
from typing import Any

import pandas as pd

from . import config
from .features import CORE_FEATURES, FEATURE_COLUMNS, build_features, forcing_start, missing_attribute_codes
from .sources import SourceError
from .util import clean, utc_now_iso

log = logging.getLogger("floodcast.dataset")
TARGET = "discharge_cfs"


def read_station_list(path: Path) -> pd.DataFrame:
    """Read a station CSV with columns: site_no, latitude, longitude (optional: name, rcode)."""
    frame = pd.read_csv(path, dtype={"site_no": str, "rcode": str})
    missing = {"site_no", "latitude", "longitude"} - set(frame.columns)
    if missing:
        raise ValueError(f"{path} is missing required columns: {sorted(missing)}")
    if "name" not in frame:
        frame["name"] = frame["site_no"]
    if "rcode" not in frame:
        frame["rcode"] = None
    return frame


def station_frame(provider: Any, site_no: str, lat: float, lon: float, rcode: str | None,
                  start: date, end: date) -> tuple[pd.DataFrame, dict[str, float]]:
    discharge = provider.fetch_discharge(site_no, lat, lon, start, end)
    forcing = provider.fetch_forcing(lat, lon, forcing_start(start), end)
    attrs = provider.fetch_attributes(lat, lon, rcode)

    features = build_features(forcing, attrs)
    features = features.loc[pd.Timestamp(start):pd.Timestamp(end)]
    table = features.copy()
    table.insert(0, TARGET, discharge.reindex(table.index).to_numpy(dtype=float))
    table = table.dropna(subset=[TARGET, *CORE_FEATURES])
    table = table[table[TARGET] >= 0]
    table.insert(0, "site_no", site_no)
    return table, attrs


def build_dataset(stations: pd.DataFrame, start: date, end: date, provider: Any
                  ) -> tuple[pd.DataFrame, dict[str, Any], list[dict[str, str]]]:
    frames: list[pd.DataFrame] = []
    meta: dict[str, Any] = {}
    skipped: list[dict[str, str]] = []

    for row in stations.itertuples(index=False):
        site_no = str(row.site_no)
        rcode = row.rcode if isinstance(row.rcode, str) and row.rcode.strip() else None
        try:
            table, attrs = station_frame(provider, site_no, float(row.latitude), float(row.longitude),
                                         rcode, start, end)
        except SourceError as exc:
            log.warning("Skipping station %s: %s", site_no, exc)
            skipped.append({"site_no": site_no, "reason": str(exc)})
            continue
        if table.empty:
            skipped.append({"site_no": site_no, "reason": "no overlapping observations and forcing"})
            continue
        frames.append(table)
        meta[site_no] = {
            "name": str(row.name),
            "latitude": float(row.latitude),
            "longitude": float(row.longitude),
            "rcode": rcode,
            "n_days": int(len(table)),
            "first_date": table.index.min().date().isoformat(),
            "last_date": table.index.max().date().isoformat(),
            "attributes": attrs,
            "missing_attributes": missing_attribute_codes(attrs),
        }

    if not frames:
        raise RuntimeError("No station produced usable data. See the skipped list for reasons.")

    dataset = pd.concat(frames)
    dataset.index.name = "date"
    return dataset, meta, skipped


def write_dataset(dataset: pd.DataFrame, station_meta: dict[str, Any], data_source: str,
                  start: date, end: date, skipped: list[dict[str, str]]) -> None:
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(config.DATASET_PATH, index=True, index_label="date", compression="gzip")
    config.STATIONS_PATH.write_text(json.dumps(clean(station_meta), indent=2))
    summary = {
        "data_source": data_source,
        "created_at": utc_now_iso(),
        "start": start.isoformat(),
        "end": end.isoformat(),
        "n_rows": int(len(dataset)),
        "n_stations": int(dataset["site_no"].nunique()),
        "skipped": skipped,
        "features": list(FEATURE_COLUMNS),
    }
    config.DATASET_META_PATH.write_text(json.dumps(clean(summary), indent=2))


def load_dataset() -> pd.DataFrame | None:
    if not config.DATASET_PATH.exists():
        return None
    frame = pd.read_csv(config.DATASET_PATH, parse_dates=["date"], dtype={"site_no": str})
    return frame.set_index("date").sort_index()


def read_dataset_meta() -> dict[str, Any] | None:
    if not config.DATASET_META_PATH.exists():
        return None
    return json.loads(config.DATASET_META_PATH.read_text())


def window(obj: Any, start: date, end: date) -> Any:
    """Inclusive date slice for a Series or DataFrame indexed by day."""
    return obj.loc[pd.Timestamp(start):pd.Timestamp(end)]

