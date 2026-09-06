import { db } from "@/db";
import { products } from "@/db/schema";
import ProductCard from "@/components/ProductCard";

export default async function LaptopsPage() {
  const allProducts = await db.select().from(products);

  const formattedProducts = allProducts.map((product) => ({
    ...product,
    price: Number(product.price),
    images: (product.images as string[]) || [],
  }));

  return (
    <main className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-semibold tracking-widest text-zinc-500 mb-3">
            MAXX COMPUTERS
          </p>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
            Refurbished Laptops & Computers
          </h1>

          <p className="mt-4 text-zinc-500 max-w-2xl">
            Professionally checked laptops and computers from Dell, HP,
            Lenovo and other leading brands.
          </p>
        </div>

        {/* Products */}
        {formattedProducts.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold text-black">
              No products available
            </h2>

            <p className="mt-2 text-zinc-500">
              Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {formattedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}