"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BellRing, TriangleAlert } from "lucide-react";
import { STATIONS, fmtCfs, type RiskLevel, type Station } from "@/lib/floodcast/stations";
import { useStationLive } from "@/components/floodcast/hooks";
import { Section, RiskBadge, Disclaimer, btnPrimary, inputCls, labelCls } from "@/components/floodcast/ui";
import type { SubRecord } from "@/lib/floodcast/store";
import { toast } from "sonner";

const ORDER: RiskLevel[] = ["NORMAL", "WATCH", "WARNING", "FLOOD", "EMERGENCY"];

function ActiveAlerts({ station }: { station: Station }) {
  const live = useStationLive(station);
  if (live.loading || live.riskPeak === "NORMAL") return null;
  return (
    <Link href={`/floodcast/stations/${station.station_id}`} className="rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-center gap-3 hover:shadow transition">
      <TriangleAlert className="w-6 h-6 text-orange-600 shrink-0" />
      <div className="flex-1 text-sm">
        <strong className="text-orange-950">{station.river} ({station.state})</strong> — ML peak {live.peak ? `${fmtCfs(live.peak.discharge_cfs)} cfs on ${live.peak.date}` : ""}
      </div>
      <RiskBadge level={live.riskPeak} />
    </Link>
  );
}

function SubscribeForm() {
  const sp = useSearchParams();
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [backend, setBackend] = useState("");
  const load = async () => { const j = await (await fetch("/api/floodcast/alerts", { cache: "no-store" })).json(); setSubs(j.subscriptions ?? []); setBackend(j.backend ?? ""); };
  useEffect(() => {
    let on = true;
    fetch("/api/floodcast/alerts", { cache: "no-store" }).then((r) => r.json())
      .then((j) => { if (on) { setSubs(j.subscriptions ?? []); setBackend(j.backend ?? ""); } })
      .catch(() => undefined);
    return () => { on = false; };
  }, []);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(["name", "contact", "channel", "stationId", "thresholdLevel"].map((k) => [k, f.get(k)]));
    const r = await fetch("/api/floodcast/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (r.ok) { toast.success("Subscribed — you'll be flagged when predicted risk crosses your threshold."); (e.target as HTMLFormElement).reset(); load(); }
    else toast.error(j.error ?? "Subscribe failed");
  };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-black text-lg flex items-center gap-2"><BellRing className="w-5 h-5 text-cyan-700" /> Subscribe to early warnings</h3>
      <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 mt-5">
        <div><label className={labelCls}>NAME *</label><input name="name" required minLength={2} className={inputCls} /></div>
        <div><label className={labelCls}>PHONE / EMAIL *</label><input name="contact" required minLength={5} className={inputCls} placeholder="+91… or you@example.com" /></div>
        <div><label className={labelCls}>CHANNEL</label><select name="channel" className={inputCls}><option>SMS</option><option>WHATSAPP</option><option>EMAIL</option></select></div>
        <div><label className={labelCls}>RIVER STATION</label>
          <select name="stationId" className={inputCls} defaultValue={sp.get("station") ?? STATIONS[0].station_id}>
            {STATIONS.map((s) => <option key={s.station_id} value={s.station_id}>{s.river} — {s.state}</option>)}
          </select></div>
        <div><label className={labelCls}>ALERT ME AT OR ABOVE</label>
          <select name="thresholdLevel" className={inputCls} defaultValue="WARNING">{ORDER.slice(1).map((l) => <option key={l}>{l}</option>)}</select></div>
        <div className="flex items-end"><button className={btnPrimary + " w-full"}>Subscribe</button></div>
      </form>
      <p className="text-xs text-slate-400 mt-3">Subscriptions are stored ({backend || "…"}). Live dispatch needs an SMS/WhatsApp provider (e.g. Twilio) wired to a scheduled job — the matching logic is: predicted 7-day risk ≥ your threshold.</p>
      {subs.length > 0 && <div className="mt-5">
        <div className="text-xs font-black tracking-wide text-slate-400 mb-2">RECENT SUBSCRIPTIONS ({subs.length})</div>
        <ul className="divide-y divide-slate-100 text-sm">{subs.slice(0, 8).map((s) => (
          <li key={s.id} className="py-2 flex flex-wrap gap-x-3"><strong>{s.name}</strong><span className="text-slate-500">{s.channel} · {s.contact}</span>
            <span className="ml-auto font-bold text-slate-700">{STATIONS.find((x) => x.station_id === s.stationId)?.river ?? s.stationId} ≥ {s.thresholdLevel}</span></li>))}
        </ul></div>}
    </div>
  );
}

export default function AlertsPage() {
  return (
    <div>
      <Section title="Early-warning alerts" sub="Auto-generated from live ML forecasts. If nothing shows under “Active”, all 5 rivers are predicted Normal for the next 7 days.">
        <h3 className="font-black text-slate-950 mb-3">Active warnings (next 7 days)</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {STATIONS.map((s) => <ActiveAlerts key={s.station_id} station={s} />)}
        </div>
        <div className="mt-8"><Suspense fallback={null}><SubscribeForm /></Suspense></div>
      </Section>
      <Disclaimer />
    </div>
  );
}
