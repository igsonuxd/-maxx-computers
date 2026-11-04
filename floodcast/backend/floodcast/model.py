"""The estimator: gradient-boosted regression on log(1 + discharge).

Predicting log flow stabilises the very wide dynamic range of river discharge.
Predictions are transformed back to cubic feet per second and clipped at zero.
"""
from __future__ import annotations

from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

from . import config

MODEL_PARAMS: dict[str, Any] = {
    "max_iter": 400,
    "learning_rate": 0.05,
    "max_leaf_nodes": 31,
    "min_samples_leaf": 50,
    "l2_regularization": 1.0,
    "early_stopping": False,
    "random_state": 0,
}


def new_model() -> HistGradientBoostingRegressor:
    return HistGradientBoostingRegressor(**MODEL_PARAMS)


def fit(X: pd.DataFrame, y: pd.Series) -> HistGradientBoostingRegressor:
    model = new_model()
    model.fit(X.to_numpy(dtype=float), np.log1p(y.to_numpy(dtype=float)))
    return model


def predict_cfs(model: HistGradientBoostingRegressor, X: pd.DataFrame) -> np.ndarray:
    log_flow = model.predict(X.to_numpy(dtype=float))
    return np.clip(np.expm1(log_flow), 0.0, None)


def save_bundle(model: HistGradientBoostingRegressor, meta: dict[str, Any]) -> None:
    config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "meta": meta}, config.MODEL_PATH)


def load_bundle() -> dict[str, Any] | None:
    if not config.MODEL_PATH.exists():
        return None
    return joblib.load(config.MODEL_PATH)
