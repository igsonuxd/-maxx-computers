import { db } from "@/db";
import { fcSosRequests, fcAlertSubscriptions, fcScenarioLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/** Persistence with graceful degradation: Postgres when DATABASE_URL works,
 *  in-memory otherwise (hackathon demo never hard-fails). The response always
 *  reports which backend served it. NOTE: memory mode is per-process and
 *  resets on redeploy — configure DATABASE_URL + `npm run db:push` for real use. */

export interface SosRecord {
  id: number; publicId: string; name: string; phone: string; peopleCount: number;
  address: string | null; lat: number | null; lon: number | null; waterLevel: string;
  needs: string[]; medical: boolean; message: string | null;
  stationId: string | null; stationName: string | null; distanceKm: number | null;
  riskLevel: string; predictedCfs: number | null; priorityScore: number;
  priorityLabel: string; status: string; rescuerNote: string | null;
  createdAt: string; updatedAt: string;
}
export interface SubRecord {
  id: number; name: string; contact: string; channel: string; stationId: string;
  thresholdLevel: string; active: boolean; createdAt: string;
}

type Mem = { sos: SosRecord[]; subs: SubRecord[]; seq: number };
const g = globalThis as typeof globalThis & { __fcMem?: Mem };
const mem: Mem = (g.__fcMem ??= { sos: [], subs: [], seq: 1 });

export function triagePriority(r: {
  waterLevel: string; peopleCount: number; medical: boolean; riskLevel: string;
}): { score: number; label: string } {
  const water: Record<string, number> = { NONE: 0, ANKLE: 10, KNEE: 25, WAIST: 40, CHEST: 55, ROOF: 70, TRAPPED: 80 };
  const risk: Record<string, number> = { NORMAL: 0, WATCH: 5, WARNING: 10, FLOOD: 15, EMERGENCY: 20 };
  let s = (water[r.waterLevel] ?? 10) + (risk[r.riskLevel] ?? 0)
    + Math.min(15, Math.max(0, r.peopleCount - 1) * 3) + (r.medical ? 20 : 0);
  s = Math.min(100, s);
  return { score: s, label: s >= 70 ? "CRITICAL" : s >= 45 ? "HIGH" : s >= 25 ? "MEDIUM" : "LOW" };
}

export function newPublicId() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `FC-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const num = (v: unknown) => (v == null ? null : Number(v));
function sosFromDb(r: typeof fcSosRequests.$inferSelect): SosRecord {
  return { ...r, lat: num(r.lat), lon: num(r.lon), distanceKm: num(r.distanceKm),
    predictedCfs: num(r.predictedCfs), needs: (r.needs as string[]) ?? [],
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}

export async function createSos(input: Omit<SosRecord, "id" | "createdAt" | "updatedAt">) {
  try {
    const [row] = await db.insert(fcSosRequests).values({
      ...input, lat: input.lat?.toString() ?? null, lon: input.lon?.toString() ?? null,
      distanceKm: input.distanceKm?.toString() ?? null,
      predictedCfs: input.predictedCfs?.toString() ?? null,
    }).returning();
    return { record: sosFromDb(row), backend: "postgres" as const };
  } catch {
    const now = new Date().toISOString();
    const rec: SosRecord = { ...input, id: mem.seq++, createdAt: now, updatedAt: now };
    mem.sos.unshift(rec);
    return { record: rec, backend: "memory" as const };
  }
}

export async function listSos() {
  try {
    const rows = await db.select().from(fcSosRequests).orderBy(desc(fcSosRequests.createdAt)).limit(200);
    return { records: rows.map(sosFromDb), backend: "postgres" as const };
  } catch {
    return { records: [...mem.sos], backend: "memory" as const };
  }
}

export async function getSos(publicId: string) {
  try {
    const [row] = await db.select().from(fcSosRequests).where(eq(fcSosRequests.publicId, publicId)).limit(1);
    return { record: row ? sosFromDb(row) : null, backend: "postgres" as const };
  } catch {
    return { record: mem.sos.find((s) => s.publicId === publicId) ?? null, backend: "memory" as const };
  }
}

export async function updateSos(publicId: string, patch: { status?: string; rescuerNote?: string }) {
  try {
    const [row] = await db.update(fcSosRequests)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(fcSosRequests.publicId, publicId)).returning();
    return { record: row ? sosFromDb(row) : null, backend: "postgres" as const };
  } catch {
    const rec = mem.sos.find((s) => s.publicId === publicId);
    if (rec) { Object.assign(rec, patch); rec.updatedAt = new Date().toISOString(); }
    return { record: rec ?? null, backend: "memory" as const };
  }
}

export async function createSub(input: Omit<SubRecord, "id" | "createdAt" | "active">) {
  try {
    const [row] = await db.insert(fcAlertSubscriptions).values(input).returning();
    return { record: { ...row, createdAt: row.createdAt.toISOString() }, backend: "postgres" as const };
  } catch {
    const rec: SubRecord = { ...input, id: mem.seq++, active: true, createdAt: new Date().toISOString() };
    mem.subs.unshift(rec);
    return { record: rec, backend: "memory" as const };
  }
}

export async function listSubs() {
  try {
    const rows = await db.select().from(fcAlertSubscriptions).orderBy(desc(fcAlertSubscriptions.createdAt)).limit(200);
    return { records: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), backend: "postgres" as const };
  } catch {
    return { records: [...mem.subs], backend: "memory" as const };
  }
}

export async function logScenario(stationId: string, kind: string, inputs: unknown, peakCfs: number, riskLevel: string) {
  try {
    await db.insert(fcScenarioLogs).values({ stationId, kind, inputs: inputs as object, peakCfs: peakCfs.toString(), riskLevel });
    return "postgres" as const;
  } catch { return "memory" as const; }
}
