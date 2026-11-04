# FLOODCAST — Requirement Traceability Matrix

> Sources read line-by-line:
> - **[B]** `floodcast_student_friendly_brief.pdf` — 4 pages, FULLY extracted 2026-11-04.
> - **[M]** User MASTER DEVELOPMENT PROMPT §§1–3 (received; text ends mid-sentence in §3 at "…duplicate reco").
> - **[P]** `FLOODCAST_Participant_PS_Updated.pdf` (Version 1.0, Nov 2026) — ⚠️ **NOT YET RECEIVED.** Brief states: *"For exact dataset fields, scoring rules, file formats and submission instructions, follow the original challenge brief."* When uploaded, re-run the reconciliation checklist at the bottom of this file. Nothing below marked [B] should be assumed to override [P].

## A. Official ML task (DO NOT CHANGE)

| # | Requirement | Source | Implementation | Status |
|---|---|---|---|---|
| A1 | Regression: predict `discharge_cfs` (number, non-negative) for every `station_id`+`date` in `test.csv` | B §2, M §2 | `floodcast/ml/solution.py` → `predictions.csv`; web inference in `src/lib/floodcast/model.ts` | ✅ |
| A2 | Must NOT be SAFE/FLOOD-only classification (risk classes allowed only as extra) | B §1/§2, M §2 | Primary output always cfs number; risk level derived secondarily | ✅ |
| A3 | Nonlinear hydrology, station differences, rare extremes, unseen-station generalisation, historical behaviour | M §2, B §8 | Tree ensembles + log-ridge ensemble; catchment features; extreme sample-weighting; LOSO-CV; lag/rolling/API features | ✅ |
| A4 | Scoring: RMSE 40% · Extreme-RMSE (top-10%/station) 30% · MAE 20% · R² 10%; leaderboard = raw RMSE | B §6 | `ml/evaluate.py` computes exactly these + NSE/KGE (extra, hydrology standard) | ✅ |
| A5 | `predictions.csv`: exactly `station_id,date,discharge_cfs` (order matters), 1 row/test row, non-negative, no NaN, UTF-8 | B §5 | `ml/validate_submission.py` (also mirrored in web Submission page) | ✅ |
| A6 | Rules: no test-target leakage, no hand-edited predictions, no pre-built pre-event model, no sharing, teams 1–4 | B §7 | Model B (weather+catchment only) for official file; generated ONLY by running code; declared in `model_card.md` | ✅ |
| A7 | Allowed: any ML framework; pre-trained only if declared; add USGS stations; feature engineering | B §7 | scikit-learn; none pre-trained; station list config-driven | ✅ |
| A8 | Deliverables: public GitHub repo (code + README + requirements), `predictions.csv`, `README.md` (team, members, 3–5 sentence approach, run instructions), `model_card.md` (features, model type, train/val RMSE, limitations), 3–5 slide presentation (Problem→Data→Model→Results→Limitations) | B §9 | `floodcast/README.md`, `floodcast/requirements.txt`, `floodcast/model_card.md`, `floodcast/PRESENTATION.md`, `floodcast/outputs/predictions.csv` | ✅ (fill team names) |
| A9 | Repo structure: `README.md`, `requirements.txt`, `solution.ipynb` **or** `solution.py`, `predictions.csv`, `model_card.md` | B §9 | `floodcast/ml/solution.py` (+ structure documented in `floodcast/README.md`) | ✅ |
| A10 | Timeline: H0 release · H1 walkthrough · H6 check-in · **H20 deadline (no late)** · H22 presentations (3 min) · H24 winners | B §10 | Countdown + checklist on web Submission page | ✅ |

## B. Data (all three sources compulsory)

