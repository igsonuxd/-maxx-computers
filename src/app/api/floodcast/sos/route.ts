import { NextResponse } from "next/server";
import { z } from "zod";
import { createSos, listSos, getSos, newPublicId, triagePriority } from "@/lib/floodcast/store";
import { nearestStation } from "@/lib/floodcast/stations";

export const dynamic = "force-dynamic";

const SosIn = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  peopleCount: z.coerce.number().int().min(1).max(500).default(1),
  address: z.string().max(500).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lon: z.coerce.number().min(-180).max(180).optional().nullable(),
  waterLevel: z.enum(["NONE", "ANKLE", "KNEE", "WAIST", "CHEST", "ROOF", "TRAPPED"]).default("ANKLE"),
  needs: z.array(z.string().max(40)).max(10).default([]),
  medical: z.coerce.boolean().default(false),
  message: z.string().max(1000).optional().nullable(),
  riskLevel: z.enum(["NORMAL", "WATCH", "WARNING", "FLOOD", "EMERGENCY"]).default("NORMAL"),
  predictedCfs: z.coerce.number().min(0).optional().nullable(),
  stationId: z.string().max(16).optional().nullable(),
});

/** POST /api/floodcast/sos — create SOS (Prediction ⇄ SOS link: nearest
 *  station + live risk are attached and drive triage priority). */
export async function POST(req: Request) {
  try {
    const parsed = SosIn.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid SOS", details: parsed.error.flatten() }, { status: 400 });
    const b = parsed.data;
    let stationId = b.stationId ?? null, stationName: string | null = null, distanceKm: number | null = null;
    if (b.lat != null && b.lon != null) {
      const near = nearestStation(b.lat, b.lon);
      stationId = near.station.station_id; stationName = near.station.name;
      distanceKm = Math.round(near.distanceKm * 10) / 10;
    }
    const pr = triagePriority({ waterLevel: b.waterLevel, peopleCount: b.peopleCount, medical: b.medical, riskLevel: b.riskLevel });
    const { record, backend } = await createSos({
      publicId: newPublicId(), name: b.name, phone: b.phone, peopleCount: b.peopleCount,
      address: b.address ?? null, lat: b.lat ?? null, lon: b.lon ?? null,
      waterLevel: b.waterLevel, needs: b.needs, medical: b.medical, message: b.message ?? null,
      stationId, stationName, distanceKm, riskLevel: b.riskLevel,
      predictedCfs: b.predictedCfs ?? null, priorityScore: pr.score, priorityLabel: pr.label,
      status: "NEW", rescuerNote: null,
    });
    return NextResponse.json({ success: true, backend, sos: record }, { status: 201 });
  } catch (e) {
    console.error("SOS create failed", e);
    return NextResponse.json({ error: "Failed to submit SOS. If this is a real emergency, call your local emergency number (112 / 911) immediately." }, { status: 500 });
  }
}

/** GET /api/floodcast/sos[?id=FC-...] — rescue list, or track one request. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const { record, backend } = await getSos(id.trim().toUpperCase());
    if (!record) return NextResponse.json({ error: "SOS ID not found", backend }, { status: 404 });
    return NextResponse.json({ backend, sos: record });
  }
  const { records, backend } = await listSos();
  return NextResponse.json({ backend, count: records.length, sos: records });
}
