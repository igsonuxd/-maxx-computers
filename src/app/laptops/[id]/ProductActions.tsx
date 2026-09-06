"use client";

import { ShoppingCart, MessageCircle, AlertCircle } from "lucide-react";
import { useCartStore, Product } from "@/lib/store";
import { toast } from "sonner";

export default function ProductActions({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    if (product.stockQuantity <= 0) {
      toast.error("Product is out of stock");
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const generateWhatsAppMessage = () => {
    return encodeURIComponent(
      `Hello Maxx Computers,\n\nI am interested in:\n${product.name}\nPrice: ₹${product.price}\n\nPlease share availability and details.\n\nThank you.`
    );
  };

  return (
    <div className="space-y-4">
      {product.stockQuantity === 0 ? (
        <div className="bg-red-50 text-red-600 p-4 border border-red-100 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">Currently Out of Stock</span>
        </div>
      ) : product.stockQuantity <= 3 ? (
        <div className="text-amber-600 text-sm font-semibold mb-4">
          Hurry! Only {product.stockQuantity} left in stock.
        </div>
      ) : (
        <div className="text-green-600 text-sm font-semibold mb-4">
          In Stock ({product.stockQuantity} available)
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAddToCart}
          disabled={product.stockQuantity === 0}
          className="flex-1 bg-black text-white px-8 py-4 text-sm font-bold tracking-wide hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>ADD TO CART</span>
        </button>
        <a
          href={`https://wa.me/918317399090?text=${generateWhatsAppMessage()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 border border-zinc-300 text-black px-8 py-4 text-sm font-bold tracking-wide hover:bg-zinc-50 transition-colors flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>WHATSAPP ENQUIRY</span>
        </a>
      </div>
    </div>
  );
}
