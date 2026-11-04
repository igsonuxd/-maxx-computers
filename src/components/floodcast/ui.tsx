"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { RISK_META, type RiskLevel } from "@/lib/floodcast/stations";
import type { SeriesSource } from "@/lib/floodcast/live";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const m = RISK_META[level];
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide"
    style={{ color: m.color, background: m.bg }}>
    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: m.color }} />{m.label.toUpperCase()}
  </span>;
}

export function SourceBadge({ source }: { source?: SeriesSource }) {
  if (!source) return <span className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 text-zinc-500 font-semibold">LOADING…</span>;
  return source === "usgs+openmeteo_live"
    ? <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">● LIVE · USGS + OPEN-METEO</span>
    : <span title="Live APIs unreachable from this browser/session. Seeded simulation — not real observations."
        className="text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-800 font-bold">◆ OFFLINE FALLBACK · SIMULATION</span>;
}

export function Section({ title, sub, children, action }: { title: string; sub?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div><h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">{title}</h2>
        {sub && <p className="text-slate-500 mt-1 max-w-3xl text-sm md:text-base">{sub}</p>}</div>
      {action}
    </div>{children}
  </section>;
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="text-[11px] font-bold tracking-widest text-slate-400">{label}</div>
    <div className="text-2xl font-black text-slate-950 mt-1">{value}</div>
    {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
  </div>;
}

export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-800 transition disabled:opacity-50";
export const btnDanger = "inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 transition disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition";
export const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";
export const labelCls = "block text-xs font-bold tracking-wide text-slate-500 mb-1.5";

export function Disclaimer() {
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <strong>Safety disclaimer:</strong> FLOODCAST is a hackathon prototype. Thresholds are historical-percentile
      proxies, not official NWS flood-stage values. In a real flood, follow official guidance
      (NWS / local authorities) and call <a className="font-bold underline" href="tel:112">112</a> /{" "}
      <a className="font-bold underline" href="tel:911">911</a>. Never walk or drive through flood water.{" "}
      <Link className="font-bold underline" href="/floodcast/model">Model & limitations →</Link>
    </div>
  </div>;
}
