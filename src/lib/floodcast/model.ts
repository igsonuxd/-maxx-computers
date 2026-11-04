import params from "./generated/model_params.json";
import { buildFeatures, type DayRow } from "./features";
import type { Station } from "./stations";

/** Inference with coefficients TRAINED by floodcast/ml/solution.py.
 *  Model A (live): B features + observed-discharge lags, recursive multi-day.
 *  Model B (CSV): weather+catchment only — leakage-safe for test.csv rows.
 *  Both predict log(q/DRNAREA); q = exp(pred)*DRNAREA with physical cap. */

interface RidgeExport {
  features: string[]; feature_median: number[]; scaler_mean: number[];
  scaler_scale: number[]; coef: number[]; intercept: number;
}
const A = params as unknown as RidgeExport & { max_specific_cfs_per_sqmi: number };
const B = (params as unknown as { model_B_ridge: RidgeExport }).model_B_ridge;
const MAX_SPECIFIC = A.max_specific_cfs_per_sqmi;

function ridgePredictCfs(m: RidgeExport, f: Record<string, number>, area: number) {
  let z = m.intercept;
  for (let i = 0; i < m.features.length; i++) {
    let v = f[m.features[i]];
    if (v == null || !Number.isFinite(v)) v = m.feature_median[i];
    z += m.coef[i] * ((v - m.scaler_mean[i]) / (m.scaler_scale[i] || 1));
  }
  const q = Math.exp(z) * area;
  return Math.min(Math.max(q, 0), 3 * MAX_SPECIFIC * area);
}

export interface ForecastDay { date: string; discharge_cfs: number; precipitation_sum: number }

/** Recursive 7-day (or n-day) forecast: history = observed rows (with q),
 *  futureWeather = forecast rows (no q). Each prediction feeds the next lag. */
export function forecast(st: Station, history: DayRow[], futureWeather: DayRow[]): ForecastDay[] {
  const rows: DayRow[] = [...history.map((r) => ({ ...r }))];
  const out: ForecastDay[] = [];
  for (const fw of futureWeather) {
    rows.push({ ...fw, discharge_cfs: null });
    const feats = buildFeatures(rows, st, true);
    const q = ridgePredictCfs(A, feats[feats.length - 1], st.DRNAREA);
    rows[rows.length - 1].discharge_cfs = q;
    out.push({ date: fw.date, discharge_cfs: Math.round(q * 10) / 10, precipitation_sum: fw.precipitation_sum });
  }
  return out;
}

/** Backtest helper: predict every history row (from index `from`) with Model A
 *  using only prior observed discharge — for observed-vs-predicted charts. */
export function backtest(st: Station, history: DayRow[], from = 90): { date: string; observed: number; predicted: number }[] {
  const feats = buildFeatures(history, st, true);
  const out: { date: string; observed: number; predicted: number }[] = [];
  for (let i = from; i < history.length; i++) {
    if (history[i].discharge_cfs == null) continue;
    out.push({ date: history[i].date, observed: history[i].discharge_cfs!,
               predicted: Math.round(ridgePredictCfs(A, feats[i], st.DRNAREA) * 10) / 10 });
  }
  return out;
}

/** Model B batch prediction for uploaded test.csv-style rows grouped per station.
 *  Rows MUST carry the weather columns (as official test.csv does, Brief §4). */
export function predictCsvRows(st: Station, rows: DayRow[]): number[] {
  const feats = buildFeatures(rows, st, false);
  return feats.map((f) => Math.round(ridgePredictCfs(B, f, st.DRNAREA) * 100) / 100);
}

export const MODEL_INFO = {
  dataMode: params.data_mode,
  featuresA: A.features.length,
  featuresB: B.features.length,
  summary: (params as unknown as { metrics_summary: unknown }).metrics_summary,
};
