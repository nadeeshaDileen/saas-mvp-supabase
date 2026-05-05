"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: Array<{ url: string; order: number }>;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/shop/${product.slug}`);
  };

  // Get first image or use placeholder
  const imageUrl = product.images[0]?.url || "/placeholder-product.png";

  return (
    <button
      onClick={handleClick}
      className="group w-full max-w-[200px] overflow-hidden rounded-md border border-gray-200 bg-white text-left transition-all hover:border-black focus:outline-none focus:ring-2 focus:ring-black"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="200px"
        />
      </div>
      <div className="p-3">
        <h4
          className="mb-1 line-clamp-2 text-sm font-medium text-gray-900"
          style={{ minHeight: "2.5rem" }}
        >
          {product.name}
        </h4>
        <p className="text-base font-bold text-black">
          ${product.basePrice.toFixed(2)}
        </p>
      </div>
    </button>
  );
}
