import { asc, eq, sql } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { products, reviews, users } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Self-hosted product photos served from /public/products.            */
/* Each model uses real retailer/manufacturer shots of that model.     */
/* ------------------------------------------------------------------ */

export const IMG = {
  /* Local, self-hosted product photos (public/products) — no remote/placeholder URLs */
  laptop: "/products/dell-latitude-3490-1.jpg",
  laptop2: "/products/lenovo-thinkpad-l480-1.jpg",
  desktop: "/products/dell-optiplex-9020-1.jpg",
  accessory: "/products/kb-mouse-1.jpg",
};

export type CatalogItem = {
  name: string;
  brand: string;
  model: string;
  category: "laptop" | "desktop" | "accessory";
  processor: string;
  ram: string;
  storage: string;
  display: string;
  condition: string;
  batteryCondition: string;
  warranty: string;
  price: string;
  stockQuantity: number;
  images: string[];
  description: string;
};

export const CATALOG: CatalogItem[] = [
  /* ---------------- Laptops (13) — first image distinct per model ---------------- */
  {
    name: "Dell Latitude 3490", brand: "DELL", model: "Latitude 3490", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD",
    condition: "Excellent", batteryCondition: "Good (2-3 hrs)", warranty: "3 Months", price: "18500", stockQuantity: 5,
    images: ["/products/dell-latitude-3490-1.jpg", "/products/dell-latitude-3490-2.jpg", "/products/dell-latitude-3490-3.jpg"],
    description: "Premium refurbished Dell Latitude 3490. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 3400", brand: "DELL", model: "Latitude 3400", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD",
    condition: "Excellent", batteryCondition: "Good (2-3 hrs)", warranty: "3 Months", price: "19500", stockQuantity: 3,
    images: ["/products/dell-latitude-3400-1.webp", "/products/dell-latitude-3400-2.jpg", "/products/dell-latitude-3400-3.webp"],
    description: "Premium refurbished Dell Latitude 3400. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 3410", brand: "DELL", model: "Latitude 3410", category: "laptop",
    processor: "Intel Core i5 10th Gen", ram: "8GB", storage: "512GB SSD", display: "14 inch FHD",
    condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "24000", stockQuantity: 4,
    images: ["/products/dell-latitude-3410-1.jpg", "/products/dell-latitude-3410-2.jpg", "/products/dell-latitude-3410-3.jpg"],
    description: "Premium refurbished Dell Latitude 3410. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 3420", brand: "DELL", model: "Latitude 3420", category: "laptop",
    processor: "Intel Core i5 11th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD",
    condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "28000", stockQuantity: 2,
    images: ["/products/dell-latitude-3420-1.jpg", "/products/dell-latitude-3420-2.jpg", "/products/dell-latitude-3420-3.webp"],
    description: "Premium refurbished Dell Latitude 3420. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5480", brand: "DELL", model: "Latitude 5480", category: "laptop",
    processor: "Intel Core i5 7th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Good", batteryCondition: "Good", warranty: "3 Months", price: "16000", stockQuantity: 6,
    images: ["/products/dell-latitude-5480-1.jpg", "/products/dell-latitude-5480-2.jpg", "/products/dell-latitude-5480-3.webp"],
    description: "Premium refurbished Dell Latitude 5480. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5490", brand: "DELL", model: "Latitude 5490", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19000", stockQuantity: 5,
    images: ["/products/dell-latitude-5490-1.jpg", "/products/dell-latitude-5490-2.webp", "/products/dell-latitude-5490-3.png"],
    description: "Premium refurbished Dell Latitude 5490. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5400", brand: "DELL", model: "Latitude 5400", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19500", stockQuantity: 4,
    images: ["/products/dell-latitude-5400-1.jpg", "/products/dell-latitude-5400-2.jpg", "/products/dell-latitude-5400-3.webp"],
    description: "Premium refurbished Dell Latitude 5400. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5410", brand: "DELL", model: "Latitude 5410", category: "laptop",
    processor: "Intel Core i5 10th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD",
    condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "24500", stockQuantity: 3,
    images: ["/products/dell-latitude-5410-1.jpg", "/products/dell-latitude-5410-2.webp", "/products/dell-latitude-5410-3.jpg"],
    description: "Premium refurbished Dell Latitude 5410. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5420", brand: "DELL", model: "Latitude 5420", category: "laptop",
    processor: "Intel Core i5 11th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD",
    condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "28500", stockQuantity: 2,
    images: ["/products/dell-latitude-5420-1.jpg", "/products/dell-latitude-5420-2.jpg", "/products/dell-latitude-5420-3.jpg"],
    description: "Premium refurbished Dell Latitude 5420. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Lenovo ThinkPad L480", brand: "LENOVO", model: "ThinkPad L480", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "18500", stockQuantity: 5,
    images: ["/products/lenovo-thinkpad-l480-1.jpg", "/products/lenovo-thinkpad-l480-2.jpg", "/products/lenovo-thinkpad-l480-3.jpg"],
    description: "Premium refurbished Lenovo ThinkPad L480. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Lenovo ThinkPad L490", brand: "LENOVO", model: "ThinkPad L490", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19500", stockQuantity: 4,
    images: ["/products/lenovo-thinkpad-l490-1.jpg", "/products/lenovo-thinkpad-l490-2.png", "/products/lenovo-thinkpad-l490-3.jpg"],
    description: "Premium refurbished Lenovo ThinkPad L490. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Lenovo ThinkPad L440", brand: "LENOVO", model: "ThinkPad L440", category: "laptop",
    processor: "Intel Core i5 4th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD",
    condition: "Good", batteryCondition: "Average", warranty: "1 Month", price: "12000", stockQuantity: 3,
    images: ["/products/lenovo-thinkpad-l440-1.jpg", "/products/lenovo-thinkpad-l440-2.webp", "/products/lenovo-thinkpad-l440-3.jpg"],
    description: "Premium refurbished Lenovo ThinkPad L440. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Lenovo ThinkPad L450", brand: "LENOVO", model: "ThinkPad L450", category: "laptop",
    processor: "Intel Core i5 5th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD",
    condition: "Good", batteryCondition: "Average", warranty: "1 Month", price: "13500", stockQuantity: 2,
    images: ["/products/lenovo-thinkpad-l450-1.jpg", "/products/lenovo-thinkpad-l450-2.jpg", "/products/lenovo-thinkpad-l450-3.jpg"],
    description: "Premium refurbished Lenovo ThinkPad L450. Professionally checked and ready for business or personal use.",
  },

  /* ---------------- Desktops (5) — wholesale pricing ---------------- */
  {
    name: "Lenovo V530-15ICH Desktop", brand: "LENOVO", model: "V530-15ICH", category: "desktop",
    processor: "Intel Core i3 8th Gen", ram: "8GB DDR4", storage: "256GB SSD + 500GB HDD", display: "19 inch Monitor + Keyboard Mouse",
    condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "19000", stockQuantity: 3,
    images: ["/products/lenovo-v530-1.jpg", "/products/lenovo-v530-2.jpg", "/products/lenovo-v530-3.jpg"],
    description: 'Lenovo V530 Tower with 19" Monitor Set. Fully tested, business-ready desktop.',
  },
  {
    name: "Dell Optiplex 9020 Desktop", brand: "DELL", model: "Optiplex 9020", category: "desktop",
    processor: "Intel Core i3 3rd Gen", ram: "8GB", storage: "500GB HDD", display: "With Monitor + Keyboard/Mouse",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "7500", stockQuantity: 6,
    images: ["/products/dell-optiplex-9020-1.jpg", "/products/dell-optiplex-9020-2.jpg", "/products/dell-optiplex-9020-3.jpg"],
    description: "Refurbished Dell Optiplex 9020 business desktop. Tested and ready for office use.",
  },
  {
    name: "HP EliteDesk 800 G1 SFF Desktop", brand: "HP", model: "EliteDesk 800 G1 SFF", category: "desktop",
    processor: "Intel Core i5 4th Gen", ram: "4GB", storage: "500GB HDD", display: "With Monitor + Keyboard/Mouse",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "9500", stockQuantity: 6,
    images: ["/products/hp-elitedesk-800-g1-1.webp", "/products/hp-elitedesk-800-g1-2.jpg", "/products/hp-elitedesk-800-g1-3.jpg"],
    description: "Compact HP EliteDesk SFF business desktop. Tested and ready for office use.",
  },
  {
    name: "HP ProDesk 400 G2 MT Desktop", brand: "HP", model: "ProDesk 400 G2 MT", category: "desktop",
    processor: "Intel Core i5 4th Gen", ram: "4GB", storage: "500GB HDD", display: "With Monitor + Keyboard/Mouse",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "9500", stockQuantity: 3,
    images: ["/products/hp-prodesk-400-g2-3.png", "/products/hp-prodesk-400-g2-2.webp"],
    description: "Refurbished HP ProDesk 400 G2 mini tower desktop. Tested and ready for office use.",
  },
  {
    name: "HP Desktop Pro A G2 Ryzen 5", brand: "HP", model: "Desktop Pro A G2", category: "desktop",
    processor: "AMD Ryzen 5", ram: "8GB DDR4", storage: "256GB SSD + 500GB HDD", display: "19 inch Monitor + Keyboard Mouse",
    condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "19000", stockQuantity: 2,
    images: ["/products/hp-desktop-pro-a-g2-1.jpg", "/products/hp-desktop-pro-a-g2-2.jpg", "/products/hp-desktop-pro-a-g2-3.jpg"],
    description: 'HP Desktop Pro A G2 with Ryzen 5 and 19" Monitor Set. Wholesale price.',
  },

  /* ---------------- Accessories (6) — wholesale pricing ---------------- */
  {
    name: "Keyboard + Mouse Combo (HP/Dell)", brand: "HP", model: "Keyboard + Mouse Combo", category: "accessory",
    processor: "Wired USB", ram: "N/A", storage: "N/A", display: "Standard Layout",
    condition: "New", batteryCondition: "N/A", warranty: "1 Month", price: "800", stockQuantity: 10,
    images: ["/products/kb-mouse-3.jpg", "/products/kb-mouse-1.webp", "/products/kb-mouse-2.webp"],
    description: "Genuine wired keyboard + mouse combo. Wholesale price.",
  },
  {
    name: '19" LED Monitor (HP/Dell/Lenovo)', brand: "HP", model: '19" LED Monitor', category: "accessory",
    processor: "60Hz", ram: "N/A", storage: "N/A", display: "19 inch LED",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "5500", stockQuantity: 5,
    images: ["/products/monitor-19-1.png", "/products/monitor-19-3.png"],
    description: 'Refurbished 19" LED monitor from HP/Dell/Lenovo. Tested. Wholesale price.',
  },
  {
    name: "8GB DDR4 RAM (Desktop/Laptop)", brand: "HYNIX", model: "8GB DDR4", category: "accessory",
    processor: "2400MHz", ram: "8GB DDR4", storage: "N/A", display: "N/A",
    condition: "New", batteryCondition: "N/A", warranty: "1 Month", price: "1800", stockQuantity: 10,
    images: ["/products/ram-8gb-2.jpg", "/products/ram-8gb-1.jpg", "/products/ram-8gb-3.jpg"],
    description: "Genuine 8GB DDR4 desktop/laptop RAM. Wholesale price.",
  },
  {
    name: "256GB SSD SATA", brand: "SAMSUNG", model: "256GB SSD SATA", category: "accessory",
    processor: "SATA III", ram: "N/A", storage: "256GB SSD", display: "N/A",
    condition: "New", batteryCondition: "N/A", warranty: "1 Month", price: "2200", stockQuantity: 10,
    images: ["/products/ssd-256-1.jpg", "/products/ssd-256-2.jpg", "/products/ssd-256-3.jpg"],
    description: "Genuine 256GB SATA SSD. Wholesale price.",
  },
  {
    name: "500GB Hard Drive", brand: "SEAGATE", model: "500GB HDD", category: "accessory",
    processor: "7200 RPM", ram: "N/A", storage: "500GB HDD", display: "N/A",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "1200", stockQuantity: 10,
    images: ["/products/hdd-500-3.jpg", "/products/hdd-500-2.jpg"],
    description: "Refurbished 500GB desktop hard drive. Tested. Wholesale price.",
  },
  {
    name: "Laptop Charger (65W Universal)", brand: "DELL", model: "65W Universal Charger", category: "accessory",
    processor: "65W", ram: "N/A", storage: "N/A", display: "N/A",
    condition: "New", batteryCondition: "N/A", warranty: "1 Month", price: "900", stockQuantity: 10,
    images: ["/products/charger-65w-1.jpg", "/products/charger-65w-2.jpg", "/products/charger-65w-3.jpg"],
    description: "Genuine 65W universal laptop charger. Wholesale price.",
  },
];

