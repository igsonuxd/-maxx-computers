"""FLOODCAST — official end-to-end solution (Brief §8 steps 1-8).

Run:  cd floodcast && pip install -r requirements.txt && python ml/solution.py [--live]
Out:  outputs/predictions.csv (validated), outputs/metrics.json,
      outputs/model_params.json (+ copy into the web app), data/station_metadata.csv

Models (all regress on log1p discharge; predictions expm1 + clipped >= 0):
  Model B (official): Ridge + RandomForest + HistGradientBoosting ensemble,
    weather+catchment features ONLY, extreme-day sample weighting.
  Model A (live web): Ridge on B features + observed-discharge lags, exported
    as coefficients for src/lib/floodcast/model.ts. No test leakage: Model A
    lags come from observed USGS history at inference time, never test targets.
Validation: hold-out final-year time split + Leave-One-Station-Out (unseen
station generalisation, Brief §8 step 4).
"""
from __future__ import annotations
import json, sys
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

sys.path.insert(0, str(Path(__file__).parent))
from config import OUTPUTS_DIR, DATA_DIR, WEB_GENERATED, RANDOM_SEED  # noqa: E402
from ingest import load_data, station_metadata_frame  # noqa: E402
from features import add_features, FEATURES_B, FEATURES_A  # noqa: E402
from evaluate import evaluate_frame, extreme_mask  # noqa: E402
from validate_submission import validate  # noqa: E402

TARGET = "discharge_cfs"


def extreme_weights(df):
    m = extreme_mask(df, TARGET)
    return np.where(m, 4.0, 1.0)  # 30% of score is extreme days (Brief §6)


def make_models(seed=RANDOM_SEED):
    return {
        "ridge": make_pipeline(SimpleImputer(strategy="median"),
                               StandardScaler(), Ridge(alpha=1.0)),
        "rf": make_pipeline(SimpleImputer(strategy="median"),
                            RandomForestRegressor(n_estimators=300, min_samples_leaf=2,
                                                   n_jobs=-1, random_state=seed)),
        "hgb": make_pipeline(SimpleImputer(strategy="median"),
                             HistGradientBoostingRegressor(max_iter=400, learning_rate=0.06,
                                                           max_leaf_nodes=63, random_state=seed)),
    }


def to_target(y_cfs, area):
    """Regionalisation: model log SPECIFIC discharge (cfs per sq-mi).
    Unseen-station safe: basin scale re-enters only via multiplication."""
    return np.log(np.clip(np.asarray(y_cfs, float) / np.asarray(area, float), 1e-9, None))


_MAX_SPECIFIC = {"v": None}


def fit_ensemble(models, X, y, w, area):
    ly = to_target(y, area)
    _MAX_SPECIFIC["v"] = float(np.max(np.asarray(y, float) / np.asarray(area, float)))
    for name, m in models.items():
        try:
            m.fit(X, ly, **({f"{m.steps[-1][0]}__sample_weight": w} if name != "ridge" else {}))
        except Exception:
            m.fit(X, ly)
    return models


def predict_ensemble(models, X, area):
    area = np.asarray(area, float)
    preds = [np.exp(m.predict(X)) * area for m in models.values()]
    cap = area * (_MAX_SPECIFIC["v"] or 1e6) * 3.0  # physical sanity cap
    return np.clip(np.mean(preds, axis=0), 0, cap)


