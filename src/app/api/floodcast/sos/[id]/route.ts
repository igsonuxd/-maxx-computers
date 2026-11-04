import { NextResponse } from "next/server";
import { z } from "zod";
import { updateSos } from "@/lib/floodcast/store";

export const dynamic = "force-dynamic";

const Patch = z.object({
  status: z.enum(["NEW", "ACKNOWLEDGED", "DISPATCHED", "RESCUED", "CLOSED"]).optional(),
  rescuerNote: z.string().max(1000).optional(),
});

/** PATCH /api/floodcast/sos/:id — rescue workflow NEW→ACK→DISPATCHED→RESCUED/CLOSED.
 *  Demo build: unauthenticated (hackathon). Put behind responder auth in production. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const parsed = Patch.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    const { record, backend } = await updateSos(id.trim().toUpperCase(), parsed.data);
    if (!record) return NextResponse.json({ error: "SOS not found", backend }, { status: 404 });
    return NextResponse.json({ success: true, backend, sos: record });
  } catch (e) {
    console.error("SOS update failed", e);
    return NextResponse.json({ error: "Failed to update SOS" }, { status: 500 });
  }
}
