"""Small helpers: JSON-safe conversion (no NaN/Infinity in responses) and timestamps."""
from __future__ import annotations

import math
from datetime import date, datetime, timezone
from typing import Any

import numpy as np


def clean(obj: Any) -> Any:
    """Recursively convert numpy/pandas/NaN values into plain JSON-safe Python values."""
    if isinstance(obj, dict):
        return {str(k): clean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [clean(v) for v in obj]
    if isinstance(obj, np.ndarray):
        return clean(obj.tolist())
    if isinstance(obj, (bool, np.bool_)):
        return bool(obj)
    if isinstance(obj, (int, np.integer)):
        return int(obj)
    if isinstance(obj, (float, np.floating)):
        value = float(obj)
        return value if math.isfinite(value) else None
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
