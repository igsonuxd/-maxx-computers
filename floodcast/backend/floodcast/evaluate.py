"""Leave-basin-out evaluation.

Whole stations are held out together, so every score describes a river the model has
not seen in training. Scores are computed on out-of-fold predictions only.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold

from . import config
from . import model as fm
from .features import FEATURE_COLUMNS
from .util import utc_now_iso

TARGET = "discharge_cfs"


def extreme_mask(ds: pd.DataFrame) -> pd.Series:
    """Days whose observed flow is at or above that station's own high-flow percentile.

    The mask selects evaluation days by observed flow only. It is never used for training.
    """
    thresholds = ds.groupby("site_no")[TARGET].quantile(config.EXTREME_QUANTILE)
    return ds[TARGET] >= ds["site_no"].map(thresholds)


def _metrics(y: np.ndarray, p: np.ndarray, extreme: np.ndarray) -> dict[str, float | None]:
    err = y - p
    ss_res = float(np.sum(err ** 2))
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    return {
        "rmse_cfs": float(np.sqrt(np.mean(err ** 2))),
        "extreme_rmse_cfs": float(np.sqrt(np.mean(err[extreme] ** 2))) if extreme.any() else None,
        "mae_cfs": float(np.mean(np.abs(err))),
        "r2": (1.0 - ss_res / ss_tot) if ss_tot > 0 else None,
    }


def evaluate(ds: pd.DataFrame, data_source: str, n_splits: int = 5) -> dict[str, Any]:
    stations = int(ds["site_no"].nunique())
    if stations < n_splits:
        raise ValueError(f"Leave-basin-out evaluation needs at least {n_splits} stations; found {stations}.")

    X = ds[list(FEATURE_COLUMNS)]
    y = ds[TARGET]
    groups = ds["site_no"].to_numpy()

    oof = np.full(len(ds), np.nan)
    folds: list[dict[str, Any]] = []
    for k, (train_idx, test_idx) in enumerate(GroupKFold(n_splits=n_splits).split(X, y, groups)):
        model = fm.fit(X.iloc[train_idx], y.iloc[train_idx])
        oof[test_idx] = fm.predict_cfs(model, X.iloc[test_idx])
        folds.append({"fold": k, "test_stations": sorted(set(groups[test_idx])), "n_rows": int(len(test_idx))})

    observed = y.to_numpy(dtype=float)
    extreme = extreme_mask(ds).to_numpy(dtype=bool)
    valid = ~np.isnan(oof)

    config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    pd.DataFrame({
        "site_no": groups,
        "date": ds.index.strftime("%Y-%m-%d"),
        "observed_cfs": observed,
        "predicted_cfs": oof,
    }).to_csv(config.OOF_PATH, index=False, compression="gzip")

    return {
        "generated_at": utc_now_iso(),
        "data_source": data_source,
        "protocol": f"Leave-basin-out: {n_splits}-fold GroupKFold over stations; every score uses out-of-fold predictions.",
        "extreme_definition": f"Observed flow at or above each station's {int(config.EXTREME_QUANTILE * 100)}th percentile over its own record.",
        "n_splits": n_splits,
        "n_stations": stations,
        "n_rows": int(valid.sum()),
        "n_extreme_rows": int((extreme & valid).sum()),
        "metrics": _metrics(observed[valid], oof[valid], extreme[valid]),
        "folds": folds,
    }
