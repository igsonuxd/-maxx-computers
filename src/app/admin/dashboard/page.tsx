import { db } from "@/db";
import { products, orders, serviceBookings, enquiries } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Package, ShoppingCart, Wrench, MessageSquare, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt)).limit(5);
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5);
  const allBookings = await db.select().from(serviceBookings).orderBy(desc(serviceBookings.createdAt)).limit(5);
  const allEnquiries = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(5);

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <Link href="/admin/logout" className="text-sm font-semibold text-red-600 hover:text-red-800 flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center space-x-4 mb-4 text-zinc-500">
              <Package className="w-6 h-6" />
              <h2 className="font-bold text-black">Products</h2>
            </div>
            <Link href="/admin/dashboard/products" className="text-sm font-semibold hover:underline">Manage Inventory &rarr;</Link>
          </div>
          <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center space-x-4 mb-4 text-zinc-500">
              <ShoppingCart className="w-6 h-6" />
              <h2 className="font-bold text-black">Orders</h2>
            </div>
            <Link href="/admin/dashboard/orders" className="text-sm font-semibold hover:underline">View All Orders &rarr;</Link>
          </div>
          <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center space-x-4 mb-4 text-zinc-500">
              <Wrench className="w-6 h-6" />
              <h2 className="font-bold text-black">Bookings</h2>
            </div>
            <Link href="/admin/dashboard/bookings" className="text-sm font-semibold hover:underline">View Bookings &rarr;</Link>
          </div>
          <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center space-x-4 mb-4 text-zinc-500">
              <MessageSquare className="w-6 h-6" />
              <h2 className="font-bold text-black">Enquiries</h2>
            </div>
            <Link href="/admin/dashboard/enquiries" className="text-sm font-semibold hover:underline">View Enquiries &rarr;</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white border border-zinc-200">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-lg">Recent Orders</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {allOrders.map(order => (
                <div key={order.id} className="p-6 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-black">{order.customerName}</div>
                    <div className="text-sm text-zinc-500">{order.phone} • ₹{order.totalAmount}</div>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 bg-zinc-100 rounded-full">{order.status}</div>
                </div>
              ))}
              {allOrders.length === 0 && <div className="p-6 text-zinc-500 text-center">No recent orders</div>}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white border border-zinc-200">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="font-bold text-lg">Recent Service Bookings</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {allBookings.map(booking => (
                <div key={booking.id} className="p-6 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-black">{booking.customerName}</div>
                    <div className="text-sm text-zinc-500">{booking.serviceType} • {booking.deviceType}</div>
                  </div>
                  <div className="text-xs font-bold px-3 py-1 bg-zinc-100 rounded-full">{booking.status}</div>
                </div>
              ))}
              {allBookings.length === 0 && <div className="p-6 text-zinc-500 text-center">No recent bookings</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
