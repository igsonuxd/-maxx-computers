# 🌊 FLOODCAST — Predict the Surge Before It Strikes

**Team:** _FILL IN — team name_ · **Members (1–4):** _FILL IN names_
**Event:** Disaster Risk & Early Warning Systems · 24-Hour Hackathon (FLOODCAST Participant PS v1.0, Nov 2026)

## Approach (3–5 sentences)
We predict daily river discharge (`discharge_cfs`) by joining USGS NWIS daily discharge (parameter 00060), Open-Meteo historical weather (`precipitation_sum`, `temperature_2m_max/min`, `soil_moisture_0_to_7cm`, matched by station lat/lon/date) and USGS StreamStats catchment features (`DRNAREA`, `ELEV`, `FOREST`, `SLOPE_PCT`, impervious %) on `station_id`. Features encode hydrology — rainfall lags/rolling sums, antecedent-precipitation indices, soil-moisture and temperature windows, rain×soil interaction, snowmelt proxy and seasonality — and a Ridge + RandomForest + HistGradientBoosting ensemble regresses **log specific discharge** (q/area) so the model regionalises to unseen basins, with 4× sample weight on top-decile flow days because 30% of the score is extreme-event RMSE. The same trained model powers a live early-warning + emergency SOS web platform (`/floodcast` in this repo) that fetches real-time USGS/Open-Meteo data, forecasts 7 days ahead, and routes geolocated SOS requests to a rescue-triage dashboard. Validation uses both a final-year time split and Leave-One-Station-Out CV, scored with the official weights (RMSE 40% · Extreme-RMSE 30% · MAE 20% · R² 10%) plus NSE/KGE.

## Run the official solution
```bash
cd floodcast
pip install -r requirements.txt
# Hour 0: place official files in data/official/ (train.csv, test.csv,
# sample_submission.csv, station_metadata.csv) — auto-detected.
python ml/solution.py            # -> outputs/predictions.csv (auto-validated)
python ml/validate_submission.py outputs/predictions.csv data/official/test.csv
python ml/test_pipeline.py       # tests
# No official files yet? It runs in labelled DEMO mode so you can rehearse.
# Real-data mode (needs internet):  python ml/solution.py --live
```

## Run the web platform
```bash
npm install && npm run dev       # http://localhost:3000/floodcast
# Optional Postgres for SOS persistence: set DATABASE_URL (see ../.env.example),
# then: npm run db:push
```

## Repository map (Brief §9)
| Item | Location |
|---|---|
| `README.md` | this file (+ root README for the host site) |
| `requirements.txt` | `floodcast/requirements.txt` |
| `solution.py` | `floodcast/ml/solution.py` (+ `ingest/features/evaluate/validate_submission.py`) |
| `predictions.csv` | `floodcast/outputs/predictions.csv` |
| `model_card.md` | `floodcast/model_card.md` |
| Presentation (3–5 slides) | `floodcast/PRESENTATION.md` → export to PDF |
| Requirements traceability | `floodcast/REQUIREMENTS.md` |
| Web platform | `src/app/floodcast/*`, `src/lib/floodcast/*`, `src/app/api/floodcast/*` |

## Timeline discipline (Brief §10)
H0 data release → drop CSVs in `data/official/`, re-run solution · H6 check-in · **H20 hard deadline (GitHub link + predictions.csv, no late submissions)** · H22 3-min presentation · H24 winners.

## Data sources
- USGS National Water Information System — https://waterdata.usgs.gov/nwis/dv (param 00060)
- Open-Meteo Historical Weather API — https://open-meteo.com/en/docs/historical-weather-api
- USGS StreamStats — https://streamstats.usgs.gov/ss/

⚠️ **Honesty notice:** until official CSVs / live egress are available the pipeline rehearses on a clearly-labelled physics-based DEMO dataset (`source=demo_synthetic`). Never submit demo predictions. Live website values are fetched from the real USGS/Open-Meteo APIs in the visitor's browser; if unreachable, the UI shows an explicit OFFLINE FALLBACK badge — synthetic values are never presented as real observations.
