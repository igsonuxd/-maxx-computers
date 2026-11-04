"""Command line: build data, train, evaluate and serve.

  python -m floodcast demo                           # synthetic end-to-end run (no network)
  python -m floodcast fetch --stations stations.csv  # live USGS + Open-Meteo + StreamStats
  python -m floodcast train
  python -m floodcast evaluate
  python -m floodcast serve --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import date
from pathlib import Path

from . import config
from .dataset import build_dataset, load_dataset, read_dataset_meta, read_station_list, write_dataset
from .demo import run_demo
from .pipeline import evaluate_and_save, train_and_save
from .providers import LiveProvider


def _date(text: str) -> date:
    return date.fromisoformat(text)


def cmd_demo(args: argparse.Namespace) -> int:
    summary = run_demo(start=_date(args.start), end=_date(args.end))
    print(json.dumps(summary, indent=2))
    print("Demo complete. Every artifact is labelled 'synthetic-demo'; no real metrics are published.")
    return 0


def cmd_fetch(args: argparse.Namespace) -> int:
    if config.SOURCE_MODE != "live":
        print("fetch needs FLOODCAST_SOURCE_MODE=live (or unset).", file=sys.stderr)
        return 2
    stations = read_station_list(Path(args.stations))
    start, end = _date(args.start), _date(args.end)
    dataset, station_meta, skipped = build_dataset(stations, start, end, LiveProvider())
    write_dataset(dataset, station_meta, config.DATA_SOURCE_LIVE, start, end, skipped)
    print(f"Wrote {len(dataset)} rows from {dataset['site_no'].nunique()} stations. Skipped: {len(skipped)}.")
    for item in skipped:
        print(f"  skipped {item['site_no']}: {item['reason']}")
    return 0


def cmd_train(_: argparse.Namespace) -> int:
    dataset = load_dataset()
    meta = read_dataset_meta()
    if dataset is None or meta is None:
        print("No dataset found. Run `demo` or `fetch` first.", file=sys.stderr)
        return 2
    trained = train_and_save(dataset, meta["data_source"])
    print(f"Trained on {trained['n_rows']} rows from {trained['n_stations']} stations ({trained['data_source']}).")
    return 0


def cmd_evaluate(_: argparse.Namespace) -> int:
    dataset = load_dataset()
    meta = read_dataset_meta()
    if dataset is None or meta is None:
        print("No dataset found. Run `demo` or `fetch` first.", file=sys.stderr)
        return 2
    report = evaluate_and_save(dataset, meta["data_source"])
    print(json.dumps({"data_source": report["data_source"], "n_stations": report["n_stations"],
                      "n_rows": report["n_rows"], "metrics": report["metrics"]}, indent=2))
    if report["data_source"] != config.DATA_SOURCE_LIVE:
        print("Note: these scores are from synthetic data and will not be published by the API.")
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    import uvicorn

    uvicorn.run("floodcast.api:app", host=args.host, port=args.port, log_level="info")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="floodcast", description="FLOODCAST data, model and API.")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("demo", help="Synthetic end-to-end run: dataset, model, evaluation.")
    p.add_argument("--start", default="2000-01-01")
    p.add_argument("--end", default="2023-12-31")
    p.set_defaults(func=cmd_demo)

    p = sub.add_parser("fetch", help="Build the dataset from live sources.")
    p.add_argument("--stations", default=str(config.STATIONS_CSV))
    p.add_argument("--start", default="2010-01-01")
    p.add_argument("--end", default="2024-12-31")
    p.set_defaults(func=cmd_fetch)

    sub.add_parser("train", help="Train the model on the current dataset.").set_defaults(func=cmd_train)
    sub.add_parser("evaluate", help="Leave-basin-out evaluation.").set_defaults(func=cmd_evaluate)

    p = sub.add_parser("serve", help="Run the API and web page.")
    p.add_argument("--host", default="0.0.0.0")
    p.add_argument("--port", type=int, default=8000)
    p.set_defaults(func=cmd_serve)
    return parser


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    args = build_parser().parse_args(argv)
    return int(args.func(args))

