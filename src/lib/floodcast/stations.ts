import params from "./generated/model_params.json";

/** Mirror of floodcast/ml/config.py STATIONS (keep in sync). */
export interface Station {
  station_id: string; name: string; river: string; state: string;
  lat: number; lon: number;
  DRNAREA: number; ELEV: number; FOREST: number; SLOPE_PCT: number; IMPERVIOUS: number;
  climate: string;
}

export const STATIONS: Station[] = [
  { station_id: "01646500", name: "Potomac River near Washington, DC (Little Falls)", river: "Potomac River", state: "DC/MD", lat: 38.9494, lon: -77.1272, DRNAREA: 11560, ELEV: 1050, FOREST: 58, SLOPE_PCT: 12.5, IMPERVIOUS: 4.5, climate: "humid_subtropical_east" },
  { station_id: "07010000", name: "Mississippi River at St. Louis, MO", river: "Mississippi River", state: "MO", lat: 38.6289, lon: -90.1803, DRNAREA: 701000, ELEV: 1050, FOREST: 22, SLOPE_PCT: 3.2, IMPERVIOUS: 2.0, climate: "continental_central" },
  { station_id: "08158000", name: "Colorado River at Austin, TX", river: "Colorado River (TX)", state: "TX", lat: 30.2825, lon: -97.7178, DRNAREA: 27250, ELEV: 1200, FOREST: 18, SLOPE_PCT: 5.5, IMPERVIOUS: 3.5, climate: "subtropical_south_flash" },
  { station_id: "02087500", name: "Neuse River near Clayton, NC", river: "Neuse River", state: "NC", lat: 35.6464, lon: -78.4044, DRNAREA: 1150, ELEV: 350, FOREST: 42, SLOPE_PCT: 3.8, IMPERVIOUS: 6.0, climate: "humid_subtropical_east" },
  { station_id: "11447650", name: "Sacramento River at Verona, CA", river: "Sacramento River", state: "CA", lat: 38.7744, lon: -121.5969, DRNAREA: 21200, ELEV: 1500, FOREST: 38, SLOPE_PCT: 14.0, IMPERVIOUS: 1.8, climate: "mediterranean_snowmelt" },
];

export const stationById = (id: string) =>
  STATIONS.find((s) => s.station_id === id.padStart(8, "0"));

export interface StationThresholds {
  median_cfs: number; mean_cfs: number; q90_cfs: number; q95_cfs: number;
  q98_cfs: number; q99_cfs: number; max_cfs: number;
  watch_cfs: number; warning_cfs: number; flood_cfs: number;
}

/** Percentile-derived thresholds exported by the Python training run.
 *  DEMO PROXIES — replace with official NWS flood-stage discharges. */
export const thresholdsFor = (id: string): StationThresholds | undefined =>
  (params.stations as Record<string, StationThresholds>)[id.padStart(8, "0")];

export const DATA_MODE: string = params.data_mode;

export type RiskLevel = "NORMAL" | "WATCH" | "WARNING" | "FLOOD" | "EMERGENCY";

export function riskFor(cfs: number, t?: StationThresholds): RiskLevel {
  if (!t) return "NORMAL";
  if (cfs >= t.q99_cfs) return "EMERGENCY";
  if (cfs >= t.flood_cfs) return "FLOOD";
  if (cfs >= t.warning_cfs) return "WARNING";
  if (cfs >= t.watch_cfs) return "WATCH";
  return "NORMAL";
}

export const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string; action: string }> = {
  NORMAL:    { label: "Normal",    color: "#047857", bg: "#ecfdf5", action: "River within normal range. Stay informed." },
  WATCH:     { label: "Flood Watch", color: "#b45309", bg: "#fffbeb", action: "Conditions favour rising water. Monitor updates, secure valuables." },
  WARNING:   { label: "Flood Warning", color: "#c2410c", bg: "#fff7ed", action: "Flooding likely. Prepare to move to higher ground; avoid riverbanks & underpasses." },
  FLOOD:     { label: "Flooding",  color: "#b91c1c", bg: "#fef2f2", action: "Move to higher ground now. Never drive/walk through flood water." },
  EMERGENCY: { label: "Emergency", color: "#7f1d1d", bg: "#fef2f2", action: "Life-threatening levels. Evacuate immediately and call emergency services / send SOS." },
};

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371, d = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(d(bLat - aLat) / 2) ** 2 +
    Math.cos(d(aLat)) * Math.cos(d(bLat)) * Math.sin(d(bLon - aLon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestStation(lat: number, lon: number) {
  let best = STATIONS[0], bd = Infinity;
  for (const s of STATIONS) {
    const d = haversineKm(lat, lon, s.lat, s.lon);
    if (d < bd) { bd = d; best = s; }
  }
  return { station: best, distanceKm: bd };
}

export const fmtCfs = (v: number) =>
  v >= 10000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toLocaleString("en-US");
