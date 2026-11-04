"""FastAPI service: station data, out-of-fold series, live estimates, honest metrics.

Endpoints
  GET  /api/health                         liveness
  GET  /api/status                         data mode, dataset and model state
  GET  /api/stations                       stations in the training set
  GET  /api/stations/{site_no}/series      observed flow + out-of-fold predictions
  POST /api/estimate                       daily flow estimate for any point
  GET  /api/estimates                      recent estimate requests (audit trail)
  GET  /api/metrics                        evaluation results, published only when live
  /                                        the FLOODCAST web page
"""
from __future__ import annotations

import json
import logging
from datetime import date
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator

from . import config
from . import model as fm
from . import store
from .dataset import load_dataset, read_dataset_meta, window
from .features import CORE_FEATURES, FEATURE_COLUMNS, build_features, forcing_start, missing_attribute_codes
from .providers import get_provider
from .sources import SourceError
from .util import clean, utc_now_iso

log = logging.getLogger("floodcast.api")

DISCLAIMER = (
    "Statistical estimate from a machine-learning model. It is not an official forecast or flood "
    "warning. For warnings, follow your local authority's alerts."
)
LIVE_SOURCES = ["USGS NWIS (discharge)", "Open-Meteo (rainfall, temperature, soil moisture)", "StreamStats (catchments)"]
COVERAGE_NOTE = (
    "USGS and StreamStats cover the United States. Live estimates elsewhere can fail, or return "
    "fewer catchment attributes."
)

app = FastAPI(title="FLOODCAST API", version="0.1.0")

_artifact_cache: dict[str, tuple[Any, Any]] = {}


def _cached(key: str, path: Any, loader: Any) -> Any:
    """Reload an artifact whenever its file changes on disk."""
    stamp = path.stat().st_mtime_ns if path.exists() else None
    hit = _artifact_cache.get(key)
    if hit is not None and hit[0] == stamp:
        return hit[1]
    value = loader() if stamp is not None else None
    _artifact_cache[key] = (stamp, value)
    return value


def _load_bundle() -> dict[str, Any] | None:
    return _cached("bundle", config.MODEL_PATH, fm.load_bundle)


def _load_dataset() -> pd.DataFrame | None:
    return _cached("dataset", config.DATASET_PATH, load_dataset)


def _load_oof() -> pd.DataFrame | None:
    return _cached(
        "oof", config.OOF_PATH,
        lambda: pd.read_csv(config.OOF_PATH, parse_dates=["date"], dtype={"site_no": str}),
    )


def _load_json(path: Any) -> Any:
    return json.loads(path.read_text()) if path.exists() else None


# ------------------------------------------------------------------ models
class EstimateRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    start: date
    end: date
    rcode: str | None = Field(default=None, pattern=r"^[A-Za-z]{2}$")

    @model_validator(mode="after")
    def _check_window(self) -> "EstimateRequest":
        if self.end < self.start:
            raise ValueError("end must be on or after start")
        if (self.end - self.start).days + 1 > config.MAX_ESTIMATE_DAYS:
            raise ValueError(f"the window may be at most {config.MAX_ESTIMATE_DAYS} days")
        if self.end > date.today():
            raise ValueError("end cannot be in the future")
        return self


# ------------------------------------------------------------------ endpoints
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/status")
def status() -> dict[str, Any]:
    bundle = _load_bundle()
    dataset_meta = read_dataset_meta() or {}
    evaluation = _load_json(config.METRICS_PATH)
    model_meta = (bundle or {}).get("meta", {})
    return clean({
        "source_mode": config.SOURCE_MODE,
        "estimate_source": get_provider().name,
        "dataset": {
            "available": bool(dataset_meta),
            "data_source": dataset_meta.get("data_source"),
            "n_stations": dataset_meta.get("n_stations"),
            "n_rows": dataset_meta.get("n_rows"),
            "start": dataset_meta.get("start"),
            "end": dataset_meta.get("end"),
        },
        "model": {
            "trained": bundle is not None,
            "trained_at": model_meta.get("trained_at"),
            "data_source": model_meta.get("data_source"),
        },
        "evaluation": {"available": evaluation is not None},
        "live_sources": LIVE_SOURCES,
        "coverage_note": COVERAGE_NOTE,
    })


@app.get("/api/stations")
def stations() -> list[dict[str, Any]]:
    meta = _load_json(config.STATIONS_PATH) or {}
    keys = ("name", "latitude", "longitude", "n_days", "first_date", "last_date", "missing_attributes")
    return clean([{"site_no": site, **{k: info.get(k) for k in keys}} for site, info in meta.items()])


