"""Runtime configuration. Every value can be overridden with an environment variable."""
from __future__ import annotations

import os
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = PACKAGE_DIR.parent
PROJECT_DIR = BACKEND_DIR.parent  # floodcast/

DATA_DIR = Path(os.environ.get("FLOODCAST_DATA_DIR", BACKEND_DIR / "data"))
CACHE_DIR = DATA_DIR / "cache"
MODEL_DIR = DATA_DIR / "models"
MODEL_PATH = MODEL_DIR / "model.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"
OOF_PATH = MODEL_DIR / "out_of_fold.csv.gz"
DATASET_PATH = DATA_DIR / "dataset.csv.gz"
DATASET_META_PATH = DATA_DIR / "dataset_meta.json"
STATIONS_PATH = DATA_DIR / "stations.json"
DB_PATH = DATA_DIR / "floodcast.sqlite"
WEB_DIR = PROJECT_DIR / "web"
STATIONS_CSV = Path(os.environ.get("FLOODCAST_STATIONS_CSV", BACKEND_DIR / "stations.csv"))

# "live": call USGS NWIS, Open-Meteo and StreamStats.
# "demo": use clearly labelled synthetic data (for development and tests only).
SOURCE_MODE = os.environ.get("FLOODCAST_SOURCE_MODE", "live").strip().lower()

DATA_SOURCE_LIVE = "live"
DATA_SOURCE_DEMO = "synthetic-demo"

HTTP_TIMEOUT_S = float(os.environ.get("FLOODCAST_HTTP_TIMEOUT", "30"))
USER_AGENT = "FLOODCAST-prototype/0.1 (research prototype)"

EXTREME_QUANTILE = 0.95   # "extreme" = at or above a station's 95th percentile of observed flow
MAX_ESTIMATE_DAYS = 366
