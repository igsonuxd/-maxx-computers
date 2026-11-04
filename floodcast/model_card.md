# FLOODCAST — Model Card

## Task
Regression of peak daily river discharge `discharge_cfs` (non-negative number) for every `station_id`+`date` in `test.csv`. Risk categories in the web UI are derived secondarily — never a substitute for the numeric prediction (Brief §§1-2).

## Model type
Ensemble (mean) of Ridge + Random Forest (300 trees) + HistGradientBoosting, all regressing **log specific discharge** `log(q / DRNAREA)`; final `q = exp(pred) × DRNAREA`, clipped to `[0, 3 × max-train-specific × DRNAREA]`. Top-decile (per-station) flow days receive 4× sample weight (extreme RMSE = 30% of score). Framework: scikit-learn (allowed, Brief §7). No pre-trained models; nothing pre-built before the event; `predictions.csv` is generated only by running `ml/solution.py` (never hand-edited).

Two heads, one feature contract:
- **Model B (official file):** weather + catchment + seasonality only. Test targets are never inputs (no leakage).
- **Model A (live web only):** Ridge on Model-B features + lags of *observed* USGS discharge; coefficients exported to the web app. At inference, multi-day forecasts recurse on their own predictions.

## Features used
Weather (Open-Meteo, lat/lon/date): `precipitation_sum`, `temperature_2m_max`, `temperature_2m_min`, `soil_moisture_0_to_7cm` (+ derived temp mean). Rainfall lags 1/2/3/7d, rolling sums & maxima 3/7/14/30/90d, antecedent-precipitation indices (decay 0.85/0.92/0.97), soil-moisture & temperature lag/7d/30d means, rain×soil interaction, elevation-scaled melt proxy. Catchment (StreamStats, `station_id`): `ELEV`, `FOREST`, `SLOPE_PCT`, `IMPERVIOUS`, `log(DRNAREA)` (raw area excluded — scale enters via the specific-discharge target). Location lat/lon; seasonality day-of-year sin/cos + month. Model A adds discharge lags 1/2/3/7/14d and 7/14/30d rolling mean/max.

### Feature importance (Random Forest, Model B)
| Feature | Importance |
|---|---|
| precip_roll3 | 0.424 |
| soil_moisture_0_to_7cm | 0.212 |
| log_drnarea | 0.144 |
| SLOPE_PCT | 0.068 |
| api_85 | 0.042 |
| rain_x_soil | 0.031 |
| precipitation_sum | 0.024 |
| precip_max3 | 0.016 |
| precip_lag3 | 0.005 |
| soil_moisture_0_to_7cm_lag1 | 0.004 |
| precip_lag1 | 0.004 |
| precip_max7 | 0.003 |

## Validation results (official metric weights: RMSE 40% · Extreme-RMSE 30% · MAE 20% · R² 10%)
> ⚠️ Current numbers are from the labelled DEMO rehearsal dataset (`data_mode=demo_synthetic`) because official CSVs arrive at Hour 0. Re-run `python ml/solution.py` with files in `data/official/` (or `--live`) and this section must be refreshed before submission. Pooled RMSE is dominated by the Mississippi's discharge scale — inspect per-station values in `outputs/metrics.json`.

| Split | RMSE | Extreme-RMSE | MAE | R² | NSE | KGE |
|---|---|---|---|---|---|---|
| Time split (final 20% of dates) | 17,443 | 22,612 | 5,979 | 0.927 | 0.927 | 0.958 |
| Leave-One-Station-Out (unseen stations) | 46,394 | 56,160 | 18,867 | 0.484 | 0.484 | 0.475 |
| Demo test-period estimate (truth known in demo only) | 25,265 | 34,507 | 7,416 | 0.849 | 0.849 | 0.751 |

## Known limitations
1. **Mississippi at St. Louis (07010000)** generalises poorly (negative per-station R² in demo): weather at one lat/lon cannot represent a 701,000 sq-mi basin. Fix path: basin-averaged gridded precipitation, upstream-gauge lags, longer API windows.
2. StreamStats values in `ml/config.py` are approximate published values — verify each in StreamStats before final run (REQUIREMENTS.md B4).
3. Web flood thresholds are historical-percentile proxies (q90/q95/q98), **not** official NWS flood-stage discharges — replace and re-label when sourced. Never use this demo for real evacuation decisions.
4. Soil moisture is reanalysis (ERA5 via Open-Meteo), not in-situ; snowmelt is a temperature proxy, not a snow model.
5. Regulated/dammed reaches (e.g. Colorado River at Austin below Highland Lakes) violate natural rainfall-runoff assumptions.
6. Extreme extrapolation beyond the training range is capped, which can under-predict record floods; quantile/EVT heads are future work.
7. Demo-mode metrics measure pipeline correctness, not real-world skill.

## Reproducibility
`pip install -r requirements.txt && python ml/solution.py` — seeded (RANDOM_SEED=42), auto-validates `predictions.csv` against all Brief §5 rejection rules, writes `outputs/metrics.json` + `outputs/model_params.json`.
