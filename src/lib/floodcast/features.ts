import type { Station } from "./stations";

/** TS mirror of floodcast/ml/features.py — SAME names/formulas. If you change
 *  one side, change the other and re-run ml/solution.py. */

export interface DayRow {
  date: string; // YYYY-MM-DD
  precipitation_sum: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  soil_moisture_0_to_7cm: number;
  discharge_cfs?: number | null; // observed (history) or predicted (recursion)
}

const lag = (a: number[], i: number, l: number) => (i - l >= 0 ? a[i - l] : NaN);
const rollSum = (a: number[], i: number, w: number) => {
  let s = 0; for (let k = Math.max(0, i - w + 1); k <= i; k++) s += a[k] ?? 0; return s;
};
const rollMax = (a: number[], i: number, w: number) => {
  let s = -Infinity; for (let k = Math.max(0, i - w + 1); k <= i; k++) s = Math.max(s, a[k] ?? 0); return s;
};
const rollMean = (a: number[], i: number, w: number, shift = 0) => {
  const end = i - shift; if (end < 0) return NaN;
  let s = 0, n = 0; for (let k = Math.max(0, end - w + 1); k <= end; k++) if (Number.isFinite(a[k])) { s += a[k]; n++; }
  return n ? s / n : NaN;
};
const rollMaxShift = (a: number[], i: number, w: number) => {
  const end = i - 1; if (end < 0) return NaN;
  let s = -Infinity; for (let k = Math.max(0, end - w + 1); k <= end; k++) s = Math.max(s, a[k] ?? -Infinity);
  return Number.isFinite(s) ? s : NaN;
};
function apiSeries(p: number[], decay: number) {
  const out = new Array(p.length); let acc = 0;
  for (let i = 0; i < p.length; i++) { acc = decay * acc + (Number.isFinite(p[i]) ? p[i] : 0); out[i] = acc; }
  return out;
}

export function buildFeatures(rows: DayRow[], st: Station, withQ: boolean): Record<string, number>[] {
  const p = rows.map((r) => r.precipitation_sum ?? 0);
  const soil = rows.map((r) => r.soil_moisture_0_to_7cm ?? NaN);
  const tmean = rows.map((r) => ((r.temperature_2m_max ?? 0) + (r.temperature_2m_min ?? 0)) / 2);
  const q = rows.map((r) => (r.discharge_cfs == null ? NaN : r.discharge_cfs));
  const api85 = apiSeries(p, 0.85), api92 = apiSeries(p, 0.92), api97 = apiSeries(p, 0.97);
  return rows.map((r, i) => {
    const d = new Date(r.date + "T00:00:00Z");
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    const doy = Math.floor((d.getTime() - start) / 86400000);
    const f: Record<string, number> = {
      precipitation_sum: p[i],
      temperature_2m_max: r.temperature_2m_max, temperature_2m_min: r.temperature_2m_min,
      temp_mean: tmean[i], soil_moisture_0_to_7cm: soil[i],
      precip_lag1: lag(p, i, 1), precip_lag2: lag(p, i, 2), precip_lag3: lag(p, i, 3), precip_lag7: lag(p, i, 7),
      precip_roll3: rollSum(p, i, 3), precip_roll7: rollSum(p, i, 7), precip_roll14: rollSum(p, i, 14),
      precip_roll30: rollSum(p, i, 30), precip_roll90: rollSum(p, i, 90),
      precip_max3: rollMax(p, i, 3), precip_max7: rollMax(p, i, 7), precip_max14: rollMax(p, i, 14),
      precip_max30: rollMax(p, i, 30), precip_max90: rollMax(p, i, 90),
      api_85: api85[i], api_92: api92[i], api_97: api97[i],
      soil_moisture_0_to_7cm_lag1: lag(soil, i, 1),
      soil_moisture_0_to_7cm_roll7: rollMean(soil, i, 7), soil_moisture_0_to_7cm_roll30: rollMean(soil, i, 30),
      temp_mean_lag1: lag(tmean, i, 1), temp_mean_roll7: rollMean(tmean, i, 7), temp_mean_roll30: rollMean(tmean, i, 30),
      rain_x_soil: rollSum(p, i, 7) * (soil[i] ?? 0),
      melt_proxy: Math.max(tmean[i] - 2, 0) * (st.ELEV / 1000),
      ELEV: st.ELEV, FOREST: st.FOREST, SLOPE_PCT: st.SLOPE_PCT, IMPERVIOUS: st.IMPERVIOUS,
      log_drnarea: Math.log1p(st.DRNAREA), lat: st.lat, lon: st.lon,
      doy_sin: Math.sin((2 * Math.PI * doy) / 365.25), doy_cos: Math.cos((2 * Math.PI * doy) / 365.25),
      month: d.getUTCMonth() + 1,
    };
    if (withQ) {
      f.q_lag1 = lag(q, i, 1); f.q_lag2 = lag(q, i, 2); f.q_lag3 = lag(q, i, 3);
      f.q_lag7 = lag(q, i, 7); f.q_lag14 = lag(q, i, 14);
      f.q_roll_mean7 = rollMean(q, i, 7, 1); f.q_roll_mean14 = rollMean(q, i, 14, 1); f.q_roll_mean30 = rollMean(q, i, 30, 1);
      f.q_roll_max7 = rollMaxShift(q, i, 7); f.q_roll_max14 = rollMaxShift(q, i, 14); f.q_roll_max30 = rollMaxShift(q, i, 30);
      f.log_q_lag1 = Number.isFinite(f.q_lag1) ? Math.log1p(Math.max(f.q_lag1, 0)) : NaN;
    }
    return f;
  });
}
