"use client";
import { useMemo, useState } from "react";
import { BrainCircuit, CloudRain, Download, FileUp, FlaskConical, ShieldCheck, ShieldAlert } from "lucide-react";
import { STATIONS, stationById, thresholdsFor, fmtCfs, riskFor } from "@/lib/floodcast/stations";
import { useStationLive } from "@/components/floodcast/hooks";
import HydroChart from "@/components/floodcast/HydroChart";
import { Section, Stat, RiskBadge, Disclaimer, btnPrimary, btnGhost, inputCls, labelCls } from "@/components/floodcast/ui";
import { predictFromTestCsv, downloadText, SAMPLE_TEST_CSV, type CsvPredictReport } from "@/lib/floodcast/csv";
import { toast } from "sonner";

function Scenario() {
  const [sid, setSid] = useState(STATIONS[0].station_id);
  const [extraRain, setExtraRain] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const st = stationById(sid)!;
  const base = useStationLive(st);
  const scen = useStationLive(st, extraRain, multiplier);
  const t = thresholdsFor(sid);
  const hist = (base.series?.history ?? []).slice(-45);
  const observed = hist.map((r) => ({ date: r.date, v: r.discharge_cfs ?? 0 }));
  const scenPts = scen.fc.map((r) => ({ date: r.date, v: r.discharge_cfs }));
  const delta = base.peak && scen.peak ? scen.peak.discharge_cfs - base.peak.discharge_cfs : 0;
  const [logging, setLogging] = useState(false);
  const save = async () => {
    if (!scen.peak) return; setLogging(true);
    try {
      await fetch("/api/floodcast/alerts", { method: "GET" }); // warm route
      toast.success(`Scenario computed: peak ${fmtCfs(scen.peak.discharge_cfs)} cfs on ${scen.peak.date} (${scen.riskPeak}).`);
    } finally { setLogging(false); }
  };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-black text-xl flex items-center gap-2"><FlaskConical className="w-5 h-5 text-cyan-700" /> What-if storm simulator</h3>
      <p className="text-sm text-slate-500 mt-1">Genuine Model-A inference: your rainfall scenario is pushed through the same lag/API/soil features and trained coefficients — no fake numbers.</p>
      <div className="grid md:grid-cols-3 gap-4 mt-5">
        <div><label className={labelCls}>STATION</label>
          <select className={inputCls} value={sid} onChange={(e) => setSid(e.target.value)}>
            {STATIONS.map((s) => <option key={s.station_id} value={s.station_id}>{s.river} — {s.state}</option>)}
          </select></div>
        <div><label className={labelCls}>EXTRA RAIN PER FORECAST DAY · {extraRain} mm</label>
          <input type="range" min={0} max={120} step={5} value={extraRain} onChange={(e) => setExtraRain(Number(e.target.value))} className="w-full accent-cyan-700 mt-2.5" /></div>
        <div><label className={labelCls}>FORECAST RAIN MULTIPLIER · ×{multiplier.toFixed(1)}</label>
          <input type="range" min={0} max={3} step={0.1} value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} className="w-full accent-cyan-700 mt-2.5" /></div>
      </div>
      <div className="grid md:grid-cols-4 gap-4 mt-5">
        <Stat label="BASELINE PEAK" value={base.peak ? `${fmtCfs(base.peak.discharge_cfs)} cfs` : "…"} hint={base.peak?.date} />
        <Stat label="SCENARIO PEAK" value={scen.peak ? `${fmtCfs(scen.peak.discharge_cfs)} cfs` : "…"} hint={scen.peak ? `${scen.peak.date}` : undefined} />
        <Stat label="CHANGE" value={`${delta >= 0 ? "+" : "−"}${fmtCfs(Math.abs(delta))} cfs`} hint="Scenario minus baseline peak" />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold tracking-widest text-slate-400">SCENARIO RISK</div>
          <div className="mt-2"><RiskBadge level={scen.riskPeak} /></div>
          <button onClick={save} disabled={logging || scen.loading} className={btnGhost + " mt-3 w-full !py-2 text-xs"}>Confirm scenario</button>
        </div>
      </div>
      <div className="mt-5">
        <HydroChart observed={observed} forecastPts={scenPts} thresholds={t}
          precip={[...hist.map((r) => ({ date: r.date, v: r.precipitation_sum })), ...scen.fc.map((r) => ({ date: r.date, v: r.precipitation_sum }))]} />
      </div>
      <div className="overflow-x-auto mt-4"><table className="w-full text-sm min-w-[520px]">
        <thead><tr className="text-left text-xs text-slate-400 border-b"><th className="py-2">Date</th><th>Scenario rain</th><th>Predicted discharge_cfs</th><th>Risk</th></tr></thead>
        <tbody>{scen.fc.map((d) => <tr key={d.date} className="border-b border-slate-100">
          <td className="py-1.5 font-semibold">{d.date}</td><td>{d.precipitation_sum.toFixed(1)} mm</td>
          <td className="font-black">{d.discharge_cfs.toLocaleString()}</td><td><RiskBadge level={riskFor(d.discharge_cfs, t)} /></td></tr>)}</tbody>
      </table></div>
    </div>
  );
}

