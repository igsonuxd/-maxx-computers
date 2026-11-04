"use client";
import { useEffect, useMemo, useState } from "react";
import { getStationSeries, type StationSeries } from "@/lib/floodcast/live";
import { forecast, backtest, type ForecastDay } from "@/lib/floodcast/model";
import { riskFor, thresholdsFor, type RiskLevel, type Station } from "@/lib/floodcast/stations";

export interface StationLive {
  loading: boolean; series?: StationSeries; fc: ForecastDay[];
  bt: { date: string; observed: number; predicted: number }[];
  current?: number; currentDate?: string; peak?: ForecastDay;
  riskNow: RiskLevel; riskPeak: RiskLevel; trendPct?: number;
}

export function useStationLive(st: Station, rainBoostMm = 0, rainMultiplier = 1): StationLive {
  const [series, setSeries] = useState<StationSeries>();
  useEffect(() => {
    let on = true;
    getStationSeries(st).then((s) => { if (on) setSeries(s); });
    return () => { on = false; };
  }, [st]);
  return useMemo(() => {
    if (!series) return { loading: true, fc: [], bt: [], riskNow: "NORMAL" as RiskLevel, riskPeak: "NORMAL" as RiskLevel };
    const future = series.futureWeather.map((r) => ({
      ...r, precipitation_sum: Math.max(0, r.precipitation_sum * rainMultiplier + rainBoostMm),
    }));
    const fc = forecast(st, series.history, future);
    const bt = backtest(st, series.history, Math.max(30, series.history.length - 60));
    const last = series.history[series.history.length - 1];
    const current = last?.discharge_cfs ?? undefined;
    const peak = fc.reduce<ForecastDay | undefined>((m, d) => (!m || d.discharge_cfs > m.discharge_cfs ? d : m), undefined);
    const t = thresholdsFor(st.station_id);
    const wk = series.history[series.history.length - 8]?.discharge_cfs ?? undefined;
    return {
      loading: false, series, fc, bt, current, currentDate: last?.date, peak,
      riskNow: riskFor(current ?? 0, t), riskPeak: riskFor(peak?.discharge_cfs ?? 0, t),
      trendPct: current && wk ? ((current - wk) / wk) * 100 : undefined,
    };
  }, [series, st, rainBoostMm, rainMultiplier]);
}
