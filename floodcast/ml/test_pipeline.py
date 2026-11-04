"""Run: cd floodcast && python -m pytest ml/test_pipeline.py -q (or python ml/test_pipeline.py)"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from validate_submission import validate
from evaluate import rmse, mae, r2, extreme_mask
from features import add_features, FEATURES_B, antecedent_precip_index
from config import STATIONS


def test_validator_accepts_good_and_rejects_bad(tmp_path=None):
    import tempfile, os
    d = tmp_path or Path(tempfile.mkdtemp())
    good = pd.DataFrame({"station_id": ["01646500"], "date": ["2024-01-01"], "discharge_cfs": [12.5]})
    good.to_csv(d / "p.csv", index=False)
    errs, _, _ = validate(str(d / "p.csv"))
    assert errs == [], errs
    neg = good.assign(discharge_cfs=[-1.0]); neg.to_csv(d / "n.csv", index=False)
    errs, _, _ = validate(str(d / "n.csv")); assert any("negative" in e for e in errs)
    bad = good.rename(columns={"discharge_cfs": "flow"}); bad.to_csv(d / "b.csv", index=False)
    errs, _, _ = validate(str(d / "b.csv")); assert any("Columns" in e for e in errs)
    assert os.path.exists(d / "p.csv")


def test_metrics_known_values():
    y, p = np.array([1., 2., 3.]), np.array([1., 2., 3.])
    assert rmse(y, p) == 0 and mae(y, p) == 0 and abs(r2(y, p) - 1) < 1e-9
    df = pd.DataFrame({"station_id": ["A"] * 10, "discharge_cfs": range(10)})
    assert extreme_mask(df).sum() >= 1  # top-10% per station non-empty


def test_features_no_future_leak_and_api():
    dates = pd.date_range("2024-01-01", periods=40)
    df = pd.DataFrame({"station_id": "01646500", "date": dates,
                       "precipitation_sum": np.arange(40.), "temperature_2m_max": 20.,
                       "temperature_2m_min": 10., "soil_moisture_0_to_7cm": 0.2,
                       "discharge_cfs": 100., "DRNAREA": 100., "ELEV": 1., "FOREST": 1.,
                       "SLOPE_PCT": 1., "IMPERVIOUS": 1., "lat": 0., "lon": 0.})
    out = add_features(df, with_discharge_lags=False)
    for f in FEATURES_B:
        assert f in out.columns, f
    # lag1 at row i must equal raw precip at row i-1 (no future leak)
    assert out["precip_lag1"].iloc[5] == 4.0
    api = antecedent_precip_index(np.array([10., 0., 0.]), 0.5)
    assert np.allclose(api, [10., 5., 2.5])


def test_stations_match_spec():
    ids = {s["station_id"] for s in STATIONS}
    assert ids == {"01646500", "07010000", "08158000", "02087500", "11447650"}
    for s in STATIONS:
        for k in ("DRNAREA", "ELEV", "FOREST", "SLOPE_PCT", "lat", "lon"):
            assert s[k] is not None


if __name__ == "__main__":
    test_validator_accepts_good_and_rejects_bad()
    test_metrics_known_values()
    test_features_no_future_leak_and_api()
    test_stations_match_spec()
    print("✅ all pipeline tests passed")
