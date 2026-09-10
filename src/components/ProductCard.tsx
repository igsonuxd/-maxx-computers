"use client";

import Link from "next/link";
import { ShoppingCart, MessageCircle } from "lucide-react";
import { useCartStore, Product } from "@/lib/store";
import { toast } from "sonner";

export default function ProductCard({ product }: { product: Product }) {
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
    <div className="group bg-white border border-zinc-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      
      <Link
        href={`/laptops/${product.id}`}
        className="relative h-64 bg-zinc-50 flex items-center justify-center p-6 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            product.images?.[0] ||
            "https://placehold.co/600x400?text=No+Image"
          }
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />

        {product.stockQuantity === 0 && (
          <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 tracking-wider">
            OUT OF STOCK
          </div>
        )}

        {product.stockQuantity > 0 && product.stockQuantity <= 3 && (
          <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 tracking-wider">
            ONLY {product.stockQuantity} LEFT
          </div>
        )}
      </Link>

      <div className="p-6 flex-grow flex flex-col">
        <div className="text-xs text-zinc-500 font-semibold tracking-wider mb-2">
          {product.brand}
        </div>

        <Link href={`/laptops/${product.id}`}>
          <h3 className="text-lg font-bold text-black hover:text-zinc-600 transition-colors mb-2 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="text-sm text-zinc-600 space-y-1 mb-4 flex-grow">
          <p>{product.processor}</p>
          <p>
            {product.ram} • {product.storage}
          </p>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
          <div className="text-xl font-black">
            ₹{product.price}
          </div>

          <div className="flex space-x-2">
            <a
              href={`https://wa.me/918317399090?text=${generateWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-400 hover:text-green-600 hover:bg-green-50 transition-colors rounded"
              title="WhatsApp Enquiry"
            >
              <MessageCircle className="w-5 h-5" />
            </a>

            <button
              onClick={handleAddToCart}
              disabled={product.stockQuantity === 0}
              className="p-2 bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors rounded"
              title="Add to Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}