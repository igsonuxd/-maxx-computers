
import numpy as np
import pandas as pd

from floodcast.features import CORE_FEATURES, FEATURE_COLUMNS, build_features, missing_attribute_codes

ATTRS = {"DRNAREA": 12.0, "BSLDEM250": 8.0, "ELEV": 300.0, "SOILPERM": 2.0}


def _forcing(n=120, seed=0):
    rng = np.random.default_rng(seed)
    idx = pd.date_range("2020-01-01", periods=n, freq="D", name="date")
    return pd.DataFrame({
        "precip_mm": rng.gamma(0.5, 6.0, n),
        "temp_c": rng.normal(10, 5, n),
        "soil_moisture": rng.uniform(0.1, 0.4, n),
    }, index=idx)


def test_feature_columns_are_complete_and_ordered():
    feats = build_features(_forcing(), ATTRS)
    assert list(feats.columns) == list(FEATURE_COLUMNS)
    assert len(FEATURE_COLUMNS) == 15


def test_features_never_use_future_forcing():
    base = _forcing()
    changed = base.copy()
    changed.loc[changed.index >= pd.Timestamp("2020-03-01"), "precip_mm"] += 500.0
    changed.loc[changed.index >= pd.Timestamp("2020-03-01"), "temp_c"] += 20.0
    a = build_features(base, ATTRS)
    b = build_features(changed, ATTRS)
    cutoff = pd.Timestamp("2020-02-29")
    pd.testing.assert_frame_equal(a.loc[:cutoff], b.loc[:cutoff])


def test_missing_attributes_become_nan_and_are_reported():
    feats = build_features(_forcing(), {"DRNAREA": 5.0})
    assert feats["log_drainage_area"].notna().all()
    assert feats["basin_slope_pct"].isna().all()
    assert missing_attribute_codes({"DRNAREA": 5.0}) == ["BSLDEM250", "ELEV", "SOILPERM"]


def test_core_features_have_no_gaps_for_complete_forcing():
    feats = build_features(_forcing(), ATTRS).iloc[30:]
    assert feats[list(CORE_FEATURES)].notna().all().all()


def test_empty_forcing_returns_empty_table():
    assert build_features(pd.DataFrame(columns=["precip_mm", "temp_c", "soil_moisture"]), ATTRS).empty
