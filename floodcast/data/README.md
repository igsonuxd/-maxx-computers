# Data directory

- `official/` — drop the Hour-0 competition files here: `train.csv`, `test.csv`,
  `sample_submission.csv`, `station_metadata.csv`. When present, `ml/solution.py`
  uses them automatically (mode=official_csv) and the demo generator is bypassed.
- `station_metadata.csv` — generated from `ml/config.py` (5 starter stations).
- Without official files the pipeline runs in labelled DEMO mode (physics-based
  synthetic series) so every code path is testable. NEVER submit demo predictions.
- `python ml/solution.py --live` instead downloads real USGS (param 00060) +
  Open-Meteo archive data (needs internet egress: Colab/local/Vercel — not this sandbox).
