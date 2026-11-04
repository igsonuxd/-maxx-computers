"use client";
import { useEffect, useMemo, useState } from "react";
import { STATIONS, type RiskLevel, type Station } from "@/lib/floodcast/stations";
import { useStationLive } from "@/components/floodcast/hooks";
import MapSVG, { type SosPin } from "@/components/floodcast/MapSVG";
import StationCard from "@/components/floodcast/StationCard";
import { Section, Disclaimer } from "@/components/floodcast/ui";
import type { SosRecord } from "@/lib/floodcast/store";

function RiskCollector({ station, onRisk }: { station: Station; onRisk: (id: string, r: RiskLevel) => void }) {
  const live = useStationLive(station);
  useEffect(() => { if (!live.loading) onRisk(station.station_id, live.riskPeak); }, [live.loading, live.riskPeak, station.station_id, onRisk]);
  return null;
}

export default function MapPage() {
  const [riskById, setRiskById] = useState<Record<string, RiskLevel>>({});
  const [pins, setPins] = useState<SosPin[]>([]);
  const onRisk = useMemo(() => (id: string, r: RiskLevel) =>
    setRiskById((m) => (m[id] === r ? m : { ...m, [id]: r })), []);
  useEffect(() => {
    fetch("/api/floodcast/sos").then((r) => r.json()).then((j) => {
      const list: SosRecord[] = j.sos ?? [];
      setPins(list.filter((s) => s.lat != null && s.lon != null && s.status !== "CLOSED")
        .map((s) => ({ id: s.publicId, lat: s.lat!, lon: s.lon!, label: `${s.publicId} · ${s.priorityLabel}` })));
    }).catch(() => setPins([]));
  }, []);
  return (
    <div>
      <Section title="National flood-risk map" sub="Colour = highest ML-predicted risk in the next 7 days at each gauge. Red triangles = active SOS locations awaiting/under rescue.">
        {STATIONS.map((s) => <RiskCollector key={s.station_id} station={s} onRisk={onRisk} />)}
        <MapSVG stations={STATIONS} riskById={riskById} sosPins={pins} />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {STATIONS.map((s) => <StationCard key={s.station_id} station={s} />)}
        </div>
      </Section>
      <Disclaimer />
    </div>
  );
}
