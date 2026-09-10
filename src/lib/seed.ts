import { asc, eq, sql } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { products, reviews, users } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Verified genuine image URLs (s3n.cashify.in + images.unsplash.com)  */
/* Both hosts are whitelisted in next.config.ts                        */
/* ------------------------------------------------------------------ */

export const IMG = {
  // Cashify (genuine refurbished-device photos)
  dellA: "https://s3n.cashify.in/cashify/store/product/0fa7804d2b264e129026f14d955aebc2.png",
  dellB: "https://s3n.cashify.in/cashify/store/product/2ccb9f5d945541abbdb3cfac9cdb8cf7.png",
  lenovo: "https://s3n.cashify.in/cashify/store/product/858d74c51680449b82aeac04af542ca4.png",
  // Unsplash (real photography)
  lap1: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop",
  lap2: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=600&fit=crop",
  lap3: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop",
  lap4: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=600&fit=crop",
  lap5: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop",
  lap6: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop",
  lap7: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=600&fit=crop",
  lap8: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=600&fit=crop",
  lap9: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=600&fit=crop",
  lap10: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop",
  desk1: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&h=600&fit=crop",
  desk2: "https://images.unsplash.com/photo-1593642532400-2682810df593?w=800&h=600&fit=crop",
  desk3: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&h=600&fit=crop",
  desk4: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&h=600&fit=crop",
  desk5: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=600&fit=crop",
  mon: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=600&fit=crop",
  kb: "https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=600&h=400&fit=crop",
  ram: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=400&fit=crop",
  ssd: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=400&fit=crop",
  hdd: "https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=600&h=400&fit=crop",
  chip: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=600&h=400&fit=crop",
  charger: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=400&fit=crop",
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
    images: [IMG.dellA, IMG.lap1, IMG.dellB, IMG.lap2],
    description: "Premium refurbished Dell Latitude 3490. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 3400", brand: "DELL", model: "Latitude 3400", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD",
    condition: "Excellent", batteryCondition: "Good (2-3 hrs)", warranty: "3 Months", price: "19500", stockQuantity: 3,
    images: [IMG.dellB, IMG.lap1, IMG.dellA, IMG.lap3],
    description: "Premium refurbished Dell Latitude 3400. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 3410", brand: "DELL", model: "Latitude 3410", category: "laptop",
    processor: "Intel Core i5 10th Gen", ram: "8GB", storage: "512GB SSD", display: "14 inch FHD",
    condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "24000", stockQuantity: 4,
    images: [IMG.lap1, IMG.dellA, IMG.lap4, IMG.dellB],
    description: "Premium refurbished Dell Latitude 3410. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 3420", brand: "DELL", model: "Latitude 3420", category: "laptop",
    processor: "Intel Core i5 11th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD",
    condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "28000", stockQuantity: 2,
    images: [IMG.lap2, IMG.dellA, IMG.lap5, IMG.dellB],
    description: "Premium refurbished Dell Latitude 3420. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5480", brand: "DELL", model: "Latitude 5480", category: "laptop",
    processor: "Intel Core i5 7th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Good", batteryCondition: "Good", warranty: "3 Months", price: "16000", stockQuantity: 6,
    images: [IMG.lap3, IMG.dellA, IMG.lap1, IMG.dellB],
    description: "Premium refurbished Dell Latitude 5480. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5490", brand: "DELL", model: "Latitude 5490", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19000", stockQuantity: 5,
    images: [IMG.lap4, IMG.dellB, IMG.lap2, IMG.dellA],
    description: "Premium refurbished Dell Latitude 5490. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5400", brand: "DELL", model: "Latitude 5400", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19500", stockQuantity: 4,
    images: [IMG.lap5, IMG.dellA, IMG.lap1, IMG.dellB],
    description: "Premium refurbished Dell Latitude 5400. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5410", brand: "DELL", model: "Latitude 5410", category: "laptop",
    processor: "Intel Core i5 10th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD",
    condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "24500", stockQuantity: 3,
    images: [IMG.lap6, IMG.dellA, IMG.lap4, IMG.dellB],
    description: "Premium refurbished Dell Latitude 5410. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Dell Latitude 5420", brand: "DELL", model: "Latitude 5420", category: "laptop",
    processor: "Intel Core i5 11th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD",
    condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "28500", stockQuantity: 2,
    images: [IMG.lap7, IMG.dellA, IMG.lap5, IMG.dellB],
    description: "Premium refurbished Dell Latitude 5420. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Lenovo ThinkPad L480", brand: "LENOVO", model: "ThinkPad L480", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "18500", stockQuantity: 5,
    images: [IMG.lenovo, IMG.lap1, IMG.lap3, IMG.lap2],
    description: "Premium refurbished Lenovo ThinkPad L480. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Lenovo ThinkPad L490", brand: "LENOVO", model: "ThinkPad L490", category: "laptop",
    processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD",
    condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19500", stockQuantity: 4,
    images: [IMG.lap8, IMG.lenovo, IMG.lap1, IMG.lap3],
    description: "Premium refurbished Lenovo ThinkPad L490. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Lenovo ThinkPad L440", brand: "LENOVO", model: "ThinkPad L440", category: "laptop",
    processor: "Intel Core i5 4th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD",
    condition: "Good", batteryCondition: "Average", warranty: "1 Month", price: "12000", stockQuantity: 3,
    images: [IMG.lap9, IMG.lenovo, IMG.lap4, IMG.lap1],
    description: "Premium refurbished Lenovo ThinkPad L440. Professionally checked and ready for business or personal use.",
  },
  {
    name: "Lenovo ThinkPad L450", brand: "LENOVO", model: "ThinkPad L450", category: "laptop",
    processor: "Intel Core i5 5th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD",
    condition: "Good", batteryCondition: "Average", warranty: "1 Month", price: "13500", stockQuantity: 2,
    images: [IMG.lap10, IMG.lenovo, IMG.lap6, IMG.lap2],
    description: "Premium refurbished Lenovo ThinkPad L450. Professionally checked and ready for business or personal use.",
  },

  /* ---------------- Desktops (5) — wholesale pricing ---------------- */
  {
    name: "Lenovo V530-15ICH Desktop", brand: "LENOVO", model: "V530-15ICH", category: "desktop",
    processor: "Intel Core i3 8th Gen", ram: "8GB DDR4", storage: "256GB SSD + 500GB HDD", display: "19 inch Monitor + Keyboard Mouse",
    condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "19000", stockQuantity: 3,
    images: [IMG.desk1, IMG.mon, IMG.desk3, IMG.desk2],
    description: 'Lenovo V530 Tower with 19" Monitor Set. Fully tested, business-ready desktop.',
  },
  {
    name: "Dell Optiplex 9020 Desktop", brand: "DELL", model: "Optiplex 9020", category: "desktop",
    processor: "Intel Core i3 3rd Gen", ram: "8GB", storage: "500GB HDD", display: "With Monitor + Keyboard/Mouse",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "7500", stockQuantity: 6,
    images: [IMG.desk4, IMG.desk1, IMG.desk5, IMG.desk2],
    description: "Refurbished Dell Optiplex 9020 business desktop. Tested and ready for office use.",
  },
  {
    name: "HP EliteDesk 800 G1 SFF Desktop", brand: "HP", model: "EliteDesk 800 G1 SFF", category: "desktop",
    processor: "Intel Core i5 4th Gen", ram: "4GB", storage: "500GB HDD", display: "With Monitor + Keyboard/Mouse",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "9500", stockQuantity: 6,
    images: [IMG.desk5, IMG.desk2, IMG.desk1, IMG.mon],
    description: "Compact HP EliteDesk SFF business desktop. Tested and ready for office use.",
  },
  {
    name: "HP ProDesk 400 G2 MT Desktop", brand: "HP", model: "ProDesk 400 G2 MT", category: "desktop",
    processor: "Intel Core i5 4th Gen", ram: "4GB", storage: "500GB HDD", display: "With Monitor + Keyboard/Mouse",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "9500", stockQuantity: 3,
    images: [IMG.desk2, IMG.desk1, IMG.desk3, IMG.desk4],
    description: "Refurbished HP ProDesk 400 G2 mini tower desktop. Tested and ready for office use.",
  },
  {
    name: "HP Desktop Pro A G2 Ryzen 5", brand: "HP", model: "Desktop Pro A G2", category: "desktop",
    processor: "AMD Ryzen 5", ram: "8GB DDR4", storage: "256GB SSD + 500GB HDD", display: "19 inch Monitor + Keyboard Mouse",
    condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "19000", stockQuantity: 2,
    images: [IMG.desk3, IMG.desk1, IMG.desk4, IMG.mon],
    description: 'HP Desktop Pro A G2 with Ryzen 5 and 19" Monitor Set. Wholesale price.',
  },

  /* ---------------- Accessories (6) — wholesale pricing ---------------- */
  {
    name: "Keyboard + Mouse Combo (HP/Dell)", brand: "HP", model: "Keyboard + Mouse Combo", category: "accessory",
    processor: "Wired USB", ram: "N/A", storage: "N/A", display: "Standard Layout",
    condition: "New", batteryCondition: "N/A", warranty: "1 Month", price: "800", stockQuantity: 10,
    images: [IMG.kb, IMG.ram, IMG.charger, IMG.ssd],
    description: "Genuine wired keyboard + mouse combo. Wholesale price.",
  },
  {
    name: '19" LED Monitor (HP/Dell/Lenovo)', brand: "HP", model: '19" LED Monitor', category: "accessory",
    processor: "60Hz", ram: "N/A", storage: "N/A", display: "19 inch LED",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "5500", stockQuantity: 5,
    images: [IMG.mon, IMG.desk3, IMG.desk1, IMG.desk2],
    description: 'Refurbished 19" LED monitor from HP/Dell/Lenovo. Tested. Wholesale price.',
  },
  {
    name: "8GB DDR4 RAM (Desktop/Laptop)", brand: "HYNIX", model: "8GB DDR4", category: "accessory",
    processor: "2400MHz", ram: "8GB DDR4", storage: "N/A", display: "N/A",
    condition: "New", batteryCondition: "N/A", warranty: "1 Month", price: "1800", stockQuantity: 10,
    images: [IMG.ram, IMG.ssd, IMG.chip, IMG.kb],
    description: "Genuine 8GB DDR4 desktop/laptop RAM. Wholesale price.",
  },
  {
    name: "256GB SSD SATA", brand: "SAMSUNG", model: "256GB SSD SATA", category: "accessory",
    processor: "SATA III", ram: "N/A", storage: "256GB SSD", display: "N/A",
    condition: "New", batteryCondition: "N/A", warranty: "1 Month", price: "2200", stockQuantity: 10,
    images: [IMG.ssd, IMG.ram, IMG.chip, IMG.hdd],
    description: "Genuine 256GB SATA SSD. Wholesale price.",
  },
  {
    name: "500GB Hard Drive", brand: "SEAGATE", model: "500GB HDD", category: "accessory",
    processor: "7200 RPM", ram: "N/A", storage: "500GB HDD", display: "N/A",
    condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "1200", stockQuantity: 10,
    images: [IMG.hdd, IMG.ssd, IMG.ram, IMG.chip],
    description: "Refurbished 500GB desktop hard drive. Tested. Wholesale price.",
  },
  {
    name: "Laptop Charger (65W Universal)", brand: "DELL", model: "65W Universal Charger", category: "accessory",
    processor: "65W", ram: "N/A", storage: "N/A", display: "N/A",
    condition: "New", batteryCondition: "N/A", warranty: "1 Month", price: "900", stockQuantity: 10,
    images: [IMG.charger, IMG.ram, IMG.kb, IMG.ssd],
    description: "Genuine 65W universal laptop charger. Wholesale price.",
  },
];

