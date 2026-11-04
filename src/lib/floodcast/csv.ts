import type { DayRow } from "./features";
import { predictCsvRows } from "./model";
import { stationById, type Station } from "./stations";

/** Browser CSV tooling — mirrors floodcast/ml/validate_submission.py (Brief §5)
 *  and the Model-B predictor. Official final file should come from the Python
 *  ensemble; this ridge tool is for rehearsal/quick checks (labelled in UI). */

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [], field = "", inQ = false;
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"' && t[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n") { cur.push(field); field = ""; if (cur.some((x) => x.trim() !== "")) rows.push(cur); cur = []; }
    else field += c;
  }
  if (field !== "" || cur.length) { cur.push(field); if (cur.some((x) => x.trim() !== "")) rows.push(cur); }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
}

const pick = (r: Record<string, string>, names: string[]) => {
  for (const n of names) if (r[n] !== undefined && r[n] !== "") return r[n];
  return undefined;
};
const num = (v: string | undefined, dflt: number) => {
  const n = v === undefined ? NaN : parseFloat(v); return Number.isFinite(n) ? n : dflt;
};

export interface CsvPredictReport {
  ok: boolean; errors: string[]; warnings: string[];
  predictions: { station_id: string; date: string; discharge_cfs: number }[];
  csvText: string;
}

export function predictFromTestCsv(text: string): CsvPredictReport {
  const errors: string[] = [], warnings: string[] = [];
  const rows = parseCsv(text);
  if (!rows.length) return { ok: false, errors: ["Could not parse any data rows (need a header + rows)."], warnings, predictions: [], csvText: "" };
  const headers = Object.keys(rows[0]);
  for (const need of ["station_id", "date"])
    if (!headers.includes(need)) errors.push(`Missing required column: ${need}`);
  const hasPrecip = ["precipitation_sum", "precip", "rainfall"].some((h) => headers.includes(h));
  if (!hasPrecip) errors.push("Missing weather column precipitation_sum (official test.csv includes weather — Brief §4). Model B cannot run without weather.");
  if (errors.length) return { ok: false, errors, warnings, predictions: [], csvText: "" };

  const byStation = new Map<string, Record<string, string>[]>();
  for (const r of rows) {
    const sid = (r.station_id ?? "").padStart(8, "0");
    if (!byStation.has(sid)) byStation.set(sid, []);
    byStation.get(sid)!.push(r);
  }
  const predictions: CsvPredictReport["predictions"] = [];
  for (const [sid, srows] of byStation) {
    const meta = stationById(sid);
    if (!meta) { warnings.push(`Station ${sid} not in starter metadata — using catchment columns from file or regional defaults.`); }
    const sorted = [...srows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const first = sorted[0];
    const st: Station = meta ?? {
      station_id: sid, name: sid, river: "", state: "",
      lat: num(pick(first, ["lat", "latitude"]), 39), lon: num(pick(first, ["lon", "longitude"]), -98),
      DRNAREA: num(pick(first, ["DRNAREA", "drnarea"]), 5000), ELEV: num(pick(first, ["ELEV", "elev"]), 800),
      FOREST: num(pick(first, ["FOREST", "forest"]), 35), SLOPE_PCT: num(pick(first, ["SLOPE_PCT", "slope"]), 8),
      IMPERVIOUS: num(pick(first, ["IMPERVIOUS", "impervious"]), 3), climate: "",
    };
    const days: DayRow[] = sorted.map((r) => ({
      date: String(r.date).slice(0, 10),
      precipitation_sum: num(pick(r, ["precipitation_sum", "precip", "rainfall"]), 0),
      temperature_2m_max: num(pick(r, ["temperature_2m_max", "tmax"]), 20),
      temperature_2m_min: num(pick(r, ["temperature_2m_min", "tmin"]), 10),
      soil_moisture_0_to_7cm: num(pick(r, ["soil_moisture_0_to_7cm", "soil_moisture"]), 0.25),
    }));
    const preds = predictCsvRows(st, days);
    sorted.forEach((r, i) => predictions.push({ station_id: sid, date: String(r.date).slice(0, 10), discharge_cfs: Math.max(0, preds[i]) }));
    if (days.length < 30) warnings.push(`Station ${sid}: only ${days.length} rows — lag/rolling features are warm-up limited; include longer history if possible.`);
  }
  // preserve input row order in output (safest for row-order comparisons)
  const key = (s: string, d: string) => `${s}|${d}`;
  const map = new Map(predictions.map((p) => [key(p.station_id, p.date), p]));
  const ordered = rows.map((r) => map.get(key((r.station_id ?? "").padStart(8, "0"), String(r.date).slice(0, 10)))!).filter(Boolean);
  const csvText = "station_id,date,discharge_cfs\n" +
    ordered.map((p) => `${p.station_id},${p.date},${p.discharge_cfs.toFixed(2)}`).join("\n") + "\n";
  const v = validatePredictions(ordered, rows);
  return { ok: v.errors.length === 0, errors: v.errors, warnings: [...warnings, ...v.warnings], predictions: ordered, csvText };
}

/** Brief §5 rejection rules. testRows = parsed test.csv (optional). */
export function validatePredictions(
  preds: { station_id: string; date: string; discharge_cfs: number }[],
  testRows?: Record<string, string>[],
) {
  const errors: string[] = [], warnings: string[] = [];
  if (!preds.length) errors.push("No predictions.");
  if (preds.some((p) => !Number.isFinite(p.discharge_cfs))) errors.push("Blank/NaN predictions present.");
  if (preds.some((p) => p.discharge_cfs < 0)) errors.push("Negative predictions present.");
  const seen = new Set<string>();
  for (const p of preds) {
    const k = `${p.station_id}|${p.date}`;
    if (seen.has(k)) errors.push(`Duplicate station/date: ${k}`);
    seen.add(k);
    if (Number.isNaN(Date.parse(p.date))) errors.push(`Bad date: ${p.date}`);
  }
  if (testRows) {
    if (preds.length !== testRows.length) errors.push(`Row count ${preds.length} != test.csv rows ${testRows.length}.`);
    const tk = new Set(testRows.map((r) => `${(r.station_id ?? "").padStart(8, "0")}|${String(r.date).slice(0, 10)}`));
    const missing = [...tk].filter((k) => !seen.has(k));
    if (missing.length) errors.push(`${missing.length} station/date pairs from test.csv missing.`);
  }
  if (preds.length && preds.filter((p) => p.discharge_cfs === 0).length / preds.length > 0.5)
    warnings.push(">50% zero predictions — did the model actually run?");
  return { errors: [...new Set(errors)].slice(0, 12), warnings };
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}

export const SAMPLE_TEST_CSV = `station_id,date,precipitation_sum,temperature_2m_max,temperature_2m_min,soil_moisture_0_to_7cm
01646500,2024-06-01,2.1,28,17,0.24
01646500,2024-06-02,18.4,26,18,0.29
01646500,2024-06-03,42.0,24,17,0.34
01646500,2024-06-04,12.5,25,16,0.36
01646500,2024-06-05,0.0,27,15,0.33
02087500,2024-06-01,0.0,30,19,0.21
02087500,2024-06-02,5.2,29,20,0.23
02087500,2024-06-03,25.8,27,19,0.30
02087500,2024-06-04,8.1,28,18,0.31
02087500,2024-06-05,0.0,29,17,0.28
`;
