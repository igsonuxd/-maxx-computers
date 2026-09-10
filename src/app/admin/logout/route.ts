import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviews, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const existingAdmin = await db.select().from(users).limit(1);
    if (existingAdmin.length === 0) {
      const passwordHash = await bcryptjs.hash("admin123", 10);
      await db.insert(users).values({
        email: "admin@maxxcomputers.com",
        passwordHash,
        role: "admin",
      });
    }

    const existingProducts = await db.select().from(products);
    const existingNames = new Set(existingProducts.map((p) => p.name));

    // GENUINE CASHIFY 4 photos each
    const cashifyDell1 = "https://s3n.cashify.in/cashify/store/product/0fa7804d2b264e129026f14d955aebc2.png";
    const cashifyDell2 = "https://s3n.cashify.in/cashify/store/product/2ccb9f5d945541abbdb3cfac9cdb8cf7.png";
    const cashifyLenovo1 = "https://s3n.cashify.in/cashify/store/product/858d74c51680449b82aeac04af542ca4.png";
    const cashifyLenovo2 = "https://s3n.cashify.in/cashify/store/product/e5cd98b2c65c47df9ff48da821c48d7b.png";
    const cashifyLenovo3 = "https://s3n.cashify.in/cashify/store/product/4511ba66d3584caa8eebbcc6bf4f3004.png";
    const cashifyLenovo4 = "https://s3n.cashify.in/cashify/store/product/238156c1e6be4e8caf2f1acb6ed41ebe.png";
    const realLaptopOpen = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop";
    const realLaptopKeyboard = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=600&fit=crop";

    const demoLaptops = [
      { name: "Dell Latitude 3490", brand: "DELL", model: "Latitude 3490", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD", condition: "Excellent", batteryCondition: "Good (2-3 hrs)", warranty: "3 Months", price: "18500", stockQuantity: 5, category: "laptop" as const, images: [cashifyDell1, cashifyDell2, realLaptopOpen, realLaptopKeyboard] },
      { name: "Dell Latitude 3400", brand: "DELL", model: "Latitude 3400", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD", condition: "Excellent", batteryCondition: "Good (2-3 hrs)", warranty: "3 Months", price: "19500", stockQuantity: 3, category: "laptop" as const, images: [cashifyDell1, cashifyDell2, realLaptopOpen, realLaptopKeyboard] },
      { name: "Dell Latitude 3410", brand: "DELL", model: "Latitude 3410", processor: "Intel Core i5 10th Gen", ram: "8GB", storage: "512GB SSD", display: "14 inch FHD", condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "24000", stockQuantity: 4, category: "laptop" as const, images: [cashifyDell2, cashifyDell1, realLaptopKeyboard, realLaptopOpen] },
      { name: "Dell Latitude 3420", brand: "DELL", model: "Latitude 3420", processor: "Intel Core i5 11th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD", condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "28000", stockQuantity: 2, category: "laptop" as const, images: [cashifyDell2, cashifyDell1, realLaptopOpen, realLaptopKeyboard] },
      { name: "Dell Latitude 5480", brand: "DELL", model: "Latitude 5480", processor: "Intel Core i5 7th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Good", batteryCondition: "Good", warranty: "3 Months", price: "16000", stockQuantity: 6, category: "laptop" as const, images: [cashifyDell1, cashifyDell2, realLaptopKeyboard, realLaptopOpen] },
      { name: "Dell Latitude 5490", brand: "DELL", model: "Latitude 5490", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19000", stockQuantity: 5, category: "laptop" as const, images: [cashifyDell1, cashifyDell2, realLaptopOpen, realLaptopKeyboard] },
      { name: "Dell Latitude 5400", brand: "DELL", model: "Latitude 5400", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19500", stockQuantity: 4, category: "laptop" as const, images: [cashifyDell1, cashifyDell2, realLaptopKeyboard, realLaptopOpen] },
      { name: "Dell Latitude 5410", brand: "DELL", model: "Latitude 5410", processor: "Intel Core i5 10th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD", condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "24500", stockQuantity: 3, category: "laptop" as const, images: [cashifyDell2, cashifyDell1, realLaptopOpen, realLaptopKeyboard] },
      { name: "Dell Latitude 5420", brand: "DELL", model: "Latitude 5420", processor: "Intel Core i5 11th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD", condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "28500", stockQuantity: 2, category: "laptop" as const, images: [cashifyDell2, cashifyDell1, realLaptopKeyboard, realLaptopOpen] },
      { name: "Lenovo ThinkPad L480", brand: "LENOVO", model: "ThinkPad L480", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "18500", stockQuantity: 5, category: "laptop" as const, images: [cashifyLenovo1, cashifyLenovo2, realLaptopOpen, cashifyLenovo3] },
      { name: "Lenovo ThinkPad L490", brand: "LENOVO", model: "ThinkPad L490", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19500", stockQuantity: 4, category: "laptop" as const, images: [cashifyLenovo1, cashifyLenovo4, realLaptopKeyboard, cashifyLenovo2] },
      { name: "Lenovo ThinkPad L440", brand: "LENOVO", model: "ThinkPad L440", processor: "Intel Core i5 4th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD", condition: "Good", batteryCondition: "Average", warranty: "1 Month", price: "12000", stockQuantity: 3, category: "laptop" as const, images: [cashifyLenovo2, cashifyLenovo3, realLaptopOpen, cashifyLenovo1] },
      { name: "Lenovo ThinkPad L450", brand: "LENOVO", model: "ThinkPad L450", processor: "Intel Core i5 5th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD", condition: "Good", batteryCondition: "Average", warranty: "1 Month", price: "13500", stockQuantity: 2, category: "laptop" as const, images: [cashifyLenovo3, cashifyLenovo4, realLaptopKeyboard, cashifyLenovo1] },
    ];

    const desktopTower = "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&h=600&fit=crop";
    const desktopMonitor = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=600&fit=crop";
    const desktopSetup = "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&h=600&fit=crop";
    const desktopOffice = "https://images.unsplash.com/photo-1593642532400-2682810df593?w=800&h=600&fit=crop";
    const realDesktops = [
      { name: "Lenovo V530-15ICH Desktop", brand: "LENOVO", model: "V530-15ICH", processor: "Intel Core i3 8th Gen", ram: "8GB DDR4", storage: "256GB SSD + 500GB HDD", display: '19" Monitor + Keyboard Mouse', condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "19000", stockQuantity: 3, category: "desktop" as const, images: [desktopTower, desktopMonitor, desktopSetup, desktopOffice], description: "Lenovo V530-15ICH Tower Desktop - Core i3 8th Gen, 8GB DDR4, 256GB SSD + 500GB HDD with 19\" Monitor, Keyboard & Mouse Set. Perfect for office & home use. Wholesale price." },
      { name: "Dell Optiplex 9020 Desktop", brand: "DELL", model: "Optiplex 9020", processor: "Intel Core i3 3rd Gen", ram: "8GB", storage: "500GB HDD", display: '19" Monitor + Keyboard Mouse', condition: "Good", batteryCondition: "N/A", warranty: "3 Months", price: "7500", stockQuantity: 5, category: "desktop" as const, images: [desktopTower, desktopSetup, desktopMonitor, desktopOffice], description: "Dell Optiplex 9020 - Core i3 3rd Gen, 8GB RAM, 500GB HDD with 19\" Monitor + Keyboard Mouse. Budget office desktop. Wholesale price." },
      { name: "HP EliteDesk 800 G1 SFF Desktop", brand: "HP", model: "EliteDesk 800 G1 SFF", processor: "Intel Core i5 4th Gen", ram: "4GB", storage: "500GB HDD", display: '19" HP Monitor + Keyboard Mouse', condition: "Good", batteryCondition: "N/A", warranty: "3 Months", price: "9500", stockQuantity: 4, category: "desktop" as const, images: [desktopOffice, desktopMonitor, desktopTower, desktopSetup], description: "HP EliteDesk 800 G1 SFF - Core i5 4th Gen, 4GB RAM, 500GB HDD with 19\" HP Monitor, Keyboard & Mouse. Compact business desktop. Wholesale price." },
      { name: "HP ProDesk 400 G2 MT Desktop", brand: "HP", model: "ProDesk 400 G2 MT", processor: "Intel Core i5 4th Gen", ram: "4GB", storage: "500GB HDD", display: '19" HP Monitor + Keyboard Mouse', condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "9500", stockQuantity: 3, category: "desktop" as const, images: [desktopOffice, desktopTower, desktopSetup, desktopMonitor], description: "HP ProDesk 400 G2 MT - Core i5 4th Gen, 4GB RAM, 500GB HDD with 19\" HP Monitor Set. 3 Months Warranty. Wholesale price." },
      { name: "HP Desktop Pro A G2 Ryzen 5", brand: "HP", model: "Pro A G2 Ryzen 5", processor: "AMD Ryzen 5", ram: "8GB DDR4", storage: "256GB SSD + 500GB HDD", display: '19" HP Monitor + Keyboard Mouse', condition: "Like New", batteryCondition: "N/A", warranty: "3 Months", price: "19000", stockQuantity: 2, category: "desktop" as const, images: [desktopTower, desktopOffice, desktopMonitor, desktopSetup], description: "HP Desktop Pro A G2 - Ryzen 5, 8GB DDR4, 256GB SSD + 500GB HDD, Radeon Dedicated Graphics with 19\" HP Monitor Set. Wholesale price." },
    ];

    const accessories = [
      { name: "Keyboard + Mouse Combo (HP/Dell)", brand: "HP", model: "KM100", processor: "Wired USB", ram: "N/A", storage: "N/A", display: "Standard 104 Keys + Optical Mouse", condition: "New", batteryCondition: "N/A", warranty: "6 Months", price: "800", stockQuantity: 20, category: "accessory" as const, images: ["https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=600&h=400&fit=crop"], description: "Genuine HP/Dell Wired Keyboard + Mouse Combo. Wholesale price for bulk orders." },
      { name: '19" LED Monitor (HP/Dell/Lenovo)', brand: "HP", model: '19" LED', processor: "60Hz", ram: "N/A", storage: "N/A", display: '19" HD LED', condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "5500", stockQuantity: 15, category: "accessory" as const, images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=400&fit=crop"], description: "19\" LED Monitor - HP/Dell/Lenovo refurbished, excellent condition. Wholesale." },
      { name: "8GB DDR4 RAM (Desktop/Laptop)", brand: "HYNIX", model: "8GB DDR4", processor: "2400MHz", ram: "8GB DDR4", storage: "N/A", display: "DIMM/SODIMM", condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "1800", stockQuantity: 30, category: "accessory" as const, images: ["https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&h=400&fit=crop"], description: "8GB DDR4 RAM - Desktop & Laptop compatible. Tested, wholesale price." },
      { name: "256GB SSD SATA", brand: "SAMSUNG", model: "860 EVO 256GB", processor: "SATA III", ram: "N/A", storage: "256GB SSD", display: "2.5\" SATA", condition: "Like New", batteryCondition: "N/A", warranty: "6 Months", price: "2200", stockQuantity: 25, category: "accessory" as const, images: ["https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=400&fit=crop"], description: "256GB SSD SATA - Samsung/Crucial. 6 Months warranty, wholesale." },
      { name: "500GB Hard Drive", brand: "SEAGATE", model: "500GB HDD", processor: "7200 RPM", ram: "N/A", storage: "500GB HDD", display: "3.5\" SATA", condition: "Good", batteryCondition: "N/A", warranty: "1 Month", price: "1200", stockQuantity: 20, category: "accessory" as const, images: ["https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=400&fit=crop"], description: "500GB HDD - Seagate/WD. Tested, wholesale price." },
      { name: "Laptop Charger (65W Universal)", brand: "DELL", model: "65W Adapter", processor: "65W", ram: "N/A", storage: "N/A", display: "Universal Pin", condition: "Excellent", batteryCondition: "N/A", warranty: "3 Months", price: "900", stockQuantity: 15, category: "accessory" as const, images: ["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=400&fit=crop"], description: "Laptop Charger 65W - Dell/HP/Lenovo compatible. Wholesale." },
    ];

    const allProductsToSeed = [...demoLaptops, ...realDesktops, ...accessories];

    let addedCount = 0;
    for (const p of allProductsToSeed) {
      if (existingNames.has(p.name)) continue;
      await db.insert(products).values({
        ...p,
        images: (p as any).images || ["/placeholder-laptop.jpg"],
        description: (p as any).description || `Premium refurbished ${p.name}. Professionally checked and ready for business or personal use.`,
        category: (p as any).category || "laptop",
      });
      addedCount++;
    }

    for (const existing of existingProducts) {
      const imgs = existing.images as string[] | null;
      const needsUpdate = !imgs || imgs.length < 3 || imgs[0] === "/placeholder-laptop.jpg" || imgs[0]?.includes("placeholder") || !(existing as any).category;
      if (needsUpdate) {
        const match = allProductsToSeed.find((p) => p.name === existing.name);
        if (match) {
          await db.update(products).set({ images: (match as any).images, category: (match as any).category || "laptop" }).where(eq(products.id, existing.id));
          addedCount++;
        }
      }
    }

    const existingReviews = await db.select().from(reviews).limit(1);
    if (existingReviews.length === 0) {
      const demoReviews = [
        { customerName: "Rahul S.", rating: 5, text: "Excellent laptop quality and professional service. Highly recommend Maxx Computers.", isDemo: true },
        { customerName: "Priya M.", rating: 5, text: "Got a great deal on a Dell Latitude. Working perfectly for my office work.", isDemo: true },
        { customerName: "Karthik N.", rating: 4, text: "Good service and prompt response. The refurbished Lenovo ThinkPad looks like new.", isDemo: true },
      ];
      for (const r of demoReviews) await db.insert(reviews).values(r);
    }

    return NextResponse.json({ message: `Seeding complete - ${addedCount} products added/updated` });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}