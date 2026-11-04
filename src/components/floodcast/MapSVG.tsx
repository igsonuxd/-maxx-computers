"use client";
import Link from "next/link";
import { RISK_META, type RiskLevel, type Station } from "@/lib/floodcast/stations";

/** Offline-safe US station map (equirectangular projection, no tile server
 *  needed — works in every environment incl. sandbox preview). */
const LON0 = -125, LON1 = -66, LAT0 = 24, LAT1 = 50, W = 920, H = 520;
const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W;
const py = (lat: number) => H - ((lat - LAT0) / (LAT1 - LAT0)) * H;

export interface SosPin { id: string; lat: number; lon: number; label: string }

export default function MapSVG({ stations, riskById, sosPins = [] }: {
  stations: Station[]; riskById: Record<string, RiskLevel>; sosPins?: SosPin[];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-sky-50 to-cyan-50 p-3 shadow-sm">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Map of monitored river stations across the USA">
        {[-120, -110, -100, -90, -80, -70].map((lon) => <g key={lon}>
          <line x1={px(lon)} x2={px(lon)} y1={0} y2={H} stroke="#cbd5e1" strokeDasharray="3 5" />
          <text x={px(lon) + 4} y={16} fontSize="11" fill="#94a3b8">{Math.abs(lon)}°W</text></g>)}
        {[30, 35, 40, 45].map((lat) => <g key={lat}>
          <line x1={0} x2={W} y1={py(lat)} y2={py(lat)} stroke="#cbd5e1" strokeDasharray="3 5" />
          <text x={8} y={py(lat) - 5} fontSize="11" fill="#94a3b8">{lat}°N</text></g>)}
        {/* stylised CONUS outline (indicative, not a survey boundary) */}
        <path d="M60,120 L150,80 L300,70 L480,60 L640,70 L780,90 L860,130 L880,190 L840,250 L800,300 L760,360 L720,430 L690,470 L660,400 L600,360 L520,350 L430,380 L340,420 L250,430 L160,400 L100,330 L60,240 Z"
          fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" opacity="0.65" />
        {stations.map((s) => {
          const risk = riskById[s.station_id] ?? "NORMAL";
          const c = RISK_META[risk].color;
          return (
            <g key={s.station_id}>
              <circle cx={px(s.lon)} cy={py(s.lat)} r="16" fill={c} opacity="0.18">
                <animate attributeName="r" values="12;20;12" dur="2.6s" repeatCount="indefinite" />
              </circle>
              <circle cx={px(s.lon)} cy={py(s.lat)} r="7" fill={c} stroke="white" strokeWidth="2" />
              <text x={px(s.lon) + 12} y={py(s.lat) - 2} fontSize="13" fontWeight="bold" fill="#0f172a">{s.river}</text>
              <text x={px(s.lon) + 12} y={py(s.lat) + 13} fontSize="10.5" fill={c} fontWeight="bold">{RISK_META[risk].label.toUpperCase()} · USGS {s.station_id}</text>
            </g>
          );
        })}
        {sosPins.map((p) => (
          <g key={p.id}>
            <path d={`M${px(p.lon)},${py(p.lat) - 14} l7,12 h-14 Z`} fill="#dc2626" stroke="white" />
            <text x={px(p.lon)} y={py(p.lat) - 5} textAnchor="middle" fontSize="9" fill="white" fontWeight="black">!</text>
            <text x={px(p.lon) + 10} y={py(p.lat)} fontSize="10" fill="#b91c1c" fontWeight="bold">{p.label}</text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 px-2 pb-2">
        {stations.map((s) => (
          <Link key={s.station_id} href={`/floodcast/stations/${s.station_id}`}
            className="text-xs font-bold rounded-full bg-white border border-slate-200 px-3 py-1.5 hover:border-cyan-500">
            {s.river} · {s.state} →
          </Link>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 px-2 pb-1">Indicative map (offline-safe, no external tiles). Station coordinates are exact USGS gauge locations.</p>
    </div>
  );
}
