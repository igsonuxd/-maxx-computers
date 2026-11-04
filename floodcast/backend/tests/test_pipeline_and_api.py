import json
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from floodcast import config, sources
from floodcast.api import app
from floodcast.features import FEATURE_COLUMNS
from floodcast.sources import SourceError

client = TestClient(app)


@pytest.fixture(scope="module")
def ready(demo_data):
    return demo_data


def test_health_and_index_page(ready):
    assert client.get("/api/health").json() == {"status": "ok"}
    page = client.get("/")
    assert page.status_code == 200
    assert "FLOODCAST" in page.text


def test_status_reports_demo_data_and_trained_model(ready):
    body = client.get("/api/status").json()
    assert body["dataset"]["data_source"] == "synthetic-demo"
    assert body["model"]["trained"] is True
    assert body["model"]["data_source"] == "synthetic-demo"
    assert body["estimate_source"] == "synthetic-demo"


def test_stations_listed_with_attributes(ready):
    stations = client.get("/api/stations").json()
    assert len(stations) == 6
    assert all(s["site_no"].startswith("DEMO-") for s in stations)


def test_station_series_is_out_of_fold_and_aligned(ready):
    body = client.get("/api/stations/DEMO-01/series", params={"start": "2005-01-01", "end": "2005-12-31"}).json()
    n = len(body["dates"])
    assert n == 365
    assert len(body["observed_cfs"]) == n == len(body["predicted_out_of_fold_cfs"])
    assert body["peak_observed"]["cfs"] == max(v for v in body["observed_cfs"] if v is not None)


def test_unknown_station_is_404(ready):
    assert client.get("/api/stations/NOPE/series").status_code == 404


def test_metrics_stay_pending_for_demo_data(ready):
    body = client.get("/api/metrics").json()
    assert body["status"] == "pending"
    assert body["values"] is None
    assert body["demo"] is True


def test_metrics_published_only_from_live_evaluation(ready, tmp_path, monkeypatch):
    report = {
        "data_source": "live", "protocol": "p", "extreme_definition": "e", "n_stations": 9,
        "n_rows": 100, "n_extreme_rows": 5, "generated_at": "2026-01-01T00:00:00+00:00",
        "metrics": {"rmse_cfs": 1.0, "extreme_rmse_cfs": 2.0, "mae_cfs": 0.5, "r2": 0.8},
    }
    path = tmp_path / "metrics.json"
    path.write_text(json.dumps(report))
    monkeypatch.setattr(config, "METRICS_PATH", path)
    body = client.get("/api/metrics").json()
    assert body["status"] == "evaluated"
    assert body["values"]["r2"] == 0.8


def test_estimate_returns_daily_series_and_peak(ready):
    body = client.post("/api/estimate", json={
        "latitude": 41.7, "longitude": -72.7, "start": "2008-03-01", "end": "2008-03-31",
    }).json()
    assert body["units"] == "cfs"
    assert body["data_source"] == "synthetic-demo"
    assert len(body["dates"]) == len(body["estimated_cfs"]) == 31
    assert all(v is None or v >= 0 for v in body["estimated_cfs"])
    assert body["peak"]["date"] in body["dates"]
    assert "not an official forecast" in body["disclaimer"]
    assert body["id"] is not None


def test_estimate_is_recorded_in_history(ready):
    client.post("/api/estimate", json={"latitude": 40.0, "longitude": -100.0,
                                       "start": "2008-06-01", "end": "2008-06-03"})
    rows = client.get("/api/estimates", params={"limit": 5}).json()
    assert rows and rows[0]["latitude"] == 40.0


@pytest.mark.parametrize("payload", [
    {"latitude": 91, "longitude": 0, "start": "2008-01-01", "end": "2008-01-02"},
    {"latitude": 0, "longitude": 181, "start": "2008-01-01", "end": "2008-01-02"},
    {"latitude": 0, "longitude": 0, "start": "2008-01-05", "end": "2008-01-02"},
    {"latitude": 0, "longitude": 0, "start": "2000-01-01", "end": "2008-01-02"},
    {"latitude": 0, "longitude": 0, "start": "2008-01-01", "end": (date.today() + timedelta(days=3)).isoformat()},
    {"latitude": 0, "longitude": 0, "start": "2008-01-01", "end": "2008-01-02", "rcode": "CALIF"},
])
def test_estimate_rejects_invalid_input(ready, payload):
    assert client.post("/api/estimate", json=payload).status_code == 422


def test_estimate_reports_upstream_failure_as_502(ready, monkeypatch):
    monkeypatch.setattr(config, "SOURCE_MODE", "live")

    def boom(*args, **kwargs):
        raise SourceError("upstream down")

    monkeypatch.setattr(sources, "fetch_forcing", boom)
    response = client.post("/api/estimate", json={"latitude": 41.0, "longitude": -72.0,
                                                  "start": "2008-01-01", "end": "2008-01-05"})
    assert response.status_code == 502
    assert "upstream down" in response.json()["detail"]


def test_model_features_are_consistent(ready):
    from floodcast import model as fm
    bundle = fm.load_bundle()
    assert bundle is not None
    assert len(FEATURE_COLUMNS) == 15


def test_evaluation_is_leave_basin_out(ready):
    from floodcast.evaluate import evaluate
    from floodcast.dataset import load_dataset
    ds = load_dataset()
    report = evaluate(ds.loc["2000-01-01":"2002-12-31"], "synthetic-demo", n_splits=3)
    held = [set(f["test_stations"]) for f in report["folds"]]
    assert set().union(*held) == set(ds["site_no"].unique())
    for i in range(len(held)):
        for j in range(i + 1, len(held)):
            assert not (held[i] & held[j]), "a station appeared in two test folds"
    for value in report["metrics"].values():
        assert value is None or value == value  # finite or explicitly absent, never NaN
