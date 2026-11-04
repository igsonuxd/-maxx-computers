import math
from datetime import date

import pytest

from floodcast import config, sources
from floodcast.sources import SourceError, parse_open_meteo, parse_streamstats, parse_usgs_dv


def test_parse_usgs_dv_handles_nodata_and_order():
    payload = {"value": {"timeSeries": [{"values": [{"value": [
        {"value": "120.5", "dateTime": "2021-03-02T00:00:00.000-05:00"},
        {"value": "-999999", "dateTime": "2021-03-01T00:00:00.000-05:00"},
        {"value": "not a number", "dateTime": "2021-03-03T00:00:00.000-05:00"},
    ]}]}]}}
    s = parse_usgs_dv(payload)
    assert list(s.index.strftime("%Y-%m-%d")) == ["2021-03-01", "2021-03-02", "2021-03-03"]
    assert math.isnan(s.iloc[0]) and s.iloc[1] == 120.5 and math.isnan(s.iloc[2])


def test_parse_usgs_dv_empty_payload():
    assert parse_usgs_dv({}).empty


def test_parse_open_meteo_daily_and_hourly_soil():
    payload = {
        "daily": {"time": ["2020-01-01", "2020-01-02"], "precipitation_sum": [1.5, None],
                  "temperature_2m_mean": [3.0, 4.0]},
        "hourly": {"time": ["2020-01-01T00:00", "2020-01-01T12:00", "2020-01-02T00:00"],
                   "soil_moisture_0_to_7cm": [0.2, 0.4, 0.3]},
    }
    df = parse_open_meteo(payload)
    assert df.loc["2020-01-01", "soil_moisture"] == pytest.approx(0.3)
    assert df.loc["2020-01-02", "soil_moisture"] == pytest.approx(0.3)
    assert math.isnan(df.loc["2020-01-02", "precip_mm"])


def test_parse_streamstats_finds_codes_at_any_depth():
    payload = {"featurecollection": [{"name": "parameters", "feature": {"parameters": [
        {"code": "DRNAREA", "name": "Drainage Area", "value": "0.21 square miles"},
        {"code": "ELEV", "value": 93.7},
        {"code": "UNRELATED", "value": 1},
    ]}}, {"code": "DRNAREA", "value": 99}]}
    found = parse_streamstats(payload)
    assert found == {"DRNAREA": pytest.approx(0.21), "ELEV": pytest.approx(93.7)}


def test_live_calls_are_refused_in_demo_mode(monkeypatch, tmp_path):
    monkeypatch.setattr(config, "CACHE_DIR", tmp_path)
    monkeypatch.setattr(config, "SOURCE_MODE", "demo")
    with pytest.raises(SourceError):
        sources.fetch_discharge("01234567", date(2020, 1, 1), date(2020, 1, 2))