| # | Requirement | Source | Implementation | Status |
|---|---|---|---|---|
| B1 | USGS NWIS daily discharge, param `00060`, cfs, station IDs, dates, quality flags | M §3, B §3 | `ml/ingest.py: fetch_usgs_daily()` (waterservices JSON); web live hook `useLiveStation` | ✅ code; ⚠️ sandbox has no USGS egress — runs in browser/Vercel/Colab |
| B2 | Starter stations 01646500, 07010000, 08158000, 02087500, 11447650 | M §3 | `ml/config.py STATIONS`; `data/station_metadata.csv` | ✅ |
| B3 | Open-Meteo: `precipitation_sum`, `temperature_2m_max`, `temperature_2m_min`, `soil_moisture_0_to_7cm`, matched by lat/lon/date | M §3, B §3 | `ml/ingest.py: fetch_openmeteo_archive()`; web `fetchWeather()` (archive + forecast APIs) | ✅ code |
| B4 | StreamStats: `DRNAREA`, `ELEV`, `FOREST`, `SLOPE_PCT` (+ impervious, other catchment attrs) | M §3, B §3 | `ml/config.py` per-station values (⚠️ approximate public values — verify per station in StreamStats before final submission; flagged in `model_card.md`) | ⚠️ verify |
| B5 | Joins: discharge↔StreamStats on `station_id`; weather on lat/lon/date; validate missing/dupes | M §3, B §3/§8 | `ml/ingest.py: build_dataset()` with dedupe, date parse, missing-value report, forward-fill ≤3d soil moisture | ✅ |
| B6 | Files: `train.csv`, `test.csv`, `sample_submission.csv` (zeros), `station_metadata.csv` | B §4 | Loader prefers official files in `floodcast/data/official/`; else generates clearly-labelled demo equivalents so the pipeline is runnable end-to-end **today**. ⚠️ Demo data must be replaced by official/starter data at Hour 0 — see `data/README.md` | ⚠️ awaiting official files |

## C. Website extension (Master Prompt §§1–3 + SOS) — extension, NOT a replacement

| # | Requirement | Source | Implementation | Status |
|---|---|---|---|---|
| C1 | Answers: how much water / approaching danger? / flood possibility / affected locations / who to warn / SOS contact / location-specific rescue info | M §1 | Dashboard + Station pages + Map + Alerts + SOS + Rescue | ✅ |
| C2 | Two communicating components: (A) prediction/early-warning, (B) SOS/rescue coordination | M §1 | SOS auto-attaches nearest station + live risk; Rescue triage uses station risk; alerts generated from predictions | ✅ |
| C3 | Real-time monitoring + early warnings | M §1 | Client-side live USGS + Open-Meteo (free, no keys, CORS); provenance badges (LIVE vs OFFLINE FALLBACK); auto-refresh | ✅ |
| C4 | Emergency SOS with location-specific info to response teams | M §1 | `/floodcast/sos` (geolocation, water level, people, medical) → Postgres (memory fallback) → `/floodcast/rescue` triage board (NEW→ACKNOWLEDGED→DISPATCHED→RESCUED/CLOSED) | ✅ |
| C5 | Genuinely working end-to-end > pretty non-functional frontend | M intro | Trained parameters exported from Python (`model_params.json`) drive web inference; CSV upload→predictions download; persistence + APIs | ✅ |

## D. Differences / gaps between documents
1. [B] is explanatory; [P] is authoritative for exact fields/scoring — [P] not yet available (risk R1).
2. [M] adds the entire website + SOS layer and NSE/KGE-style hydrology thinking; [B] official auto-score has **no manual/website component** — website must never dilute `predictions.csv` quality. Priority order in code comments reflects this.
3. [M] §3 ends mid-sentence; §§4+ (presumed UI/ML/SOS detail) not received — implemented to [M] §1 objectives; reconcile when full text arrives (risk R2).

## E. Reconciliation checklist (run when Participant PS / full prompt / official CSVs arrive)
- [ ] Diff [P] dataset column names vs `ml/config.py` (esp. soil-moisture layer + any extra weather vars, impervious column name).
- [ ] Confirm scoring normalisation + whether LOSO/unseen stations appear in hidden test.
- [ ] Drop official `train.csv/test.csv/sample_submission.csv/station_metadata.csv` into `floodcast/data/official/`, re-run `python ml/solution.py`, re-validate, refresh `model_card.md` numbers.
- [ ] Verify StreamStats values per station in https://streamstats.usgs.gov/ss/ and update `ml/config.py`.
- [ ] Verify NWS flood-stage discharge per station (web thresholds are percentile-derived demo proxies — labelled as such in UI).
- [ ] Fill team name/members in `floodcast/README.md`; export `PRESENTATION.md` to 3–5 slide PDF.
