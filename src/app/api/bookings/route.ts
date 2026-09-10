import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceBookings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    await db.insert(serviceBookings).values({
      ...body,
      status: "Pending"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