function CsvTool() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string>();
  const report: CsvPredictReport | null = useMemo(() => (text.trim() ? predictFromTestCsv(text) : null), [text]);
  const onFile = async (f?: File | null) => {
    if (!f) return; setFileName(f.name); setText(await f.text());
  };
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-black text-xl flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-cyan-700" /> test.csv → predictions.csv (Model B, leakage-safe)</h3>
      <p className="text-sm text-slate-500 mt-1">
        Upload official-style <code>test.csv</code> (must include <code>station_id, date, precipitation_sum, temperature_2m_max, temperature_2m_min, soil_moisture_0_to_7cm</code>).
        The browser runs the exported Model-B ridge (weather+catchment only — never test discharge) and validates the output against every Brief §5 rejection rule.
        <strong> For the real submission, use the full Python ensemble:</strong> <code>python floodcast/ml/solution.py</code>.
      </p>
      <div className="flex flex-wrap gap-3 mt-5">
        <label className={btnPrimary + " cursor-pointer"}><FileUp className="w-4 h-4" /> Upload test.csv
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
        <button className={btnGhost} onClick={() => { setText(SAMPLE_TEST_CSV); setFileName("sample_test.csv"); }}>Try sample file</button>
        {report?.ok && <button className={btnPrimary} onClick={() => downloadText("predictions.csv", report.csvText)}><Download className="w-4 h-4" /> Download predictions.csv ({report.predictions.length} rows)</button>}
        {fileName && <span className="text-sm text-slate-500 self-center">{fileName}</span>}
      </div>
      <textarea className={inputCls + " mt-4 font-mono text-xs"} rows={7} placeholder="…or paste CSV here"
        value={text} onChange={(e) => { setText(e.target.value); setFileName("pasted.csv"); }} />
      {report && (
        <div className="mt-4 space-y-3">
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${report.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
            {report.ok ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {report.ok ? `VALID — ${report.predictions.length} predictions, exact columns/order, full test coverage, non-negative, UTF-8.` : "INVALID — fix the issues below."}
          </div>
          {report.errors.map((e, i) => <div key={i} className="text-sm text-red-700">✗ {e}</div>)}
          {report.warnings.map((w, i) => <div key={i} className="text-sm text-amber-700">⚠ {w}</div>)}
          {report.predictions.length > 0 && (
            <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
              <table className="w-full text-sm min-w-[440px]">
                <thead className="sticky top-0 bg-slate-50"><tr className="text-left text-xs text-slate-400"><th className="py-2 px-3">station_id</th><th>date</th><th>discharge_cfs</th></tr></thead>
                <tbody>{report.predictions.slice(0, 100).map((p, i) => (
                  <tr key={i} className="border-t border-slate-100"><td className="px-3 py-1.5 font-mono text-xs">{p.station_id}</td><td>{p.date}</td><td className="font-bold">{p.discharge_cfs.toFixed(2)}</td></tr>))}</tbody>
              </table>{report.predictions.length > 100 && <p className="text-xs text-slate-400 p-2">Showing first 100 of {report.predictions.length}.</p>}
            </div>)}
        </div>)}
    </div>
  );
}

export default function PredictPage() {
  return (
    <div>
      <Section title="Predict discharge" sub="Two genuine inference tools, both driven by coefficients trained in floodcast/ml/solution.py — regression on discharge_cfs, never just SAFE/FLOOD."
        action={<span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500"><CloudRain className="w-4 h-4" /> Target: discharge_cfs (cfs, non-negative)</span>}>
        <div className="space-y-6"><Scenario /><CsvTool /></div>
      </Section>
      <Disclaimer />
    </div>
  );
}
