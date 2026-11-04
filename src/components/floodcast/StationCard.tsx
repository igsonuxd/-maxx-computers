"use client";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, MapPin } from "lucide-react";
import { fmtCfs, RISK_META, type Station } from "@/lib/floodcast/stations";
import { useStationLive } from "./hooks";
import { RiskBadge, SourceBadge } from "./ui";
import { Sparkline } from "./HydroChart";

export default function StationCard({ station }: { station: Station }) {
  const live = useStationLive(station);
  const hist = live.series?.history ?? [];
  const spark = hist.slice(-30).map((r) => r.discharge_cfs ?? 0);
  const color = RISK_META[live.riskPeak].color;
  return (
    <Link href={`/floodcast/stations/${station.station_id}`}
      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition block">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold tracking-widest text-slate-400">USGS {station.station_id} · {station.state}</div>
          <h3 className="font-black text-slate-950 leading-tight mt-1 group-hover:text-cyan-800">{station.river}</h3>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{station.name}</div>
        </div>
        <RiskBadge level={live.riskPeak} />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div className="rounded-xl bg-slate-50 py-2">
          <div className="text-[10px] font-bold text-slate-400 tracking-wide">CURRENT</div>
          <div className="font-black text-slate-900">{live.current != null ? `${fmtCfs(live.current)} cfs` : "…"}</div>
        </div>
        <div className="rounded-xl py-2" style={{ background: RISK_META[live.riskPeak].bg }}>
          <div className="text-[10px] font-bold tracking-wide" style={{ color }}>7-DAY PEAK (ML)</div>
          <div className="font-black" style={{ color }}>{live.peak ? `${fmtCfs(live.peak.discharge_cfs)} cfs` : "…"}</div>
        </div>
        <div className="rounded-xl bg-slate-50 py-2">
          <div className="text-[10px] font-bold text-slate-400 tracking-wide">7-DAY TREND</div>
          <div className="font-black text-slate-900 flex items-center justify-center gap-1">
            {live.trendPct == null ? "…" : live.trendPct >= 0
              ? <><ArrowUpRight className="w-4 h-4 text-red-500" />{live.trendPct.toFixed(0)}%</>
              : <><ArrowDownRight className="w-4 h-4 text-emerald-600" />{Math.abs(live.trendPct).toFixed(0)}%</>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <Sparkline values={spark} color={color} />
        <SourceBadge source={live.series?.source} />
      </div>
      <div className="text-xs text-slate-500 mt-3">{RISK_META[live.riskPeak].action}</div>
    </Link>
  );
}
