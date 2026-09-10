"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/store";

export default function LaptopsPage() {
  const searchParams = useSearchParams();
  const brandFilter = searchParams.get("brand");
  const categoryFilter = searchParams.get("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const laptops = products.filter((p) => (p as any).category === "laptop" || !(p as any).category);
  const desktops = products.filter((p) => (p as any).category === "desktop");
  const accessories = products.filter((p) => (p as any).category === "accessory");

  const getFiltered = () => {
    if (categoryFilter === "laptop") return laptops.filter((p) => !brandFilter || p.brand === brandFilter);
    if (categoryFilter === "desktop") return desktops.filter((p) => !brandFilter || p.brand === brandFilter);
    if (categoryFilter === "accessory") return accessories.filter((p) => !brandFilter || p.brand === brandFilter);
    if (brandFilter) return products.filter((p) => p.brand === brandFilter);
    return products;
  };

  const filtered = getFiltered();
  const activeCategory = categoryFilter || "all";

  const getTabHref = (cat: string) => {
    if (cat === "all") return brandFilter ? `/laptops?brand=${brandFilter}` : "/laptops";
    return brandFilter ? `/laptops?category=${cat}&brand=${brandFilter}` : `/laptops?category=${cat}`;
  };

  if (loading) return <div className="pt-32 text-center">Loading...</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-zinc-400 mb-2">MAXX COMPUTERS • {brandFilter || "ALL BRANDS"}</p>
            <h1 className="text-4xl font-bold tracking-tight">
              {brandFilter ? `${brandFilter} Collection` : "Refurbished Laptops & Computers"}
            </h1>
            <p className="text-zinc-500 mt-2">Laptops ({laptops.length}) • Desktops ({desktops.length}) • Accessories ({accessories.length}) • {brandFilter ? `Filtered by ${brandFilter}` : "Professionally checked"}</p>
          </div>
          <div className="flex gap-2 text-sm">
            <Link href={getTabHref("all")} className={`px-4 py-2 border font-medium ${activeCategory === "all" ? "bg-black text-white border-black" : "bg-white border-zinc-200"}`}>ALL ({products.length})</Link>
            <Link href={getTabHref("laptop")} className={`px-4 py-2 border font-medium ${activeCategory === "laptop" ? "bg-black text-white border-black" : "bg-white border-zinc-200"}`}>LAPTOPS ({laptops.length})</Link>
            <Link href={getTabHref("desktop")} className={`px-4 py-2 border font-medium ${activeCategory === "desktop" ? "bg-black text-white border-black" : "bg-white border-zinc-200"}`}>DESKTOPS ({desktops.length})</Link>
            <Link href={getTabHref("accessory")} className={`px-4 py-2 border font-medium ${activeCategory === "accessory" ? "bg-black text-white border-black" : "bg-white border-zinc-200"}`}>ACCESSORIES ({accessories.length})</Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-zinc-100">No products found.</div>
        ) : activeCategory === "all" ? (
          <>
            {laptops.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Laptops ({laptops.filter(p => !brandFilter || p.brand===brandFilter).length})</h2>
                  <Link href={getTabHref("laptop")} className="text-sm font-medium underline">View all Laptops →</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {laptops.filter(p => !brandFilter || p.brand===brandFilter).slice(0,8).map((product) => (<ProductCard key={product.id} product={product} />))}
                </div>
              </>
            )}
            {desktops.filter(p => !brandFilter || p.brand===brandFilter).length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Desktops ({desktops.filter(p => !brandFilter || p.brand===brandFilter).length})</h2>
                  <Link href={getTabHref("desktop")} className="text-sm font-medium underline">View all Desktops →</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {desktops.filter(p => !brandFilter || p.brand===brandFilter).map((product) => (<ProductCard key={product.id} product={product} />))}
                </div>
              </>
            )}
            {accessories.filter(p => !brandFilter || p.brand===brandFilter).length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Accessories ({accessories.filter(p => !brandFilter || p.brand===brandFilter).length})</h2>
                  <Link href={getTabHref("accessory")} className="text-sm font-medium underline">View all Accessories →</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {accessories.filter(p => !brandFilter || p.brand===brandFilter).map((product) => (<ProductCard key={product.id} product={product} />))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (<ProductCard key={product.id} product={product} />))}
          </div>
        )}
      </div>
    </div>
  );
}