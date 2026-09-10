import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviews, users } from "@/db/schema";
import bcryptjs from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if seeded
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length > 0) {
      return NextResponse.json({ message: "Already seeded" });
    }

    // Seed admin
    const passwordHash = await bcryptjs.hash("admin123", 10);
    await db.insert(users).values({
      email: "admin@maxxcomputers.com",
      passwordHash,
      role: "admin",
    });

    // Seed laptops
    const demoLaptops = [
      { name: "Dell Latitude 3490", brand: "DELL", model: "Latitude 3490", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD", condition: "Excellent", batteryCondition: "Good (2-3 hrs)", warranty: "3 Months", price: "18500", stockQuantity: 5 },
      { name: "Dell Latitude 3400", brand: "DELL", model: "Latitude 3400", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD", condition: "Excellent", batteryCondition: "Good (2-3 hrs)", warranty: "3 Months", price: "19500", stockQuantity: 3 },
      { name: "Dell Latitude 3410", brand: "DELL", model: "Latitude 3410", processor: "Intel Core i5 10th Gen", ram: "8GB", storage: "512GB SSD", display: "14 inch FHD", condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "24000", stockQuantity: 4 },
      { name: "Dell Latitude 3420", brand: "DELL", model: "Latitude 3420", processor: "Intel Core i5 11th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD", condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "28000", stockQuantity: 2 },
      { name: "Dell Latitude 5480", brand: "DELL", model: "Latitude 5480", processor: "Intel Core i5 7th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Good", batteryCondition: "Good", warranty: "3 Months", price: "16000", stockQuantity: 6 },
      { name: "Dell Latitude 5490", brand: "DELL", model: "Latitude 5490", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19000", stockQuantity: 5 },
      { name: "Dell Latitude 5400", brand: "DELL", model: "Latitude 5400", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19500", stockQuantity: 4 },
      { name: "Dell Latitude 5410", brand: "DELL", model: "Latitude 5410", processor: "Intel Core i5 10th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD", condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "24500", stockQuantity: 3 },
      { name: "Dell Latitude 5420", brand: "DELL", model: "Latitude 5420", processor: "Intel Core i5 11th Gen", ram: "16GB", storage: "512GB SSD", display: "14 inch FHD", condition: "Like New", batteryCondition: "Excellent", warranty: "6 Months", price: "28500", stockQuantity: 2 },
      { name: "Lenovo ThinkPad L480", brand: "LENOVO", model: "ThinkPad L480", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "18500", stockQuantity: 5 },
      { name: "Lenovo ThinkPad L490", brand: "LENOVO", model: "ThinkPad L490", processor: "Intel Core i5 8th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch FHD", condition: "Excellent", batteryCondition: "Good", warranty: "3 Months", price: "19500", stockQuantity: 4 },
      { name: "Lenovo ThinkPad L440", brand: "LENOVO", model: "ThinkPad L440", processor: "Intel Core i5 4th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD", condition: "Good", batteryCondition: "Average", warranty: "1 Month", price: "12000", stockQuantity: 3 },
      { name: "Lenovo ThinkPad L450", brand: "LENOVO", model: "ThinkPad L450", processor: "Intel Core i5 5th Gen", ram: "8GB", storage: "256GB SSD", display: "14 inch HD", condition: "Good", batteryCondition: "Average", warranty: "1 Month", price: "13500", stockQuantity: 2 },
    ];

    for (const p of demoLaptops) {
      await db.insert(products).values({
        ...p,
        images: ["/placeholder-laptop.jpg"],
        description: `Premium refurbished ${p.name}. Professionally checked and ready for business or personal use.`,
      });
    }

    // Seed demo reviews
    const demoReviews = [
      { customerName: "Rahul S.", rating: 5, text: "Excellent laptop quality and professional service. Highly recommend Maxx Computers.", isDemo: true },
      { customerName: "Priya M.", rating: 5, text: "Got a great deal on a Dell Latitude. Working perfectly for my office work.", isDemo: true },
      { customerName: "Karthik N.", rating: 4, text: "Good service and prompt response. The refurbished Lenovo ThinkPad looks like new.", isDemo: true }
    ];

    for (const r of demoReviews) {
      await db.insert(reviews).values(r);
    }

    return NextResponse.json({ message: "Seeding complete" });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