def main():
    prefer_live = "--live" in sys.argv
    train_raw, test_raw, hidden_y, mode = load_data(prefer_live=prefer_live)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    station_metadata_frame().to_csv(DATA_DIR / "station_metadata.csv", index=False)

    # ---- feature frames (B: no discharge lags anywhere near test targets)
    full_b = add_features(pd.concat([train_raw, test_raw.assign(**{TARGET: np.nan})])
                          if hidden_y is not None else
                          pd.concat([train_raw, test_raw]), with_discharge_lags=False)
    train = full_b[full_b[TARGET].notna()].copy()
    test = full_b[full_b[TARGET].isna()].copy() if hidden_y is not None else \
        full_b.iloc[len(train_raw):].copy()
    if hidden_y is None:  # official: test rows are exactly test_raw keys
        keys = pd.MultiIndex.from_frame(test_raw[["station_id", "date"]])
        test = full_b.set_index(["station_id", "date"]).loc[keys].reset_index()
        train = full_b[full_b[TARGET].notna()].copy()

    # ---- validation 1: time split (last 20% of train dates)
    cut = train["date"].quantile(0.8)
    tr, va = train[train.date <= cut], train[train.date > cut]
    models = fit_ensemble(make_models(), tr[FEATURES_B], tr[TARGET],
                          extreme_weights(tr), tr["DRNAREA"])
    va = va.assign(pred=predict_ensemble(models, va[FEATURES_B], va["DRNAREA"]))
    m_time = evaluate_frame(va)

    # ---- validation 2: Leave-One-Station-Out (unseen-station generalisation)
    loso_pred = np.full(len(train), np.nan)
    for sid in train.station_id.unique():
        i_tr, i_te = train.station_id != sid, train.station_id == sid
        lite = {k: v for k, v in make_models().items() if k in ("ridge", "hgb")}
        fit_ensemble(lite, train.loc[i_tr, FEATURES_B], train.loc[i_tr, TARGET],
                     extreme_weights(train[i_tr]), train.loc[i_tr, "DRNAREA"])
        loso_pred[np.where(i_te)[0]] = predict_ensemble(
            lite, train.loc[i_te, FEATURES_B], train.loc[i_te, "DRNAREA"])
    m_loso = evaluate_frame(train.assign(pred=loso_pred))

    # ---- final Model B on ALL train -> official predictions.csv
    final = fit_ensemble(make_models(), train[FEATURES_B], train[TARGET],
                         extreme_weights(train), train["DRNAREA"])
    pred = predict_ensemble(final, test[FEATURES_B], test["DRNAREA"])
    out = pd.DataFrame({"station_id": test.station_id.values,
                        "date": pd.to_datetime(test.date).dt.strftime("%Y-%m-%d"),
                        "discharge_cfs": np.round(np.clip(pred, 0, None), 2)})
    pred_path = OUTPUTS_DIR / "predictions.csv"
    out.to_csv(pred_path, index=False, encoding="utf-8")
    test_key_path = OUTPUTS_DIR / "test_keys.csv"
    test_raw.assign(date=pd.to_datetime(test_raw.date).dt.strftime("%Y-%m-%d")) \
        [["station_id", "date"]].to_csv(test_key_path, index=False)
    errs, warns, _ = validate(str(pred_path), str(test_key_path))
    assert not errs, f"predictions.csv INVALID: {errs}"
    print(f"[solution] ✅ predictions.csv valid ({len(out)} rows) warnings={warns}")

    # demo/live modes: we KNOW hidden truth -> honest test-period score estimate
    m_test_est = None
    if hidden_y is not None:
        est = test.drop(columns=[TARGET], errors="ignore").merge(
            hidden_y, on=["station_id", "date"], how="left").assign(pred=pred)
        m_test_est = evaluate_frame(est)

    # ---- Model A (live web) — ridge with observed-discharge lags, exported
    train_a = add_features(train_raw, with_discharge_lags=True).dropna(subset=["log_q_lag1"])
    feats_a = [f for f in FEATURES_A if f in train_a.columns]
    Xa = train_a[feats_a].to_numpy(float)
    med = np.nanmedian(Xa, axis=0)
    Xa = np.where(np.isfinite(Xa), Xa, med)
    scaler = StandardScaler().fit(Xa)
    ridge = Ridge(alpha=10.0).fit(scaler.transform(Xa),
                                  to_target(train_a[TARGET], train_a["DRNAREA"]))
    max_specific = float((train_a[TARGET] / train_a["DRNAREA"]).max())
    # feature importance from final HGB (Model B)
    hgb = final["hgb"].steps[-1][1]
    importance = {}
    try:
        rf = final["rf"].steps[-1][1]
        importance = {f: float(v) for f, v in
                      sorted(zip(FEATURES_B, rf.feature_importances_),
                             key=lambda kv: -kv[1])[:20]}
    except Exception:
        pass

    # Model B ridge export (web CSV quick-predictor; full ensemble stays Python-side)
    Xb = train[FEATURES_B].to_numpy(float)
    med_b = np.nanmedian(Xb, axis=0)
    Xb = np.where(np.isfinite(Xb), Xb, med_b)
    scaler_b = StandardScaler().fit(Xb)
    ridge_b = Ridge(alpha=10.0).fit(scaler_b.transform(Xb),
                                    to_target(train[TARGET], train["DRNAREA"]))
    model_b_export = {"features": FEATURES_B, "feature_median": med_b.tolist(),
                      "scaler_mean": scaler_b.mean_.tolist(),
                      "scaler_scale": scaler_b.scale_.tolist(),
                      "coef": ridge_b.coef_.tolist(),
                      "intercept": float(ridge_b.intercept_)}

    stations_meta = {}
    for sid, g in train_raw.groupby("station_id"):
        q = g[TARGET]
        stations_meta[str(sid)] = {
            "median_cfs": float(q.median()), "mean_cfs": float(q.mean()),
            "q90_cfs": float(q.quantile(.90)), "q95_cfs": float(q.quantile(.95)),
            "q98_cfs": float(q.quantile(.98)), "q99_cfs": float(q.quantile(.99)),
            "max_cfs": float(q.max()),
            # Demo risk thresholds = historical percentiles. Replace with
            # official NWS flood-stage discharge per station when available.
            "watch_cfs": float(q.quantile(.90)), "warning_cfs": float(q.quantile(.95)),
            "flood_cfs": float(q.quantile(.98)),
        }

    metrics = {"data_mode": mode, "generated": pd.Timestamp.utcnow().isoformat() + "Z",
               "official_weights": {"rmse": 0.40, "extreme_rmse": 0.30, "mae": 0.20, "r2": 0.10},
               "time_split_validation": m_time, "loso_validation": m_loso,
               "test_period_estimate_demo_only": m_test_est,
               "feature_importance_top20": importance,
               "features_B": FEATURES_B, "features_A": feats_a}
    params = {"model": "Ridge(log specific discharge q/DRNAREA) — Model A live export",
              "target_transform": "q_cfs = exp(pred) * DRNAREA, clipped to [0, 3*max_specific*DRNAREA]",
              "max_specific_cfs_per_sqmi": max_specific,
              "features": feats_a, "feature_median": med.tolist(),
              "scaler_mean": scaler.mean_.tolist(), "scaler_scale": scaler.scale_.tolist(),
              "coef": ridge.coef_.tolist(), "intercept": float(ridge.intercept_),
              "stations": stations_meta, "data_mode": mode,
              "model_B_ridge": model_b_export,
              "metrics_summary": {"time_split": {k: m_time[k] for k in
                                  ("rmse", "extreme_rmse", "mae", "r2", "nse", "kge")},
                                  "loso": {k: m_loso[k] for k in
                                  ("rmse", "extreme_rmse", "mae", "r2", "nse", "kge")}}}
    for name, obj in (("metrics.json", metrics), ("model_params.json", params)):
        (OUTPUTS_DIR / name).write_text(json.dumps(obj, indent=2, default=float))
        WEB_GENERATED.mkdir(parents=True, exist_ok=True)
        (WEB_GENERATED / name).write_text(json.dumps(obj, indent=2, default=float))

    print(f"[solution] data_mode={mode}")
    print(f"[solution] time-split  RMSE={m_time['rmse']:.1f}  ExtremeRMSE={m_time['extreme_rmse']:.1f}  "
          f"MAE={m_time['mae']:.1f}  R2={m_time['r2']:.3f}  NSE={m_time['nse']:.3f}  KGE={m_time['kge']:.3f}")
    print(f"[solution] LOSO        RMSE={m_loso['rmse']:.1f}  ExtremeRMSE={m_loso['extreme_rmse']:.1f}  "
          f"MAE={m_loso['mae']:.1f}  R2={m_loso['r2']:.3f}  NSE={m_loso['nse']:.3f}  KGE={m_loso['kge']:.3f}")
    if m_test_est:
        print(f"[solution] test-est    RMSE={m_test_est['rmse']:.1f} (DEMO truth known; official test is hidden)")
    print(f"[solution] wrote {pred_path}, metrics.json, model_params.json (+ web copies)")


if __name__ == "__main__":
    main()
