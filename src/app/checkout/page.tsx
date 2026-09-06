"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone number required"),
  whatsapp: z.string().optional(),
  email: z.string().email("Valid email required"),
  address: z.string().min(10, "Full address required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().min(6, "Valid pincode required"),
  message: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map(item => ({ id: item.id, quantity: item.quantity, priceAtTime: item.price })),
          totalAmount: subtotal
        }),
      });

      if (!response.ok) throw new Error("Failed to place order");

      clearCart();
      setIsSuccess(true);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-24 px-4">
        <div className="max-w-md w-full bg-white p-10 text-center border border-zinc-200">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-black mb-4">Order Placed!</h2>
          <p className="text-zinc-600 mb-8">
            Thank you for choosing Maxx Computers. Our team will contact you shortly to confirm your order and arrange delivery.
          </p>
          <button onClick={() => router.push("/")} className="w-full bg-black text-white py-4 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors">
            RETURN TO HOME
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-10">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div className="bg-white border border-zinc-200 p-8">
              <h2 className="text-xl font-bold mb-6">Delivery Details</h2>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Full Name *</label>
                    <input {...register("customerName")} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Email Address *</label>
                    <input type="email" {...register("email")} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Phone Number *</label>
                    <input {...register("phone")} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">WhatsApp Number (Optional)</label>
                    <input {...register("whatsapp")} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Full Delivery Address *</label>
                    <textarea {...register("address")} rows={3} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">City *</label>
                    <input {...register("city")} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Pincode *</label>
                    <input {...register("pincode")} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                    {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Order Notes (Optional)</label>
                    <textarea {...register("message")} rows={2} className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white border border-zinc-200 p-8 sticky top-32">
              <h2 className="text-xl font-bold mb-6">Your Order</h2>
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b border-zinc-50 pb-4">
                    <div className="flex-1">
                      <p className="font-semibold text-black line-clamp-1">{item.name}</p>
                      <p className="text-zinc-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-bold">₹{Number(item.price) * item.quantity}</div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 space-y-4 mb-8 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold">Total Payable</span>
                  <span className="text-2xl font-black">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full bg-black text-white px-6 py-4 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors flex items-center justify-center space-x-2 disabled:bg-zinc-400"
              >
                <span>{isSubmitting ? "PROCESSING..." : "PLACE ORDER"}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
              
              <p className="text-xs text-zinc-500 mt-4 text-center">
                By placing this order, you agree to our Terms & Conditions. Payment will be collected on delivery or via secure link.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
