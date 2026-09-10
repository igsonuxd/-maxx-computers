import Link from "next/link";
import { db } from "@/db";
import { products } from "@/db/schema";
import { asc } from "drizzle-orm";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string; brand?: string };

export default async function LaptopsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryFilter = params.category || "all";
  const brandFilter = params.brand || "";

  const allProducts = await db.select().from(products).orderBy(asc(products.id));

  const formatted = allProducts.map((p) => ({
    ...p,
    price: Number(p.price),
    images: (p.images as string[]) || [],
  }));

  const laptops = formatted.filter(
    (p) => (p.category as string) === "laptop" || !(p.category as string)
  );
  const desktops = formatted.filter((p) => (p.category as string) === "desktop");
  const accessories = formatted.filter((p) => (p.category as string) === "accessory");

  const byBrand = (list: typeof formatted) =>
    brandFilter ? list.filter((p) => p.brand === brandFilter) : list;

  const activeCategory = categoryFilter === "all" ? "all" : categoryFilter;

  const tabHref = (cat: string) => {
    if (cat === "all") return brandFilter ? `/laptops?brand=${brandFilter}` : "/laptops";
    return brandFilter
      ? `/laptops?category=${cat}&brand=${brandFilter}`
      : `/laptops?category=${cat}`;
  };

  const tabClass = (active: boolean) =>
    `px-4 py-2 border font-medium ${
      active ? "bg-black text-white border-black" : "bg-white border-zinc-200"
    }`;

  const filtered =
    categoryFilter === "laptop"
      ? byBrand(laptops)
      : categoryFilter === "desktop"
        ? byBrand(desktops)
        : categoryFilter === "accessory"
          ? byBrand(accessories)
          : byBrand(formatted);

  const sectionLaptops = byBrand(laptops);
  const sectionDesktops = byBrand(desktops);
  const sectionAccessories = byBrand(accessories);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-zinc-400 mb-2">
              MAXX COMPUTERS • {brandFilter || "ALL BRANDS"}
            </p>
            <h1 className="text-4xl font-bold tracking-tight">
              {brandFilter ? `${brandFilter} Collection` : "Refurbished Laptops & Computers"}
            </h1>
            <p className="text-zinc-500 mt-2">
              Laptops ({laptops.length}) • Desktops ({desktops.length}) • Accessories (
              {accessories.length}) •{" "}
              {brandFilter ? `Filtered by ${brandFilter}` : "Professionally checked"}
            </p>
          </div>
          <div className="flex gap-2 text-sm flex-wrap">
            <Link href={tabHref("all")} className={tabClass(activeCategory === "all")}>
              ALL ({formatted.length})
            </Link>
            <Link href={tabHref("laptop")} className={tabClass(activeCategory === "laptop")}>
              LAPTOPS ({laptops.length})
            </Link>
            <Link href={tabHref("desktop")} className={tabClass(activeCategory === "desktop")}>
              DESKTOPS ({desktops.length})
            </Link>
            <Link href={tabHref("accessory")} className={tabClass(activeCategory === "accessory")}>
              ACCESSORIES ({accessories.length})
            </Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-zinc-100">No products found.</div>
        ) : activeCategory === "all" ? (
          <>
            {sectionLaptops.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Laptops ({sectionLaptops.length})</h2>
                  <Link href={tabHref("laptop")} className="text-sm font-medium underline">
                    View all Laptops →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {sectionLaptops.slice(0, 8).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
            {sectionDesktops.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Desktops ({sectionDesktops.length})</h2>
                  <Link href={tabHref("desktop")} className="text-sm font-medium underline">
                    View all Desktops →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {sectionDesktops.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
            {sectionAccessories.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Accessories ({sectionAccessories.length})</h2>
                  <Link href={tabHref("accessory")} className="text-sm font-medium underline">
                    View all Accessories →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {sectionAccessories.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