const FALLBACK_IMAGES: Record<string, string[]> = {
  laptop: [IMG.laptop, IMG.laptop2],
  desktop: [IMG.desktop],
  accessory: [IMG.accessory],
};

const PLACEHOLDER_MARKERS = ["/placeholder-laptop.jpg", "placeholder", "placehold.co", "placehold.it"];

function hasPlaceholder(images: unknown): boolean {
  if (!Array.isArray(images) || images.length === 0) return true;
  return images.some(
    (u) =>
      typeof u !== "string" ||
      u.trim().length === 0 ||
      PLACEHOLDER_MARKERS.some((m) => u.toLowerCase().includes(m))
  );
}

function inferCategory(name: string): "laptop" | "desktop" | "accessory" {
  const n = name.toLowerCase();
  // Accessory keywords first (e.g. "8GB DDR4 RAM (Desktop/Laptop)" is an accessory)
  if (/(ram|ddr|ssd|hdd|hard drive|monitor|led|charger|keyboard|mouse|combo|usb)/.test(n)) {
    return "accessory";
  }
  if (/(desktop|tower|sff|mini tower|optiplex|elitedesk|prodesk)/.test(n)) {
    return "desktop";
  }
  return "laptop";
}

/** Normalize a product name for matching: collapse whitespace, trim, lowercase.
    Keeps upserts idempotent even if rows were originally seeded with slightly
    different casing/spacing than the current CATALOG names. */