const FALLBACK_IMAGES: Record<string, string[]> = {
  laptop: [IMG.dellA, IMG.lap1, IMG.dellB, IMG.lap2],
  desktop: [IMG.desk1, IMG.desk2, IMG.desk3, IMG.desk4],
  accessory: [IMG.kb, IMG.mon, IMG.ram, IMG.ssd],
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

  /* 3. Upsert every catalog item by unique name (idempotent).
     - no row  -> insert
     - rows    -> keep the lowest id canonical, update it, delete duplicates */
  for (const item of CATALOG) {
    const matches = await db
      .select()
      .from(products)
      .where(eq(products.name, item.name))
      .orderBy(asc(products.id));

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

  /* 4. Fix any remaining rows: replace placeholder/missing images and
     assign a category to rows that lack a meaningful one. */
  const allProducts = await db.select().from(products);
  for (const p of allProducts) {
    const cat = (p.category as string | null) || "";
    const images = (p.images as string[]) || [];
    const needsImages = hasPlaceholder(images);
    const needsCategory = !["laptop", "desktop", "accessory"].includes(cat);

    if (!needsImages && !needsCategory) continue;

    await db
      .update(products)
      .set({
        images: needsImages ? FALLBACK_IMAGES[cat] ?? FALLBACK_IMAGES.laptop : images,
        category: needsCategory ? inferCategory(p.name) : cat,
        updatedAt: new Date(),
      })
      .where(eq(products.id, p.id));
    fixed += 1;
  }

  /* 5. Seed demo reviews only when the table is empty. */
  const [existingReview] = await db.select().from(reviews).limit(1);
  if (!existingReview) {
    await db.insert(reviews).values([
      { customerName: "Rahul S.", rating: 5, text: "Excellent laptop quality and professional service. Highly recommend Maxx Computers.", isDemo: true },
      { customerName: "Priya M.", rating: 5, text: "Got a great deal on a Dell Latitude. Working perfectly for my office work.", isDemo: true },
      { customerName: "Karthik N.", rating: 4, text: "Good service and prompt response. The refurbished Lenovo ThinkPad looks like new.", isDemo: true },
    ]);
  }

  return { inserted, updated, deduped, fixed };
}
