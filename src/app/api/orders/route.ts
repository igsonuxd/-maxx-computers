import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, phone, whatsapp, email, address, city, pincode, message, items, totalAmount } = body;

    // Validate stock and collect item data
    for (const item of items) {
      const product = await db.select().from(products).where(eq(products.id, item.id)).limit(1);
      if (product.length === 0 || product[0].stockQuantity < item.quantity) {
        return NextResponse.json({ error: `Not enough stock for item ID ${item.id}` }, { status: 400 });
      }
    }

    // Process order in a transaction
    await db.transaction(async (tx) => {
      // 1. Create order
      const [newOrder] = await tx.insert(orders).values({
        customerName,
        phone,
        whatsapp,
        email,
        address,
        city,
        pincode,
        totalAmount: totalAmount.toString(),
        message,
        status: "Pending"
      }).returning();

      // 2. Create order items and update stock
      for (const item of items) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.id,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime.toString(),
        });

        await tx.update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
          .where(eq(products.id, item.id));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
