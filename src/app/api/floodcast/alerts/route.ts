import { NextResponse } from "next/server";
import { z } from "zod";
import { createSub, listSubs } from "@/lib/floodcast/store";
import { stationById } from "@/lib/floodcast/stations";

export const dynamic = "force-dynamic";

const SubIn = z.object({
  name: z.string().min(2).max(120),
  contact: z.string().min(5).max(160),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"]).default("SMS"),
  stationId: z.string().min(8).max(16),
  thresholdLevel: z.enum(["WATCH", "WARNING", "FLOOD", "EMERGENCY"]).default("WARNING"),
});

export async function POST(req: Request) {
  try {
    const parsed = SubIn.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid subscription", details: parsed.error.flatten() }, { status: 400 });
    if (!stationById(parsed.data.stationId)) return NextResponse.json({ error: "Unknown stationId" }, { status: 400 });
    const { record, backend } = await createSub({ ...parsed.data, stationId: parsed.data.stationId.padStart(8, "0") });
    return NextResponse.json({ success: true, backend, subscription: record,
      note: "Stored. Actual SMS/WhatsApp dispatch requires a provider (e.g. Twilio) configured server-side — see floodcast/README." }, { status: 201 });
  } catch (e) {
    console.error("subscribe failed", e);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function GET() {
  const { records, backend } = await listSubs();
  return NextResponse.json({ backend, count: records.length, subscriptions: records });
}