@app.get("/api/stations/{site_no}/series")
def station_series(site_no: str, start: date | None = None, end: date | None = None) -> dict[str, Any]:
    dataset = _load_dataset()
    if dataset is None:
        raise HTTPException(404, "No dataset yet. Run `python -m floodcast demo` or `fetch` first.")
    sub = dataset[dataset["site_no"] == site_no]
    if sub.empty:
        raise HTTPException(404, f"Unknown station {site_no}.")
    if start or end:
        sub = window(sub, start or sub.index.min().date(), end or sub.index.max().date())
    if sub.empty:
        raise HTTPException(404, "No observations in that date range.")

    oof = _load_oof()
    predicted = None
    if oof is not None:
        held = oof[oof["site_no"] == site_no].set_index("date")["predicted_cfs"]
        predicted = held.reindex(sub.index).to_numpy(dtype=float)

    observed = sub["discharge_cfs"].to_numpy(dtype=float)
    peak = None
    if np.isfinite(observed).any():
        i = int(np.nanargmax(observed))
        peak = {"date": sub.index[i].date().isoformat(), "cfs": float(observed[i])}

    return clean({
        "site_no": site_no,
        "units": "cfs",
        "dates": [d.date().isoformat() for d in sub.index],
        "observed_cfs": observed,
        "predicted_out_of_fold_cfs": predicted,
        "peak_observed": peak,
        "note": "Predictions are out-of-fold: this station was held out of training when its score was made.",
    })


@app.post("/api/estimate")
def estimate(req: EstimateRequest) -> dict[str, Any]:
    bundle = _load_bundle()
    if bundle is None:
        raise HTTPException(503, "The model has not been trained yet. Run `python -m floodcast demo`, "
                                 "or `fetch` and then `train`.")
    provider = get_provider()
    try:
        forcing = provider.fetch_forcing(req.latitude, req.longitude, forcing_start(req.start), req.end)
        attrs = provider.fetch_attributes(req.latitude, req.longitude, req.rcode)
    except SourceError as exc:
        raise HTTPException(502, f"Upstream data unavailable: {exc}") from exc

    features = window(build_features(forcing, attrs), req.start, req.end)
    if features.empty:
        raise HTTPException(422, "No forcing data is available for that period.")

    flow = fm.predict_cfs(bundle["model"], features[list(FEATURE_COLUMNS)])
    incomplete = features[list(CORE_FEATURES)].isna().any(axis=1).to_numpy()
    flow = np.where(incomplete, np.nan, flow)
    series = pd.Series(flow, index=features.index).dropna()

    peak = None
    if not series.empty:
        peak = {"date": series.idxmax().date().isoformat(), "cfs": float(series.max())}

    model_meta = bundle.get("meta", {})
    missing = missing_attribute_codes(attrs)
    warnings: list[str] = []
    if model_meta.get("data_source") != provider.name:
        warnings.append(f"The model was trained on '{model_meta.get('data_source')}' data; "
                        f"this estimate uses '{provider.name}' inputs.")
    if missing:
        warnings.append(f"Catchment attributes not found: {', '.join(missing)}. Estimates are less reliable.")
    if incomplete.any():
        warnings.append("Some days lack complete rainfall, temperature or soil data and were left blank.")

    estimate_id = None
    try:
        estimate_id = store.record_estimate(
            created_at=utc_now_iso(),
            latitude=req.latitude, longitude=req.longitude, rcode=req.rcode,
            start_date=req.start.isoformat(), end_date=req.end.isoformat(),
            data_source=provider.name,
            peak_date=peak["date"] if peak else None,
            peak_cfs=peak["cfs"] if peak else None,
            missing_attributes=",".join(missing),
        )
    except Exception:  # persistence is an audit trail; never fail an estimate because of it
        log.exception("Could not record estimate")

    return clean({
        "id": estimate_id,
        "location": {"latitude": req.latitude, "longitude": req.longitude, "rcode": req.rcode},
        "period": {"start": req.start.isoformat(), "end": req.end.isoformat()},
        "units": "cfs",
        "data_source": provider.name,
        "model": {"trained_at": model_meta.get("trained_at"), "data_source": model_meta.get("data_source")},
        "attributes": {k: attrs.get(k) for k in ("DRNAREA", "BSLDEM250", "ELEV", "SOILPERM")},
        "missing_attributes": missing,
        "dates": [d.date().isoformat() for d in features.index],
        "estimated_cfs": series.reindex(features.index).to_numpy(dtype=float),
        "peak": peak,
        "warnings": warnings,
        "disclaimer": DISCLAIMER,
    })


@app.get("/api/estimates")
def estimates(limit: int = 20) -> list[dict[str, Any]]:
    return clean(store.recent_estimates(max(1, min(limit, 200))))


@app.get("/api/metrics")
def metrics() -> dict[str, Any]:
    """Evaluation results. Published only when they come from live data.

    Scores from synthetic demo data are never returned as values, so the page keeps showing TBD.
    """
    report = _load_json(config.METRICS_PATH)
    if report is None:
        return {"status": "pending", "values": None,
                "message": "No evaluation has been run yet."}
    if report.get("data_source") != config.DATA_SOURCE_LIVE:
        return {"status": "pending", "values": None, "demo": True,
                "message": "Metrics come from synthetic demo data and are not published."}
    return clean({
        "status": "evaluated",
        "values": report["metrics"],
        "protocol": report.get("protocol"),
        "extreme_definition": report.get("extreme_definition"),
        "n_stations": report.get("n_stations"),
        "n_rows": report.get("n_rows"),
        "n_extreme_rows": report.get("n_extreme_rows"),
        "generated_at": report.get("generated_at"),
        "data_source": report.get("data_source"),
    })


if config.WEB_DIR.exists():
    app.mount("/", StaticFiles(directory=str(config.WEB_DIR), html=True), name="web")
