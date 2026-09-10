import { NextResponse } from "next/server";
import { db } from "@/db";
import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await runSeed(db);
    return NextResponse.json({
      message: "Seed complete (idempotent)",
      stats,
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Failed to seed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
