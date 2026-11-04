import type { DayRow } from "./features";
import type { Station } from "./stations";

/** Live data layer — runs in the VISITOR'S BROWSER against the real free APIs
 *  (no keys, CORS-enabled). If unreachable (offline, blocked, sandbox preview),
 *  falls back to a seeded physics generator and reports source='fallback' so
 *  the UI can badge it honestly. Synthetic ≠ observed, never mixed silently. */

export type SeriesSource = "usgs+openmeteo_live" | "offline_fallback";
export interface StationSeries {
  station: Station; source: SeriesSource; fetchedAt: string;
  history: DayRow[];        // observed discharge + weather, ascending
  futureWeather: DayRow[];  // 7-day forecast weather (no discharge)
  note?: string;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
function daysAgo(n: number) { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; }
async function fetchJson(url: string, timeoutMs = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

async function fetchUsgs(st: Station, start: string, end: string) {
  const url = `https://waterservices.usgs.gov/nwis/dv/?format=json&sites=${st.station_id}&startDT=${start}&endDT=${end}&parameterCd=00060&statCd=00003`;
  const j = await fetchJson(url);
  const map = new Map<string, number>();
  for (const ts of j?.value?.timeSeries ?? [])
    for (const blk of ts?.values ?? [])
      for (const v of blk?.value ?? []) {
        const val = parseFloat(v.value);
        if (Number.isFinite(val) && val >= 0) map.set(String(v.dateTime).slice(0, 10), val);
      }
  if (map.size < 30) throw new Error("USGS returned too few rows");
  return map;
}

async function fetchWeatherRange(st: Station, base: string, start: string, end: string, pastDays = 0) {
  const daily = "precipitation_sum,temperature_2m_max,temperature_2m_min";
  const url = `${base}?latitude=${st.lat}&longitude=${st.lon}&start_date=${start}&end_date=${end}&daily=${daily}&hourly=soil_moisture_0_to_7cm&timezone=UTC${pastDays ? "" : ""}`;
  const j = await fetchJson(url);
  const soilByDay = new Map<string, { s: number; n: number }>();
  const ht: string[] = j?.hourly?.time ?? [], hs: (number | null)[] = j?.hourly?.soil_moisture_0_to_7cm ?? [];
  ht.forEach((t, i) => {
    const v = hs[i]; if (v == null) return;
    const day = t.slice(0, 10); const cur = soilByDay.get(day) ?? { s: 0, n: 0 };
    cur.s += v; cur.n++; soilByDay.set(day, cur);
  });
  const rows = new Map<string, DayRow>();
  (j?.daily?.time ?? []).forEach((day: string, i: number) => {
    const sm = soilByDay.get(day);
    rows.set(day, {
      date: day,
      precipitation_sum: j.daily.precipitation_sum?.[i] ?? 0,
      temperature_2m_max: j.daily.temperature_2m_max?.[i] ?? 15,
      temperature_2m_min: j.daily.temperature_2m_min?.[i] ?? 5,
      soil_moisture_0_to_7cm: sm ? sm.s / sm.n : 0.25,
    });
  });
  return rows;
}

export async function fetchLiveSeries(st: Station, historyDays = 180): Promise<StationSeries> {
  const start = iso(daysAgo(historyDays)), end = iso(daysAgo(1));
  const fEnd = iso(daysAgo(-7));
  const [qMap, pastW, futW] = await Promise.all([
    fetchUsgs(st, start, end),
    fetchWeatherRange(st, "https://archive-api.open-meteo.com/v1/archive", start, end),
    fetchWeatherRange(st, "https://api.open-meteo.com/v1/forecast", iso(daysAgo(0)), fEnd),
  ]);
  const history: DayRow[] = [];
  for (const [date, w] of [...pastW.entries()].sort())
    if (qMap.has(date)) history.push({ ...w, discharge_cfs: qMap.get(date)! });
  const today = iso(daysAgo(0));
  const futureWeather = [...futW.values()].filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  if (history.length < 60 || futureWeather.length === 0) throw new Error("insufficient live overlap");
  return { station: st, source: "usgs+openmeteo_live", fetchedAt: new Date().toISOString(), history, futureWeather };
}

/* ---------------- offline fallback (TS port of ml/ingest.py generator) ---- */
function mulberry32(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function randn(rng: () => number) {
  let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function fallbackSeries(st: Station, historyDays = 180): StationSeries {
  const rng = mulberry32(42 + (parseInt(st.station_id, 10) % 10000) * 7919);
  const area = st.DRNAREA;
  const runoffK = 0.55 - 0.004 * st.FOREST + 0.02 * st.IMPERVIOUS + 0.008 * st.SLOPE_PCT;
  let base = area < 50000 ? (0.55 * Math.pow(area, 0.92)) / 10 : area * 0.42;
  if (st.station_id === "07010000") base = 120000;
  const tLocal = st.state === "TX" ? 20 : st.state === "CA" ? 16 : st.state === "NC" ? 15 : 13;
  let soil = 0.22, quick = 0, slow = base, snow = 0;
  const total = historyDays + 365 + 7; // spin-up year so states are equilibrated
  const all: DayRow[] = [];
  const startDate = daysAgo(total - 7);
  for (let i = 0; i < total; i++) {
    const d = new Date(startDate); d.setUTCDate(d.getUTCDate() + i);
    const doy = Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
    const ang = (2 * Math.PI * (doy - 1)) / 365.25;
    const tmean = tLocal + 11 * Math.sin(ang - 1.9) + randn(rng) * 3;
    let lam = 0.32 + 0.06 * Math.sin(ang + 0.4);
    if (st.climate === "mediterranean_snowmelt") lam = 0.28 + 0.24 * Math.cos(ang - 0.2);
    if (st.climate === "continental_central") lam = 0.3 + 0.1 * Math.sin(ang - 0.6);
    if (st.climate === "subtropical_south_flash") lam = 0.24 + 0.06 * Math.sin(ang);
    let precip = 0;
    if (rng() < lam) { // gamma(1.6, 7) approx via sum of exponentials
      precip = (-Math.log(1 - rng()) + 0.6 * -Math.log(1 - rng())) * 4.4;
      if (rng() < 0.012) precip *= 2.5 + rng() * 2.5;
    }
    let eff = precip, melt = 0;
    if (st.ELEV > 900) {
      if (tmean < 1) { snow += precip; eff = 0; }
      else { melt = Math.min(snow, 0.12 * snow * Math.max(tmean, 0) / 5); snow -= melt; }
    }
    const et = Math.max(0, 0.1 + 0.012 * tmean) * (0.4 + 0.6 * soil);
    soil = Math.min(0.45, Math.max(0.05, soil + 0.012 * eff - 0.05 * et - 0.01 * soil + randn(rng) * 0.004));
    const sat = (soil - 0.05) / 0.4;
    const runoff = runoffK * (0.25 + 0.75 * Math.pow(sat, 1.6)) * eff + 0.5 * melt;
    quick = 0.55 * quick + runoff;
    slow = 0.985 * slow + 0.015 * base * (0.6 + 0.8 * sat);
    const conv = st.station_id === "07010000" ? area * 0.0016 : area * 0.028;
    const q = Math.max(1, (slow + quick * conv) * Math.exp(randn(rng) * 0.1));
    all.push({ date: iso(d), precipitation_sum: Math.round(precip * 100) / 100,
      temperature_2m_max: Math.round((tmean + 4 + rng() * 4) * 10) / 10,
      temperature_2m_min: Math.round((tmean - 4 - rng() * 4) * 10) / 10,
      soil_moisture_0_to_7cm: Math.round(soil * 1000) / 1000, discharge_cfs: Math.round(q * 10) / 10 });
  }
  const history = all.slice(-(historyDays + 7), -7);
  const futureWeather = all.slice(-7).map(({ discharge_cfs: _q, ...w }) => w as DayRow);
  return { station: st, source: "offline_fallback", fetchedAt: new Date().toISOString(), history, futureWeather,
    note: "Live USGS/Open-Meteo unreachable from this browser/session — showing seeded offline simulation. Values are NOT real observations." };
}

const cache = new Map<string, Promise<StationSeries>>();
export function getStationSeries(st: Station): Promise<StationSeries> {
  if (!cache.has(st.station_id)) {
    cache.set(st.station_id, fetchLiveSeries(st).catch(() => fallbackSeries(st)));
  }
  return cache.get(st.station_id)!;
}
