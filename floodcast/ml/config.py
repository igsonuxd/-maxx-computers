"""FLOODCAST configuration: stations, StreamStats catchment features, paths.

StreamStats values below are approximate published basin characteristics for the
5 starter stations. BEFORE final submission, verify each value in
https://streamstats.usgs.gov/ss/ (see REQUIREMENTS.md B4 / model_card.md).
Units: DRNAREA sq-mi, ELEV ft, FOREST %, SLOPE_PCT %, IMPERVIOUS %.
"""
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "data"
OFFICIAL_DIR = DATA_DIR / "official"
OUTPUTS_DIR = BASE / "outputs"
WEB_GENERATED = BASE.parent / "src" / "lib" / "floodcast" / "generated"

USGS_DV_URL = "https://waterservices.usgs.gov/nwis/dv/"
USGS_PARAM_DISCHARGE = "00060"  # discharge, cfs
OPENMETEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
OPENMETEO_DAILY = ["precipitation_sum", "temperature_2m_max", "temperature_2m_min"]
OPENMETEO_HOURLY_SOIL = "soil_moisture_0_to_7cm"

STATIONS = [
    {
        "station_id": "01646500", "name": "Potomac River near Washington, DC (Little Falls)",
        "river": "Potomac River", "state": "DC/MD", "lat": 38.9494, "lon": -77.1272,
        "DRNAREA": 11560, "ELEV": 1050, "FOREST": 58, "SLOPE_PCT": 12.5, "IMPERVIOUS": 4.5,
        "climate": "humid_subtropical_east",
    },
    {
        "station_id": "07010000", "name": "Mississippi River at St. Louis, MO",
        "river": "Mississippi River", "state": "MO", "lat": 38.6289, "lon": -90.1803,
        "DRNAREA": 701000, "ELEV": 1050, "FOREST": 22, "SLOPE_PCT": 3.2, "IMPERVIOUS": 2.0,
        "climate": "continental_central",
    },
    {
        "station_id": "08158000", "name": "Colorado River at Austin, TX",
        "river": "Colorado River (TX)", "state": "TX", "lat": 30.2825, "lon": -97.7178,
        "DRNAREA": 27250, "ELEV": 1200, "FOREST": 18, "SLOPE_PCT": 5.5, "IMPERVIOUS": 3.5,
        "climate": "subtropical_south_flash",
    },
    {
        "station_id": "02087500", "name": "Neuse River near Clayton, NC",
        "river": "Neuse River", "state": "NC", "lat": 35.6464, "lon": -78.4044,
        "DRNAREA": 1150, "ELEV": 350, "FOREST": 42, "SLOPE_PCT": 3.8, "IMPERVIOUS": 6.0,
        "climate": "humid_subtropical_east",
    },
    {
        "station_id": "11447650", "name": "Sacramento River at Verona, CA",
        "river": "Sacramento River", "state": "CA", "lat": 38.7744, "lon": -121.5969,
        "DRNAREA": 21200, "ELEV": 1500, "FOREST": 38, "SLOPE_PCT": 14.0, "IMPERVIOUS": 1.8,
        "climate": "mediterranean_snowmelt",
    },
]

STATION_BY_ID = {s["station_id"]: s for s in STATIONS}
CATCHMENT_FEATURES = ["DRNAREA", "ELEV", "FOREST", "SLOPE_PCT", "IMPERVIOUS"]

# Demo-mode (only used when official CSVs are absent — clearly labelled everywhere)
DEMO_TRAIN = ("2020-01-01", "2023-12-31")
DEMO_TEST = ("2024-01-01", "2024-12-31")
RANDOM_SEED = 42
