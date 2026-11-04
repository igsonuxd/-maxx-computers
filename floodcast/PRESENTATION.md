# FLOODCAST — Presentation (3–5 slides · 3 minutes · Brief §9)
> Export to PDF (e.g. Marp / Google Slides). Replace demo metrics after the official-data run.

## Slide 1 — PROBLEM · Predict the Surge Before It Strikes
- Floods kill and displace; hours of warning save lives.
- Task: predict a NUMBER — daily discharge (`discharge_cfs`) — for every station+date in `test.csv`.
- Scoring reality: RMSE 40% + **Extreme-RMSE 30%** → missing the peak = losing. Peaks first, always.

## Slide 2 — DATA · Three public sources, one join
- USGS NWIS daily discharge (param 00060) = target · Open-Meteo weather (rain, Tmax/Tmin, soil moisture) by lat/lon/date · StreamStats catchment (DRNAREA, ELEV, FOREST, SLOPE_PCT, impervious) by station_id.
- 5 starter stations: Potomac DC, Mississippi St. Louis, Colorado Austin, Neuse NC, Sacramento CA — 5 climate regimes, basins from 1,150 → 701,000 sq-mi.
- [Show: station map + hydrograph vs rainfall]

## Slide 3 — MODEL · Hydrology in the features, regionalisation in the target
- Features: rain lags/rolling/API antecedent indices, soil-moisture memory, rain×soil, melt proxy, seasonality, catchment.
- Target trick: regress **log specific discharge** q/area → one model scales from Neuse to Mississippi and transfers to ungauged basins.
- Ensemble Ridge + RandomForest + HistGradientBoosting, 4× weight on top-decile days. Two validation lenses: time-split + Leave-One-Station-Out.
- Leakage discipline: official model never sees test-period discharge.

## Slide 4 — RESULTS · (refresh with official run)
- Time-split R²/NSE ≈ 0.93, KGE ≈ 0.96; LOSO pooled R² ≈ 0.48 (honest ungauged-basin difficulty) — demo rehearsal numbers, pipeline-verified.
- `predictions.csv` auto-validated against every rejection rule (columns, order, coverage, non-negative, UTF-8).
- [Show: predicted vs observed hydrograph incl. a flood peak]

## Slide 5 — BEYOND THE CSV + LIMITATIONS
- Live platform: real-time USGS + Open-Meteo → 7-day ML forecast → risk map → alerts → geolocated SOS → rescue triage. Prediction and response in one loop.
- Limitations: point weather fails the Mississippi mega-basin (needs basin-averaged rain + upstream gauges); percentile thresholds ≠ official NWS flood stage; regulated rivers break natural-flow assumptions; record extremes are capped, not extrapolated.
- Next: gridded basin precipitation, quantile heads for extremes, NWS stage integration, SMS alerting.
