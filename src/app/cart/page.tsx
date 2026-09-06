"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore();

  const subtotal = items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="bg-zinc-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-zinc-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-black">Your cart is empty</h1>
          <p className="text-zinc-500 text-lg">Looks like you haven't added anything yet.</p>
          <Link href="/laptops" className="inline-flex bg-black text-white px-8 py-4 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors">
            START SHOPPING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-10">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div className="bg-white border border-zinc-200">
              {items.map((item) => (
                <div key={item.id} className="p-6 border-b border-zinc-100 last:border-b-0 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-24 h-24 bg-zinc-50 flex-shrink-0 flex items-center justify-center p-2">
                    <Image src={item.images[0] || "/placeholder-laptop.jpg"} alt={item.name} width={80} height={80} className="object-contain" />
                  </div>
                  
                  <div className="flex-grow">
                    <Link href={`/laptops/${item.id}`} className="text-lg font-bold text-black hover:text-zinc-600 transition-colors line-clamp-1">
                      {item.name}
                    </Link>
                    <div className="text-sm text-zinc-500 mt-1">{item.processor} • {item.ram}</div>
                    <div className="text-lg font-black mt-2">₹{item.price}</div>
                  </div>

                  <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center border border-zinc-200 bg-white">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 text-zinc-500 hover:text-black transition-colors disabled:opacity-50" disabled={item.quantity <= 1}>
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-zinc-500 hover:text-black transition-colors disabled:opacity-50" disabled={item.quantity >= item.stockQuantity}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white border border-zinc-200 p-8 sticky top-32">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-black">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Tax (Included)</span>
                  <span className="font-semibold text-black">₹0.00</span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-zinc-100 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout" className="w-full bg-black text-white px-6 py-4 text-sm font-bold tracking-wide hover:bg-zinc-800 transition-colors flex items-center justify-center space-x-2">
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
