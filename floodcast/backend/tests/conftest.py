"""Tests run against an isolated data directory in demo mode. No network access is needed."""
import os
import tempfile

_TMP = tempfile.mkdtemp(prefix="floodcast-test-")
os.environ["FLOODCAST_DATA_DIR"] = _TMP
os.environ["FLOODCAST_SOURCE_MODE"] = "demo"

from datetime import date  # noqa: E402

import pytest  # noqa: E402

from floodcast import config  # noqa: E402
from floodcast.demo import run_demo  # noqa: E402


@pytest.fixture(scope="session")
def demo_data():
    """Build a small synthetic dataset, a model and an evaluation once per test session."""
    summary = run_demo(start=date(2000, 1, 1), end=date(2009, 12, 31), station_count=6)
    assert config.DATA_DIR.as_posix().startswith(tempfile.gettempdir())
    return summary
