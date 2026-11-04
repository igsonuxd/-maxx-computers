"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LifeBuoy, MapPin, Phone, RefreshCw, Users } from "lucide-react";
import { fmtCfs } from "@/lib/floodcast/stations";
import { Section, Stat, Disclaimer, btnGhost, inputCls } from "@/components/floodcast/ui";
import type { SosRecord } from "@/lib/floodcast/store";
import { toast } from "sonner";

const STATUSES = ["NEW", "ACKNOWLEDGED", "DISPATCHED", "RESCUED", "CLOSED"];
const P_STYLE: Record<string, string> = { CRITICAL: "#b91c1c", HIGH: "#c2410c", MEDIUM: "#b45309", LOW: "#047857" };

export default function RescuePage() {
  const [list, setList] = useState<SosRecord[]>([]);
  const [backend, setBackend] = useState("");
  const [filter, setFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const j = await (await fetch("/api/floodcast/sos", { cache: "no-store" })).json();
      setList(j.sos ?? []); setBackend(j.backend ?? "");
    } catch { toast.error("Could not load SOS list"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let on = true;
    fetch("/api/floodcast/sos", { cache: "no-store" }).then((r) => r.json())
      .then((j) => { if (on) { setList(j.sos ?? []); setBackend(j.backend ?? ""); setLoading(false); } })
      .catch(() => { if (on) setLoading(false); });
    const t = setInterval(load, 30000);
    return () => { on = false; clearInterval(t); };
  }, [load]);

  const shown = useMemo(() => {
    const f = list.filter((s) => filter === "ALL" ? true : filter === "ACTIVE" ? !["RESCUED", "CLOSED"].includes(s.status) : s.status === filter);
    return [...f].sort((a, b) => b.priorityScore - a.priorityScore || +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [list, filter]);
  const counts = useMemo(() => ({
    active: list.filter((s) => !["RESCUED", "CLOSED"].includes(s.status)).length,
    critical: list.filter((s) => s.priorityLabel === "CRITICAL" && !["RESCUED", "CLOSED"].includes(s.status)).length,
    people: list.filter((s) => !["RESCUED", "CLOSED"].includes(s.status)).reduce((n, s) => n + s.peopleCount, 0),
    rescued: list.filter((s) => s.status === "RESCUED").length,
  }), [list]);

  const update = async (rec: SosRecord, status: string, note?: string) => {
    const r = await fetch(`/api/floodcast/sos/${rec.publicId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, ...(note ? { rescuerNote: note } : {}) }) });
    if (r.ok) { toast.success(`${rec.publicId} → ${status}`); load(); } else toast.error("Update failed");
  };

  return (
    <div>
      <Section title="Rescue coordination" sub="Triage board sorted by priority score (water depth + medical + people + live predicted river risk). Auto-refreshes every 30s."
        action={<button onClick={load} className={btnGhost}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh · {backend}</button>}>
        <div className="grid md:grid-cols-4 gap-4">
          <Stat label="ACTIVE REQUESTS" value={String(counts.active)} />
          <Stat label="CRITICAL PRIORITY" value={String(counts.critical)} hint="Score ≥ 70 — dispatch first" />
          <Stat label="PEOPLE AWAITING RESCUE" value={String(counts.people)} />
          <Stat label="RESCUED" value={String(counts.rescued)} />
        </div>
        <div className="flex flex-wrap gap-2 mt-6">
          {["ACTIVE", "ALL", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black border transition ${filter === s ? "bg-slate-950 text-white border-slate-950" : "bg-white text-slate-600 border-slate-300"}`}>{s}</button>))}
          <Link href="/floodcast/map" className="ml-auto text-xs font-black text-cyan-700 self-center hover:underline">View SOS pins on risk map →</Link>
        </div>
        {shown.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center mt-6">
            <LifeBuoy className="w-9 h-9 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 mt-2">No SOS requests {filter !== "ALL" ? `in “${filter}”` : ""} yet.</p>
            <p className="text-sm text-slate-500 mt-1">Submit one from the SOS page to see the full loop: SOS → triage → dispatch → rescued.</p>
            <Link href="/floodcast/sos" className={btnGhost + " mt-4"}>Open SOS form</Link>
          </div>)}
        <div className="grid xl:grid-cols-2 gap-5 mt-6">
          {shown.map((s) => <SosCard key={s.publicId} s={s} onUpdate={update} />)}
        </div>
        <p className="text-xs text-slate-400 mt-6">⚠ Hackathon demo: this board is unauthenticated. In production, gate it behind responder login and audit every status change.</p>
      </Section>
      <Disclaimer />
    </div>
  );
}

function SosCard({ s, onUpdate }: { s: SosRecord; onUpdate: (r: SosRecord, st: string, note?: string) => void }) {
  const [note, setNote] = useState(s.rescuerNote ?? "");
  const next = STATUSES[Math.min(STATUSES.indexOf(s.status) + 1, STATUSES.length - 1)];
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono font-black text-slate-900">{s.publicId}</span>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black text-white" style={{ background: P_STYLE[s.priorityLabel] }}>{s.priorityLabel} · {s.priorityScore}/100</span>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-950 text-white">{s.status}</span>
        {s.medical && <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-700">✚ MEDICAL</span>}
        <span className="ml-auto text-xs text-slate-400">{new Date(s.createdAt).toLocaleString()}</span>
      </div>
      <h3 className="font-black text-lg mt-2.5">{s.name} <a href={`tel:${s.phone}`} className="text-cyan-700 text-sm font-bold inline-flex items-center gap-1 ml-1"><Phone className="w-3.5 h-3.5" />{s.phone}</a></h3>
      <div className="text-sm text-slate-600 space-y-1 mt-1">
        <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {s.peopleCount} people · water: <strong>{s.waterLevel}</strong>{s.needs.length > 0 && <> · needs: {s.needs.join(", ")}</>}</div>
        {s.address && <div className="flex items-start gap-1.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{s.address}</div>}
        {s.lat != null && <a className="text-cyan-700 font-bold text-xs" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${s.lat},${s.lon}`}>📍 {s.lat.toFixed(4)}, {s.lon?.toFixed(4)} — open in Google Maps ↗</a>}
        {s.message && <p className="rounded-xl bg-slate-50 p-2.5 text-slate-700">“{s.message}”</p>}
        <p className="text-xs rounded-xl bg-cyan-50 text-cyan-900 p-2.5">
          <strong>Live river context:</strong> {s.stationName ?? "no gauge linked"}{s.distanceKm != null ? ` · ${s.distanceKm} km` : ""} · predicted risk <strong>{s.riskLevel}</strong>{s.predictedCfs != null ? ` · 7-day peak ${fmtCfs(s.predictedCfs)} cfs` : ""}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <select value={s.status} onChange={(e) => onUpdate(s, e.target.value)} className={inputCls + " sm:w-44 font-bold"}>
          {STATUSES.map((x) => <option key={x}>{x}</option>)}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Responder note (boat # / ETA…)" className={inputCls + " flex-1"} />
        <button onClick={() => onUpdate(s, next, note || undefined)} className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-800 whitespace-nowrap">
          → {next}
        </button>
      </div>
    </article>
  );
}
