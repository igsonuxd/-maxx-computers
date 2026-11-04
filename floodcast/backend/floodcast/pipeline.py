"""Train, evaluate and persist. Shared by the CLI and the synthetic demo."""
from __future__ import annotations

import json
from typing import Any

import pandas as pd

from . import config
from . import model as fm
from .evaluate import evaluate
from .features import FEATURE_COLUMNS
from .util import clean, utc_now_iso

TARGET = "discharge_cfs"


def train_and_save(dataset: pd.DataFrame, data_source: str) -> dict[str, Any]:
    model = fm.fit(dataset[list(FEATURE_COLUMNS)], dataset[TARGET])
    meta = {
        "trained_at": utc_now_iso(),
        "data_source": data_source,
        "n_rows": int(len(dataset)),
        "n_stations": int(dataset["site_no"].nunique()),
        "features": list(FEATURE_COLUMNS),
        "target": "log1p(discharge_cfs)",
        "params": fm.MODEL_PARAMS,
    }
    fm.save_bundle(model, clean(meta))
    return meta


def evaluate_and_save(dataset: pd.DataFrame, data_source: str) -> dict[str, Any]:
    report = evaluate(dataset, data_source)
    config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    config.METRICS_PATH.write_text(json.dumps(clean(report), indent=2))
    return report
