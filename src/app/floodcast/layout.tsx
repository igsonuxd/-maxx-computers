import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Waves, LayoutDashboard, Map, BrainCircuit, Siren, LifeBuoy, BellRing, FileCheck2, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "FLOODCAST — Predict the Surge Before It Strikes",
  description: "AI-powered real-time river discharge prediction, flood early warning and emergency SOS rescue coordination (USGS + Open-Meteo + StreamStats).",
};

const NAV = [
  { href: "/floodcast", label: "Dashboard", icon: LayoutDashboard },
  { href: "/floodcast/map", label: "Risk Map", icon: Map },
  { href: "/floodcast/predict", label: "Predict", icon: BrainCircuit },
  { href: "/floodcast/alerts", label: "Alerts", icon: BellRing },
  { href: "/floodcast/sos", label: "SOS", icon: Siren },
  { href: "/floodcast/rescue", label: "Rescue", icon: LifeBuoy },
  { href: "/floodcast/model", label: "Model", icon: BarChart3 },
  { href: "/floodcast/submission", label: "Submission", icon: FileCheck2 },
];

export default function FloodcastLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-slate-50 min-h-screen -mt-0">
      <div className="bg-slate-950 text-white sticky top-20 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3 overflow-x-auto">
            <Link href="/floodcast" className="flex items-center gap-2 shrink-0">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-cyan-500"><Waves className="w-5 h-5 text-white" /></span>
              <span className="leading-none">
                <span className="block font-black tracking-tight text-lg">FLOODCAST</span>
                <span className="block text-[10px] text-cyan-300 font-semibold tracking-wide">PREDICT THE SURGE BEFORE IT STRIKES</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 ml-4" aria-label="FLOODCAST">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold whitespace-nowrap transition hover:bg-white/10 ${n.label === "SOS" ? "bg-red-600 hover:bg-red-500 text-white" : "text-slate-200"}`}>
                  <n.icon className="w-4 h-4" />{n.label}
                </Link>
              ))}
            </nav>
            <a href="tel:112" className="ml-auto shrink-0 hidden md:flex items-center gap-2 rounded-lg border border-red-400/50 px-3 py-2 text-[13px] font-bold text-red-300 hover:bg-red-500/10">
              Emergency? Call 112 / 911
            </a>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
