"use client";
import Link from "next/link";
import { Activity, BrainCircuit, CloudRainWind, Database, Mountain, Siren, Waves, ArrowRight } from "lucide-react";
import { STATIONS, DATA_MODE } from "@/lib/floodcast/stations";
import { MODEL_INFO } from "@/lib/floodcast/model";
import StationCard from "@/components/floodcast/StationCard";
import { Section, Stat, Disclaimer, btnPrimary, btnDanger } from "@/components/floodcast/ui";

type S = { rmse: number; extreme_rmse: number; mae: number; r2: number; nse: number; kge: number };
const summary = MODEL_INFO.summary as { time_split: S; loso: S };

export default function FloodcastHome() {
  return (
    <div>
      <header className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(60%_80%_at_70%_10%,#0891b2_0%,transparent_60%),radial-gradient(50%_60%_at_10%_90%,#1d4ed8_0%,transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
            <Activity className="w-3.5 h-3.5" /> REAL-TIME ML · USGS 00060 + OPEN-METEO + STREAMSTATS
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-5 max-w-3xl">
            Predict the surge <span className="text-cyan-400">before it strikes.</span>
          </h1>
          <p className="text-slate-300 text-lg mt-4 max-w-2xl">
            FLOODCAST predicts daily river discharge (<strong>discharge_cfs</strong>) with a trained ML ensemble,
            monitors 5 US river gauges in real time, warns communities early — and connects people in danger to rescue teams by SOS.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/floodcast/predict" className={btnPrimary}><BrainCircuit className="w-4 h-4" /> Run a prediction</Link>
            <Link href="/floodcast/map" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-bold hover:bg-white/10">View risk map <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/floodcast/sos" className={btnDanger}><Siren className="w-4 h-4" /> I need help — SOS</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 max-w-3xl">
            {[
              ["Validation R² / NSE", `${summary.time_split.r2.toFixed(2)} / ${summary.time_split.nse.toFixed(2)}`],
              ["Extreme-event RMSE*", `${Math.round(summary.time_split.extreme_rmse).toLocaleString()} cfs`],
              ["Unseen-station (LOSO) R²", summary.loso.r2.toFixed(2)],
              ["Forecast horizon", "7 days · daily"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <div className="text-[10px] font-bold tracking-widest text-slate-400">{k}</div>
                <div className="font-black text-lg mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">*Top-10% flow days per station (30% of official score). Metrics from the Python training run — data mode: <code>{DATA_MODE}</code> (see Model page; refresh with official CSVs at Hour 0).</p>
        </div>
      </header>

      <Section title="Live river network" sub="Observed USGS discharge + Open-Meteo weather, joined live in your browser. The red number is the ML-predicted peak over the next 7 days — click any station for its full hydrograph.">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {STATIONS.map((s) => <StationCard key={s.station_id} station={s} />)}
          <Link href="/floodcast/rescue" className="rounded-3xl border-2 border-dashed border-red-300 bg-red-50 p-5 grid place-items-center text-center hover:bg-red-100 transition min-h-[220px]">
            <div>
              <Siren className="w-8 h-8 text-red-600 mx-auto" />
              <div className="font-black text-red-900 mt-2">Rescue Coordination</div>
              <p className="text-sm text-red-800/80 mt-1 max-w-[260px]">Live SOS triage board — every request auto-tagged with its nearest gauge&apos;s predicted risk.</p>
              <span className="text-sm font-bold text-red-700">Open rescue dashboard →</span>
            </div>
          </Link>
        </div>
      </Section>

      <Section title="How FLOODCAST works" sub="Three official public data sources → one leakage-safe regression → warnings → response.">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Waves, t: "1 · USGS river gauges", d: "Daily discharge (parameter 00060, cfs) with quality flags — the prediction target. Stations 01646500 · 07010000 · 08158000 · 02087500 · 11447650.", href: "https://waterdata.usgs.gov/nwis/dv" },
            { icon: CloudRainWind, t: "2 · Open-Meteo weather", d: "precipitation_sum, temperature_2m_max/min and soil_moisture_0_to_7cm matched to each gauge by latitude, longitude and date (archive + forecast APIs).", href: "https://open-meteo.com/en/docs/historical-weather-api" },
            { icon: Mountain, t: "3 · StreamStats catchment", d: "DRNAREA, ELEV, FOREST, SLOPE_PCT and impervious % joined on station_id — the physical fingerprint that lets one model transfer to ungauged basins.", href: "https://streamstats.usgs.gov/ss/" },
          ].map((c) => (
            <a key={c.t} href={c.href} target="_blank" rel="noreferrer" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition block">
              <c.icon className="w-7 h-7 text-cyan-700" />
              <h3 className="font-black text-slate-950 mt-3">{c.t}</h3>
              <p className="text-sm text-slate-500 mt-1.5">{c.d}</p>
              <span className="text-xs font-bold text-cyan-700">Official source ↗</span>
            </a>
          ))}
        </div>
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <Stat label="MODEL" value="Ridge+RF+HGB ensemble" hint="Log specific-discharge target; 4× weight on extreme days" />
          <Stat label="OFFICIAL OUTPUT" value="predictions.csv" hint="station_id, date, discharge_cfs — auto-validated" />
          <Stat label="SCORING" value="40·30·20·10" hint="RMSE · Extreme-RMSE · MAE · R² (+ NSE/KGE tracked)" />
          <Stat label="RESPONSE LOOP" value="Forecast → SOS" hint="Risk auto-attaches to every SOS for triage" />
        </div>
        <div className="rounded-3xl bg-slate-950 text-white p-6 md:p-8 mt-6 flex flex-col md:flex-row items-start md:items-center gap-5">
          <Database className="w-9 h-9 text-cyan-400 shrink-0" />
          <div className="flex-1">
            <h3 className="font-black text-xl">Have the official test.csv?</h3>
            <p className="text-slate-300 text-sm mt-1">Drop it into the Predict page for an instant validated <code>predictions.csv</code> rehearsal — or run the full Python ensemble (<code>python floodcast/ml/solution.py</code>) for the real submission.</p>
          </div>
          <Link href="/floodcast/predict" className={btnPrimary}>Open predictor <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </Section>
      <Disclaimer />
    </div>
  );
}
