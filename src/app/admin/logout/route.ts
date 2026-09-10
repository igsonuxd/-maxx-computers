import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Logout: clears the adminAuth cookie and redirects to the admin login page.
 *
 * NOTE: this route previously also ran an embedded product seeder that wrote a
 * SECOND, conflicting set of product images into the database on every admin
 * logout — it could revert catalog products to old photos and is no longer the
 * place for seed logic. All seeding now lives in exactly one place:
 * GET /api/seed (src/lib/seed.ts). Do not add product writes back here.
 */
export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin", request.url));
  res.cookies.set("adminAuth", "", { path: "/", maxAge: 0 });
  return res;
}
