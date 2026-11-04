"""Evaluation — official FLOODCAST metrics (Brief §6) + hydrology metrics.

Official: RMSE 40% · Extreme-RMSE (top-10% per station) 30% · MAE 20% · R² 10%.
Leaderboard initially ranks by raw RMSE. Extra (not scored): NSE, KGE.
"""
from __future__ import annotations
import numpy as np
import pandas as pd


def rmse(y, p): return float(np.sqrt(np.mean((np.asarray(y) - np.asarray(p)) ** 2)))
def mae(y, p): return float(np.mean(np.abs(np.asarray(y) - np.asarray(p))))
def r2(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    ss = np.sum((y - y.mean()) ** 2)
    return float(1 - np.sum((y - p) ** 2) / ss) if ss > 0 else float("nan")
def nse(y, p): return r2(y, p)  # Nash-Sutcliffe == R² form on same series
def kge(y, p):
    y, p = np.asarray(y, float), np.asarray(p, float)
    if y.std() == 0 or p.std() == 0 or y.mean() == 0:
        return float("nan")
    r = np.corrcoef(y, p)[0, 1]
    alpha, beta = p.std() / y.std(), p.mean() / y.mean()
    return float(1 - np.sqrt((r - 1) ** 2 + (alpha - 1) ** 2 + (beta - 1) ** 2))


def extreme_mask(df: pd.DataFrame, ycol="discharge_cfs", q=0.90) -> pd.Series:
    """Top-10% highest-discharge days PER STATION (Brief §6)."""
    thr = df.groupby("station_id")[ycol].transform(lambda s: s.quantile(q))
    return df[ycol] >= thr


def evaluate_frame(df: pd.DataFrame, ycol="discharge_cfs", pcol="pred") -> dict:
    df = df.dropna(subset=[ycol, pcol])
    y, p = df[ycol].to_numpy(float), np.clip(df[pcol].to_numpy(float), 0, None)
    m = extreme_mask(df, ycol).to_numpy()
    out = {
        "n": int(len(df)),
        "rmse": rmse(y, p),                       # 40% + leaderboard
        "extreme_rmse": rmse(y[m], p[m]) if m.any() else float("nan"),  # 30%
        "mae": mae(y, p),                         # 20%
        "r2": r2(y, p),                           # 10%
        "nse": nse(y, p), "kge": kge(y, p),       # extra hydrology checks
        "bias_pct": float(100 * (p.mean() - y.mean()) / y.mean()) if y.mean() else float("nan"),
        "per_station": {},
    }
    for sid, g in df.groupby("station_id"):
        gy, gp = g[ycol].to_numpy(float), np.clip(g[pcol].to_numpy(float), 0, None)
        gm = extreme_mask(g.assign(station_id=sid), ycol).to_numpy()
        out["per_station"][str(sid)] = {
            "n": int(len(g)), "rmse": rmse(gy, gp), "mae": mae(gy, gp),
            "r2": r2(gy, gp), "nse": nse(gy, gp), "kge": kge(gy, gp),
            "extreme_rmse": rmse(gy[gm], gp[gm]) if gm.any() else float("nan"),
        }
    return out
