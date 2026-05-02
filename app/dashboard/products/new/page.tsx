"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/features/dashboard/products/ProductForm";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Product</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new product to your catalog.</p>
      </div>
      <ProductForm onSuccess={() => router.push("/dashboard/products")} />
    </div>
  );
}
