"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/features/shop/ProductDetail";
import { useProduct } from "@/lib/hooks/useProducts";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 animate-pulse">
      {/* Image skeleton */}
      <div className="flex flex-col gap-3">
        <div className="aspect-3/4 rounded-xl bg-muted" />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-16 rounded-md bg-muted" />
          ))}
        </div>
      </div>
      {/* Info skeleton */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="h-8 w-3/4 rounded bg-muted" />
        <div className="h-7 w-24 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/6 rounded bg-muted" />
        </div>
        <div className="h-10 w-full rounded-md bg-muted mt-4" />
      </div>
    </div>
  );
}

function ProductPageContent({ slug }: { slug: string }) {
  const { data: product, isLoading } = useProduct(slug);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = React.use(params);

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductPageContent slug={resolvedParams.slug} />
    </div>
  );
}
