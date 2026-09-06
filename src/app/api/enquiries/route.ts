import { NextResponse } from "next/server";
import { db } from "@/db";
import { enquiries } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    await db.insert(enquiries).values({
      ...body,
      status: "Pending"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Enquiry error:", error);
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
  }
}