function normalizeName(name: string): string {
  return (name || "").replace(/\s+/g, " ").trim().toLowerCase();
}

const CATALOG_NAME_KEYS = new Set(CATALOG.map((c) => normalizeName(c.name)));

export async function runSeed(db: any) {
  /* 1. Make the schema self-healing (idempotent DDL).
     Guarantees the `category` column exists even though no SQL migration
     files are checked in, and backfills 'laptop' for existing rows. */
  await db.execute(
    sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS category varchar(50) NOT NULL DEFAULT 'laptop'`
  );

  let inserted = 0;
  let updated = 0;
  let deduped = 0;
  let fixed = 0;

  /* 2. Seed admin user — dedup by email (idempotent). */
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@maxxcomputers.com"))
    .limit(1);
  if (!existingAdmin) {
    const passwordHash = await bcryptjs.hash("admin123", 10);
    await db.insert(users).values({
      email: "admin@maxxcomputers.com",
      passwordHash,
      role: "admin",
    });
  }

  /* 3. Upsert every catalog item by (normalized) name (idempotent).
     - no matching row -> insert
     - matching row(s) -> keep the lowest id canonical, update it with the
       current catalog values (including the current image paths), and remove
       duplicate rows for that same name so re-seeding never accumulates rows.
     Matching is case/whitespace-insensitive so rows created by an older seed
     version still get synced to the current catalog. */
  const allRows = await db.select().from(products).orderBy(asc(products.id));
  const byName = new Map<string, any[]>();
  for (const row of allRows) {
    const key = normalizeName(row.name as string);
    const list = byName.get(key) ?? [];
    list.push(row);
    byName.set(key, list);
  }

  for (const item of CATALOG) {
    const matches = byName.get(normalizeName(item.name)) ?? [];

    if (matches.length === 0) {
      await db.insert(products).values(item);
      inserted += 1;
      continue;
    }

    const [keep, ...dups] = matches;
    await db
      .update(products)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(products.id, keep.id));
    updated += 1;

    for (const dup of dups) {
      await db.delete(products).where(eq(products.id, dup.id));
      deduped += 1;
    }
  }

  /* 4. Fix NON-catalog rows only (rows added outside the seed): replace
     placeholder/missing images and assign a category when missing.
     Catalog rows were already fully synced in step 3 and are left as-is. */
  const freshRows = await db.select().from(products).orderBy(asc(products.id));
  for (const p of freshRows) {
    if (CATALOG_NAME_KEYS.has(normalizeName(p.name as string))) continue;
    const cat = (p.category as string | null) || "";
    const images = (p.images as string[]) || [];
    const needsImages = hasPlaceholder(images);
    const needsCategory = !["laptop", "desktop", "accessory"].includes(cat);

    if (!needsImages && !needsCategory) continue;

    await db
      .update(products)
      .set({
        images: needsImages ? FALLBACK_IMAGES[cat] ?? FALLBACK_IMAGES.laptop : images,
        category: needsCategory ? inferCategory(p.name as string) : cat,
        updatedAt: new Date(),
      })
      .where(eq(products.id, p.id));
    fixed += 1;
  }

  /* 5. Verify: re-read the database and confirm every catalog product exists
     with exactly the catalog's image paths. The /api/seed response reports
     this so the operator can confirm all 24 products were synced. */
  const verifyRows = await db.select().from(products).orderBy(asc(products.id));
  const productReport: { name: string; id: number; firstImage: string; imageCount: number; ok: boolean }[] = [];
  const unverified: { name: string; reason: string }[] = [];
  for (const item of CATALOG) {
    const matches = verifyRows.filter((r: any) => normalizeName(r.name as string) === normalizeName(item.name));
    if (matches.length === 0) {
      unverified.push({ name: item.name, reason: "row missing after upsert" });
      continue;
    }
    const row = matches[0];
    const images = (row.images as string[]) || [];
    const ok = JSON.stringify(images) === JSON.stringify(item.images);
    if (!ok) {
      unverified.push({ name: item.name, reason: "images do not match catalog" });
    }
    productReport.push({
      name: item.name,
      id: row.id as number,
      firstImage: images[0] ?? "",
      imageCount: images.length,
      ok,
    });
  }

  /* 6. Seed demo reviews only when the table is empty. */
  const [existingReview] = await db.select().from(reviews).limit(1);
  if (!existingReview) {
    await db.insert(reviews).values([
      { customerName: "Rahul S.", rating: 5, text: "Excellent laptop quality and professional service. Highly recommend Maxx Computers.", isDemo: true },
      { customerName: "Priya M.", rating: 5, text: "Got a great deal on a Dell Latitude. Working perfectly for my office work.", isDemo: true },
      { customerName: "Karthik N.", rating: 4, text: "Good service and prompt response. The refurbished Lenovo ThinkPad looks like new.", isDemo: true },
    ]);
  }

  return {
    inserted,
    updated,
    deduped,
    fixed,
    catalogTotal: CATALOG.length,
    verified: productReport.filter((p) => p.ok).length,
    unverified,
    products: productReport,
  };
}
