# FLOODCAST

**Predict the surge before it strikes.** FLOODCAST estimates daily river discharge (cubic feet per second) from rainfall, temperature, soil moisture and catchment shape, and it is designed to work on rivers that have no gauge history.

This folder holds the full stack:

```
floodcast/
├── web/index.html          the story page (single file, served by the API)
└── backend/
    ├── floodcast/          Python package: sources, features, model, evaluation, API, CLI
    ├── tests/              pytest suite (no network needed)
    ├── requirements*.txt
    └── stations.template.csv
```

## Quick start (no network, synthetic data)

```bash
cd floodcast/backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt

python -m floodcast demo                  # synthetic dataset, model and evaluation (about 30 s)
python -m floodcast serve --port 8000     # http://localhost:8000
```

Everything produced in demo mode is labelled `synthetic-demo`. Demo flows come from a simple rainfall-runoff toy model, not from measurements.

```bash
pytest -q                                 # 28 tests, offline
```

## Live data

Live mode calls three public services:

| Input | Source | Used for |
|---|---|---|
| Daily discharge (cfs) | USGS NWIS `dv` (parameter 00060) | training target and out-of-fold scoring |
| Rainfall, temperature, soil moisture | Open-Meteo archive (daily + hourly `soil_moisture_0_to_7cm`) | model inputs |
| Drainage area, basin slope, elevation, soil permeability | StreamStats `watershed.geojson` | catchment shape |

1. List the gauged stations to learn from in `backend/stations.csv` (columns `site_no, latitude, longitude`, plus optional `name, rcode`). See `stations.template.csv`.
2. Build the dataset and train:

   ```bash
   python -m floodcast fetch --stations stations.csv --start 2010-01-01 --end 2024-12-31
   python -m floodcast train
   python -m floodcast evaluate
   python -m floodcast serve --host 0.0.0.0 --port 8000
   ```

Raw upstream responses are cached in `backend/data/cache`, so re-runs do not repeat downloads.

**Coverage.** USGS and StreamStats cover the United States. Live estimates elsewhere will usually fail with a clear 502 message, or return fewer catchment attributes (flagged in the response).

## How the model is evaluated

- **Target:** `log(1 + discharge)`, predicted with gradient-boosted regression, then transformed back to cfs.
- **Features (15):** antecedent precipitation over 1, 3, 7, 14 and 30 days; temperature and its 30-day anomaly; soil moisture and its 7-day mean; day-of-year (sin, cos); and log drainage area, basin slope, elevation and soil permeability. Each feature on day *t* uses only data from day *t* or earlier. A test enforces this.
- **Protocol: leave-basin-out.** Five-fold `GroupKFold` over stations. Whole stations are held out together, so every score describes a river the model has not trained on.
- **Metrics:** RMSE, extreme-event RMSE, MAE and R² on cfs, pooled over out-of-fold predictions. "Extreme" means the observed flow is at or above that station's 95th percentile over its own record. That threshold selects evaluation days by observed flow only, and it is never used for training.

## Honesty rules (enforced in code)

- `/api/metrics` returns values **only** when they come from a live evaluation. Demo scores are never returned, so the page keeps showing `TBD` until real results exist.
- Every estimate carries a disclaimer: it is a statistical estimate, not an official forecast or warning.
- Estimates warn when the model was trained on different data than the inputs, when catchment attributes are missing, and when days lack complete forcing.
- Demo mode is visibly labelled in the API, in the footer, and in the estimator panel.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/status` | data mode, dataset and model state |
| GET | `/api/stations` | training stations with attributes |
| GET | `/api/stations/{site_no}/series?start&end` | observed flow and out-of-fold predictions |
| POST | `/api/estimate` | `{latitude, longitude, start, end, rcode?}` → daily cfs, peak, warnings |
| GET | `/api/estimates?limit` | recent estimate requests (SQLite audit trail) |
| GET | `/api/metrics` | published evaluation (or `pending`) |

Estimate windows are limited to 366 days and cannot end in the future. Invalid input returns 422, and upstream failures return 502.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `FLOODCAST_SOURCE_MODE` | `live` | `live` or `demo` |
| `FLOODCAST_DATA_DIR` | `backend/data` | cache, dataset, models, SQLite |
| `FLOODCAST_STATIONS_CSV` | `backend/stations.csv` | station list for `fetch` |
| `FLOODCAST_HTTP_TIMEOUT` | `30` | seconds per upstream request |

## Limitations

- Daily resolution can flatten flash peaks that last only hours.
- Ungauged basins depend on catchment attributes, so error grows where they are sparse or wrong.
- Predictions have no uncertainty ranges yet.
- Dams, levees and urban drainage are not modeled explicitly.
- Upstream API shapes were checked against their documentation and against fixtures in the tests. They have not been exercised against the live services from the build sandbox, which cannot reach them. Run `fetch` on a machine with internet access before relying on live results.
- The API has no authentication or rate limiting. Put it behind a reverse proxy before exposing it publicly.
