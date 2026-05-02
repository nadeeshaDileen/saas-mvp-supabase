import Link from "next/link";
import { ProductTable } from "@/components/features/dashboard/products/ProductTable";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your store&apos;s product catalog.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">+ New Product</Link>
        </Button>
      </div>
      <ProductTable />
    </div>
  );
}
