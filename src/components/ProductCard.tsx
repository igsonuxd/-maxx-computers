"use client";

import Link from "next/link";
import { ShoppingCart, MessageCircle, Eye } from "lucide-react";
import { Product, useCartStore } from "@/lib/store";
import { toast } from "sonner";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  // Genuine Cashify fallback (not dummy)
  const fallbackImage =
    (product as any).category === "desktop"
      ? "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&h=400&fit=crop"
      : (product as any).category === "accessory"
        ? "https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=600&h=400&fit=crop"
        : "https://s3n.cashify.in/cashify/store/product/0fa7804d2b264e129026f14d955aebc2.png";
  const initialImage = product.images?.[0] && product.images[0] !== "/placeholder-laptop.jpg" ? product.images[0] : fallbackImage;

  const handleAddToCart = () => {
    if (product.stockQuantity <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="group relative bg-white border border-zinc-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      <Link href={`/laptops/${product.id}`} className="block relative aspect-[4/3] overflow-hidden bg-zinc-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={initialImage}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== fallbackImage) target.src = fallbackImage;
          }}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.stockQuantity > 0 && product.stockQuantity <= 3 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1">ONLY {product.stockQuantity} LEFT</span>
          )}
          {(product as any).category === "desktop" ? (
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1">DESKTOP</span>
          ) : (product as any).category === "accessory" ? (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1">ACCESSORY</span>
          ) : null}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white text-black text-xs font-bold px-4 py-2 flex items-center gap-2">
            <Eye className="w-4 h-4" /> View Details
          </span>
        </div>
      </Link>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-[10px] font-bold tracking-widest text-zinc-400 mb-1">{product.brand}</div>
        <Link href={`/laptops/${product.id}`} className="hover:text-zinc-600 transition-colors">
          <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
        </Link>
        <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
          {product.processor} • {product.ram} • {product.storage}
          {(product as any).category === "accessory" ? " • Genuine • Wholesale Price" : (product as any).category === "desktop" ? " • With Monitor + Keyboard/Mouse" : ""}
        </p>
        
        <div className="mt-auto pt-3 border-t border-zinc-100 flex items-center justify-between">
          <div>
            <span className="font-bold text-base">₹{Number(product.price).toFixed(0)}</span>
            {product.stockQuantity <= 0 && <span className="ml-2 text-xs text-red-500 font-medium">Out of Stock</span>}
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`https://wa.me/918317399090?text=Hi, I'm interested in ${product.name} - ₹${product.price}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center border border-zinc-200 hover:bg-zinc-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              className="w-8 h-8 bg-black text-white flex items-center justify-center hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}