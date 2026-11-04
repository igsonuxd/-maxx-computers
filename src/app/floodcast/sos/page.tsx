"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LocateFixed, PhoneCall, Search, Siren, CheckCircle2 } from "lucide-react";
import { nearestStation, stationById, fmtCfs } from "@/lib/floodcast/stations";
import { useStationLive } from "@/components/floodcast/hooks";
import { Section, RiskBadge, btnDanger, btnGhost, inputCls, labelCls } from "@/components/floodcast/ui";
import type { SosRecord } from "@/lib/floodcast/store";
import { toast } from "sonner";

const NEEDS = ["Rescue boat", "Drinking water", "Food", "Medical help", "Elderly / children", "Shelter", "Power / charging"];
const WATER: [string, string][] = [["NONE", "No water inside yet"], ["ANKLE", "Ankle-deep"], ["KNEE", "Knee-deep"], ["WAIST", "Waist-deep"], ["CHEST", "Chest-deep"], ["ROOF", "On roof / upper floor"], ["TRAPPED", "Trapped — cannot move"]];

function SosForm() {
  const sp = useSearchParams();
  const preset = stationById(sp.get("station") ?? "");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const near = coords ? nearestStation(coords.lat, coords.lon) : null;
  const contextStation = near?.station ?? preset ?? undefined;
  const live = useStationLive(contextStation ?? stationById("01646500")!);
  const [needs, setNeeds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<SosRecord | null>(null);
  const [backend, setBackend] = useState<string>("");

  const locate = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported — please type your address."); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }); toast.success("Location captured."); },
      () => toast.error("Location permission denied — please type your address."), { timeout: 10000 });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSending(true);
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get("name"), phone: f.get("phone"), peopleCount: Number(f.get("peopleCount") || 1),
      address: f.get("address") || null, lat: coords?.lat ?? null, lon: coords?.lon ?? null,
      waterLevel: f.get("waterLevel"), needs, medical: f.get("medical") === "on",
      message: f.get("message") || null,
      riskLevel: contextStation ? live.riskPeak : "NORMAL",
      predictedCfs: contextStation ? (live.peak?.discharge_cfs ?? null) : null,
      stationId: contextStation?.station_id ?? null,
    };
    try {
      const r = await fetch("/api/floodcast/sos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setDone(j.sos); setBackend(j.backend);
      toast.success("SOS sent. Help is being coordinated.");
    } catch { toast.error("Could not send SOS. Call 112 / 911 now if you are in danger."); }
    finally { setSending(false); }
  };

  if (done) return (
    <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
      <h3 className="font-black text-2xl text-emerald-950 mt-3">SOS received — stay where you are if safe</h3>
      <p className="text-emerald-900/80 mt-2">Your rescue ID is <strong className="text-xl font-mono">{done.publicId}</strong> · Priority <strong>{done.priorityLabel}</strong> (score {done.priorityScore}/100) · Status <strong>{done.status}</strong></p>
      <p className="text-sm text-emerald-900/70 mt-2">Nearest gauge context attached for responders: {done.stationName ?? "—"}{done.distanceKm != null ? ` (${done.distanceKm} km away)` : ""} · predicted risk {done.riskLevel}{done.predictedCfs ? ` · peak ${fmtCfs(done.predictedCfs)} cfs` : ""}.</p>
      <p className="text-xs text-emerald-900/60 mt-3">Stored via: {backend}. Keep your phone on and charged. If conditions worsen, call <a className="font-bold underline" href="tel:112">112</a> / <a className="font-bold underline" href="tel:911">911</a>.</p>
      <div className="flex flex-wrap justify-center gap-3 mt-5">
        <Link href={`/floodcast/sos?track=${done.publicId}`} className={btnGhost}>Track this SOS</Link>
        <Link href="/floodcast/rescue" className={btnGhost}>Responder board</Link>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid md:grid-cols-2 gap-4">
        <div><label className={labelCls}>YOUR NAME *</label><input name="name" required minLength={2} className={inputCls} placeholder="Full name" /></div>
        <div><label className={labelCls}>PHONE (RESPONDERS WILL CALL) *</label><input name="phone" required minLength={7} className={inputCls} placeholder="+91 / +1 …" inputMode="tel" /></div>
        <div><label className={labelCls}>PEOPLE WITH YOU</label><input name="peopleCount" type="number" min={1} max={500} defaultValue={1} className={inputCls} /></div>
        <div><label className={labelCls}>WATER LEVEL</label>
          <select name="waterLevel" className={inputCls} defaultValue="KNEE">{WATER.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="md:col-span-2"><label className={labelCls}>ADDRESS / LANDMARK</label><input name="address" className={inputCls} placeholder="House no, street, nearby landmark, town" /></div>
        <div className="md:col-span-2"><label className={labelCls}>MESSAGE</label><textarea name="message" rows={3} className={inputCls} placeholder="Situation, injuries, floor you are on, anything responders must know…" /></div>
      </div>
      <div className="mt-4"><span className={labelCls}>YOU NEED</span>
        <div className="flex flex-wrap gap-2">{NEEDS.map((n) => (
          <button type="button" key={n} onClick={() => setNeeds((s) => s.includes(n) ? s.filter((x) => x !== n) : [...s, n])}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${needs.includes(n) ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-700 border-slate-300 hover:border-red-400"}`}>{n}</button>))}
        </div></div>
      <label className="flex items-center gap-2.5 mt-4 text-sm font-semibold text-slate-800">
        <input type="checkbox" name="medical" className="w-4 h-4 accent-red-600" /> Someone needs urgent medical attention
      </label>
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mt-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 text-sm">
          <strong>Location & live river context.</strong>{" "}
          {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)} — nearest gauge ${near?.station.name} (${near?.distanceKm.toFixed(0)} km)` :
            preset ? `Reporting near ${preset.name}.` : "Tap locate so responders get your exact position."}
          {contextStation && <span className="block mt-1.5">Predicted 7-day risk there: <RiskBadge level={live.riskPeak} /> {live.peak && <span className="text-slate-500">peak {fmtCfs(live.peak.discharge_cfs)} cfs on {live.peak.date} — auto-attached to your SOS & triage score.</span>}</span>}
        </div>
        <button type="button" onClick={locate} className={btnGhost}><LocateFixed className="w-4 h-4" /> Use my location</button>
      </div>
      <button disabled={sending} className={btnDanger + " w-full mt-5 !py-4 !text-base"}>
        <Siren className="w-5 h-5" /> {sending ? "SENDING SOS…" : "SEND SOS NOW"}
      </button>
      <p className="text-xs text-slate-400 mt-3 text-center">Demo system — in a real life-threatening emergency call 112 / 911 first. Your phone number is shared with responders for rescue only.</p>
    </form>
  );
}

function Tracker({ initial }: { initial: string }) {
  const [id, setId] = useState(initial);
  const [rec, setRec] = useState<SosRecord | null | undefined>(undefined);
  const run = async (q: string) => {
    if (!q.trim()) return;
    const r = await fetch(`/api/floodcast/sos?id=${encodeURIComponent(q.trim())}`);
    setRec(r.ok ? (await r.json()).sos : null);
  };
  useEffect(() => {
    if (!initial) return;
    let on = true;
    fetch(`/api/floodcast/sos?id=${encodeURIComponent(initial)}`)
      .then(async (r) => (r.ok ? (await r.json()).sos : null))
      .then((rec) => { if (on) setRec(rec); })
      .catch(() => { if (on) setRec(null); });
    return () => { on = false; };
  }, [initial]);
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-black text-lg flex items-center gap-2"><Search className="w-5 h-5 text-cyan-700" /> Track your SOS</h3>
      <div className="flex gap-2 mt-4">
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="FC-20261104-XXXX" className={inputCls + " font-mono"} />
        <button onClick={() => run(id)} className={btnGhost}>Track</button>
      </div>
      {rec === null && <p className="text-sm text-red-600 mt-3">Not found — check the ID (IDs from an earlier server restart may be gone in memory-mode demo).</p>}
      {rec && <div className="mt-4 text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-slate-500">Status</span><strong>{rec.status}</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Priority</span><strong>{rec.priorityLabel} ({rec.priorityScore}/100)</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Submitted</span><strong>{new Date(rec.createdAt).toLocaleString()}</strong></div>
        <div className="flex justify-between"><span className="text-slate-500">Nearest gauge</span><strong>{rec.stationName ?? "—"}</strong></div>
        {rec.rescuerNote && <p className="rounded-xl bg-cyan-50 text-cyan-900 p-3 mt-2"><strong>Responder note:</strong> {rec.rescuerNote}</p>}
        <div className="flex gap-1.5 mt-3">{["NEW", "ACKNOWLEDGED", "DISPATCHED", "RESCUED"].map((s, i, a) => {
          const idx = a.indexOf(rec.status === "CLOSED" ? "RESCUED" : rec.status);
          return <span key={s} className={`flex-1 text-center rounded-lg py-1.5 text-[10px] font-black ${i <= idx ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-400"}`}>{s}</span>;
        })}</div>
      </div>}
    </div>
  );
}

export default function SosPage() {
  return (
    <div>
      <Section title="Emergency SOS" sub="One form → geolocated, river-risk-tagged rescue request on the responders' triage board in seconds.">
        <div className="rounded-2xl bg-red-600 text-white p-4 mb-6 flex flex-col sm:flex-row items-center gap-3">
          <PhoneCall className="w-6 h-6 shrink-0" />
          <p className="font-bold flex-1 text-center sm:text-left">Life in immediate danger? Call first, form second.</p>
          <div className="flex gap-2">
            <a href="tel:112" className="rounded-lg bg-white text-red-700 font-black px-4 py-2">CALL 112</a>
            <a href="tel:911" className="rounded-lg bg-red-800 font-black px-4 py-2">CALL 911</a>
          </div>
        </div>
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3"><Suspense fallback={null}><SosFormInner /></Suspense></div>
          <div className="lg:col-span-2"><Suspense fallback={null}><TrackerFromUrl /></Suspense></div>
        </div>
      </Section>
    </div>
  );
}
function SosFormInner() { return <SosForm />; }
function TrackerFromUrl() { const sp = useSearchParams(); return <Tracker initial={sp.get("track") ?? ""} />; }
