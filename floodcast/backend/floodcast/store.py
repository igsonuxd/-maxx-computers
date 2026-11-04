"""SQLite persistence for estimate requests (a small audit trail, not user data)."""
from __future__ import annotations

import sqlite3
from typing import Any

from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS estimates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    rcode TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    data_source TEXT NOT NULL,
    peak_date TEXT,
    peak_cfs REAL,
    missing_attributes TEXT NOT NULL DEFAULT ''
)
"""


def _connect() -> sqlite3.Connection:
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute(SCHEMA)
    return conn


def record_estimate(**fields: Any) -> int:
    columns = ("created_at", "latitude", "longitude", "rcode", "start_date", "end_date",
               "data_source", "peak_date", "peak_cfs", "missing_attributes")
    values = [fields.get(c) for c in columns]
    values[-1] = values[-1] or ""
    placeholders = ",".join("?" for _ in columns)
    conn = _connect()
    try:
        with conn:
            cursor = conn.execute(f"INSERT INTO estimates ({','.join(columns)}) VALUES ({placeholders})", values)
        return int(cursor.lastrowid)
    finally:
        conn.close()


def recent_estimates(limit: int = 20) -> list[dict[str, Any]]:
    conn = _connect()
    try:
        rows = conn.execute("SELECT * FROM estimates ORDER BY id DESC LIMIT ?", (int(limit),)).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
