"use client";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BellRing, ExternalLink, Siren } from "lucide-react";
import { stationById, thresholdsFor, fmtCfs, RISK_META } from "@/lib/floodcast/stations";
import { useStationLive } from "@/components/floodcast/hooks";
import HydroChart from "@/components/floodcast/HydroChart";
import { Section, Stat, RiskBadge, SourceBadge, Disclaimer, btnDanger, btnGhost } from "@/components/floodcast/ui";

export default function StationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const st = stationById(id);
  if (!st) notFound();
  return <StationDetail id={st.station_id} />;
}

function StationDetail({ id }: { id: string }) {
  const st = stationById(id)!;
  const live = useStationLive(st);
  const t = thresholdsFor(id);
  const hist = (live.series?.history ?? []).slice(-120);
  const observed = hist.map((r) => ({ date: r.date, v: r.discharge_cfs ?? 0 }));
  const predicted = live.bt.map((r) => ({ date: r.date, v: r.predicted }));
  const forecastPts = live.fc.map((r) => ({ date: r.date, v: r.discharge_cfs }));
  const precip = [...hist.map((r) => ({ date: r.date, v: r.precipitation_sum })),
                  ...live.fc.map((r) => ({ date: r.date, v: r.precipitation_sum }))];
  const lastW = hist[hist.length - 1];
  const rain7 = hist.slice(-7).reduce((s, r) => s + r.precipitation_sum, 0);
  const futRain = live.fc.reduce((s, r) => s + r.precipitation_sum, 0);
  // simple hindcast skill on the displayed window
  const errs = live.bt.map((r) => r.observed - r.predicted);
  const rmse = errs.length ? Math.sqrt(errs.reduce((s, e) => s + e * e, 0) / errs.length) : undefined;

  return (
    <div>
      <Section title={`${st.river}`}
        sub={`${st.name} · USGS ${st.station_id} · ${st.lat.toFixed(4)}, ${st.lon.toFixed(4)} · Drainage ${st.DRNAREA.toLocaleString()} sq mi`}
        action={<div className="flex gap-2 items-center"><SourceBadge source={live.series?.source} /><RiskBadge level={live.riskPeak} /></div>}>
        {live.series?.note && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">⚠ {live.series.note}</div>}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Stat label="CURRENT DISCHARGE (OBSERVED)" value={live.current != null ? `${fmtCfs(live.current)} cfs` : "…"} hint={live.currentDate ? `USGS daily value · ${live.currentDate}` : undefined} />
          <Stat label="PREDICTED 7-DAY PEAK" value={live.peak ? `${fmtCfs(live.peak.discharge_cfs)} cfs` : "…"} hint={live.peak ? `ML forecast peak · ${live.peak.date} · ${RISK_META[live.riskPeak].label}` : undefined} />
          <Stat label="RAIN · LAST 7D → NEXT 7D" value={`${rain7.toFixed(0)} → ${futRain.toFixed(0)} mm`} hint={lastW ? `Soil moisture (0–7cm) ${lastW.soil_moisture_0_to_7cm.toFixed(2)} m³/m³` : undefined} />
          <Stat label="HINDCAST RMSE (60D)" value={rmse != null ? `${fmtCfs(rmse)} cfs` : "…"} hint="Model A vs observed, displayed window" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm mt-6">
          <HydroChart observed={observed} predicted={predicted} forecastPts={forecastPts} precip={precip} thresholds={t} />
          <p className="text-[11px] text-slate-400 mt-2">*Thresholds are historical percentiles of the training record (Watch q90 · Warning q95 · Flood q98) — demo proxies, not official NWS flood-stage discharges.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mt-6">
          <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
            <h3 className="font-black text-slate-950 mb-3">7-day ML forecast</h3>
            <table className="w-full text-sm min-w-[480px]">
              <thead><tr className="text-left text-xs text-slate-400 border-b"><th className="py-2">Date</th><th>Predicted discharge</th><th>Forecast rain</th><th>Risk</th></tr></thead>
              <tbody>{live.fc.map((d) => (
                <tr key={d.date} className="border-b border-slate-100">
                  <td className="py-2 font-semibold">{d.date}</td>
                  <td className="font-black">{fmtCfs(d.discharge_cfs)} cfs <span className="font-normal text-slate-400">({d.discharge_cfs.toLocaleString()})</span></td>
                  <td>{d.precipitation_sum.toFixed(1)} mm</td>
                  <td><RiskBadge level={t && d.discharge_cfs >= t.q99_cfs ? "EMERGENCY" : t && d.discharge_cfs >= t.flood_cfs ? "FLOOD" : t && d.discharge_cfs >= t.warning_cfs ? "WARNING" : t && d.discharge_cfs >= t.watch_cfs ? "WATCH" : "NORMAL"} /></td>
                </tr>))}</tbody>
            </table>
            <p className="text-sm mt-4 rounded-xl p-3" style={{ background: RISK_META[live.riskPeak].bg, color: RISK_META[live.riskPeak].color }}>
              <strong>Guidance:</strong> {RISK_META[live.riskPeak].action}
            </p>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-black text-slate-950 mb-3">Catchment — StreamStats</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                {[["DRNAREA", `${st.DRNAREA.toLocaleString()} sq mi`], ["ELEV (mean)", `${st.ELEV.toLocaleString()} ft`],
                  ["FOREST", `${st.FOREST}%`], ["SLOPE_PCT", `${st.SLOPE_PCT}%`], ["Impervious", `${st.IMPERVIOUS}%`],
                  ["Climate regime", st.climate.replaceAll("_", " ")]].map(([k, v]) => (
                  <div key={k}><dt className="text-[11px] font-bold tracking-wide text-slate-400">{k}</dt><dd className="font-bold text-slate-900">{v}</dd></div>))}
              </dl>
              {t && <div className="mt-4 pt-4 border-t border-slate-100 text-sm space-y-1">
                <div className="text-[11px] font-bold tracking-wide text-slate-400 mb-2">HISTORICAL FLOW PERCENTILES (TRAINING RECORD)</div>
                {[["Median", t.median_cfs], ["q90 · Watch", t.watch_cfs], ["q95 · Warning", t.warning_cfs], ["q98 · Flood", t.flood_cfs], ["q99 · Emergency", t.q99_cfs], ["Record (train)", t.max_cfs]].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between"><span className="text-slate-500">{k}</span><strong>{fmtCfs(Number(v))} cfs</strong></div>))}
              </div>}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h3 className="font-black text-slate-950">Stay safe near this river</h3>
              <Link href={`/floodcast/alerts?station=${st.station_id}`} className={btnGhost + " w-full"}><BellRing className="w-4 h-4" /> Get alerts for this station</Link>
              <Link href={`/floodcast/sos?station=${st.station_id}`} className={btnDanger + " w-full"}><Siren className="w-4 h-4" /> Send SOS from this area</Link>
              <a href={`https://waterdata.usgs.gov/monitoring-location/${st.station_id}/`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-cyan-700 hover:underline">
                Official USGS gauge page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </Section>
      <Disclaimer />
    </div>
  );
}
