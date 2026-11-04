"use client";
import { fmtCfs, type StationThresholds } from "@/lib/floodcast/stations";

interface Pt { date: string; v: number }
interface Props {
  observed: Pt[]; predicted?: Pt[]; forecastPts?: Pt[]; precip?: Pt[];
  thresholds?: StationThresholds; height?: number;
}

/** Dependency-free SVG hydrograph: observed + hindcast + forecast + thresholds + rain. */
export default function HydroChart({ observed, predicted = [], forecastPts = [], precip = [], thresholds, height = 320 }: Props) {
  const W = 920, H = height, PL = 64, PR = 16, PT = 18, PB = 58;
  const all = [...observed, ...forecastPts];
  if (all.length < 2) return <div className="h-40 grid place-items-center text-slate-400 text-sm">Loading hydrograph…</div>;
  const dates = all.map((p) => p.date);
  const x = (d: string) => PL + (dates.indexOf(d) / Math.max(1, dates.length - 1)) * (W - PL - PR);
  const maxV = Math.max(...all.map((p) => p.v), ...(predicted.map((p) => p.v)), thresholds?.warning_cfs ?? 0) * 1.15;
  const y = (v: number) => PT + (1 - v / maxV) * (H - PT - PB);
  const maxP = Math.max(10, ...precip.map((p) => p.v));
  const path = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const fPath = forecastPts.length && observed.length
    ? path([observed[observed.length - 1], ...forecastPts]) : "";
  const barW = Math.max(1, (W - PL - PR) / Math.max(1, precip.length) - 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => maxV / 1.15 * f);
  const every = Math.ceil(dates.length / 8);
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[640px]" role="img" aria-label="River discharge hydrograph">
        {ticks.map((t, i) => <g key={i}>
          <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="#e2e8f0" />
          <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{fmtCfs(t)}</text>
        </g>)}
        {precip.map((p, i) => <rect key={i} x={x(p.date) - barW / 2} y={PT} width={barW}
          height={(p.v / maxP) * 46} fill="#38bdf8" opacity="0.45" />)}
        {thresholds && <>
          <line x1={PL} x2={W - PR} y1={y(thresholds.watch_cfs)} y2={y(thresholds.watch_cfs)} stroke="#d97706" strokeDasharray="5 4" />
          <line x1={PL} x2={W - PR} y1={y(thresholds.warning_cfs)} y2={y(thresholds.warning_cfs)} stroke="#ea580c" strokeDasharray="5 4" />
          <line x1={PL} x2={W - PR} y1={y(thresholds.flood_cfs)} y2={y(thresholds.flood_cfs)} stroke="#dc2626" strokeDasharray="5 4" />
          <text x={W - PR} y={y(thresholds.watch_cfs) - 4} textAnchor="end" fontSize="10" fill="#d97706">WATCH q90</text>
          <text x={W - PR} y={y(thresholds.warning_cfs) - 4} textAnchor="end" fontSize="10" fill="#ea580c">WARNING q95</text>
          <text x={W - PR} y={y(thresholds.flood_cfs) - 4} textAnchor="end" fontSize="10" fill="#dc2626">FLOOD q98*</text>
        </>}
        {predicted.length > 1 && <path d={path(predicted)} fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeDasharray="4 3" />}
        <path d={path(observed)} fill="none" stroke="#0369a1" strokeWidth="2.2" />
        {fPath && <path d={fPath} fill="none" stroke="#dc2626" strokeWidth="2.4" />}
        {forecastPts.map((p, i) => <circle key={i} cx={x(p.date)} cy={y(p.v)} r="3" fill="#dc2626" />)}
        {dates.filter((_, i) => i % every === 0).map((d) =>
          <text key={d} x={x(d)} y={H - 34} textAnchor="middle" fontSize="10" fill="#64748b"
            transform={`rotate(-28 ${x(d)} ${H - 34})`}>{d.slice(5)}</text>)}
        <text x={PL} y={H - 8} fontSize="11" fill="#0369a1" fontWeight="bold">— Observed discharge (cfs)</text>
        <text x={PL + 190} y={H - 8} fontSize="11" fill="#94a3b8" fontWeight="bold">- - Model hindcast</text>
        <text x={PL + 330} y={H - 8} fontSize="11" fill="#dc2626" fontWeight="bold">— 7-day ML forecast</text>
        <text x={PL + 480} y={H - 8} fontSize="11" fill="#38bdf8" fontWeight="bold">▊ Rainfall (mm, top)</text>
      </svg>
    </div>
  );
}

export function Sparkline({ values, color = "#0369a1", width = 220, height = 44 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return <div style={{ width, height }} className="bg-slate-50 rounded" />;
  const max = Math.max(...values), min = Math.min(...values), rng = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 3 - ((v - min) / rng) * (height - 6)}`).join(" ");
  return <svg width={width} height={height} className="max-w-full"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}
