import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductActions from "./ProductActions";
import ProductGallery from "./ProductGallery";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 16: params is a Promise
  const { id } = await params;

  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    notFound();
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));

  if (!product) {
    notFound();
  }

  const formattedProduct = {
    ...product,
    price: Number(product.price),
    images: (product.images as string[]) || [],
  };

  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* =========================
              IMAGE GALLERY
          ========================== */}
          <div>
            <ProductGallery
              images={formattedProduct.images}
              productName={product.name}
            />
          </div>

          {/* =========================
              PRODUCT DETAILS
          ========================== */}
          <div>
            {/* Brand */}
            <div className="text-sm text-zinc-500 font-bold tracking-wider mb-2">
              {product.brand}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="text-2xl font-black text-black mb-6">
              ₹{formattedProduct.price.toLocaleString("en-IN")}
            </div>

            {/* Description */}
            <p className="text-zinc-600 mb-8 leading-relaxed">
              {product.description ||
                "Premium business laptop, professionally refurbished and rigorously tested to ensure top-notch performance."}
            </p>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm mb-10">

              <div>
                <span className="text-zinc-500 block mb-1">
                  Processor
                </span>
                <span className="font-semibold text-black">
                  {product.processor}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">
                  RAM
                </span>
                <span className="font-semibold text-black">
                  {product.ram}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">
                  Storage
                </span>
                <span className="font-semibold text-black">
                  {product.storage}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">
                  Display
                </span>
                <span className="font-semibold text-black">
                  {product.display}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">
                  Condition
                </span>
                <span className="font-semibold text-black">
                  {product.condition}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">
                  Battery
                </span>
                <span className="font-semibold text-black">
                  {product.batteryCondition}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">
                  Warranty
                </span>
                <span className="font-semibold text-black">
                  {product.warranty || "Not specified"}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1">
                  Stock
                </span>
                <span className="font-semibold text-black">
                  {product.stockQuantity} available
                </span>
              </div>

            </div>

            {/* Cart / Enquiry / Buy Actions */}
            <ProductActions product={formattedProduct} />

          </div>
        </div>
      </div>
    </div>
  );
}