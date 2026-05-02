"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAdminProducts } from "@/lib/hooks/useProducts";
import { useDeleteProduct, useToggleProductStatus } from "@/lib/hooks/useProductMutations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { ProductWithVariants } from "@/types/store";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProductWithVariants["status"] }) {
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "archived") return <Badge variant="secondary">Archived</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

// ─── Stock helpers ────────────────────────────────────────────────────────────

function stockSummary(product: ProductWithVariants): string {
  const total = product.variants.reduce((sum, v) => sum + v.stock, 0);
  return `${total} units`;
}

function hasOutOfStock(product: ProductWithVariants): boolean {
  return product.variants.some((v) => v.stock === 0);
}

function hasLowStock(product: ProductWithVariants): boolean {
  return product.variants.some((v) => v.stock >= 1 && v.stock <= 5);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

interface DeleteDialogProps {
  product: ProductWithVariants;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteDialog({ product, onConfirm, onCancel, isPending }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-xl p-6 shadow-lg max-w-sm w-full space-y-4">
        <h3 className="font-semibold text-base">Delete &ldquo;{product.name}&rdquo;?</h3>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. Products with existing orders cannot be deleted.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductTable() {
  const { data: products, isLoading, error } = useAdminProducts();
  const deleteProduct = useDeleteProduct();
  const toggleStatus = useToggleProductStatus();

  const [confirmDelete, setConfirmDelete] = useState<ProductWithVariants | null>(null);

  async function handleDelete(product: ProductWithVariants) {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success(`"${product.name}" deleted.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleToggle(product: ProductWithVariants) {
    try {
      await toggleStatus.mutateAsync(product);
      const next = product.status === "active" ? "archived" : "activated";
      toast.success(`"${product.name}" ${next}.`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load products: {(error as Error).message}
      </div>
    );
  }

  return (
    <>
      {confirmDelete && (
        <DeleteDialog
          product={confirmDelete}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          isPending={deleteProduct.isPending}
        />
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Image</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Variants</th>
              <th className="px-4 py-3 text-left font-medium">Stock</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && (!products || products.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No products yet.{" "}
                  <Link href="/dashboard/products/new" className="text-primary underline">
                    Create your first product
                  </Link>
                </td>
              </tr>
            )}

            {products?.map((product) => {
              const thumb = product.images[0]?.url;
              const outOfStock = hasOutOfStock(product);
              const lowStock = !outOfStock && hasLowStock(product);

              return (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={product.name}
                        className="h-10 w-10 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                        —
                      </div>
                    )}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 font-medium">{product.name}</td>

                  {/* Category */}
                  <td className="px-4 py-3 text-muted-foreground">{product.category}</td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={product.status} />
                  </td>

                  {/* Variant count */}
                  <td className="px-4 py-3 text-muted-foreground">{product.variants.length}</td>

                  {/* Stock summary */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{stockSummary(product)}</span>
                      {outOfStock && <Badge variant="destructive">Out of stock</Badge>}
                      {lowStock && <Badge variant="warning">Low stock</Badge>}
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(product.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/products/${product.id}`}>Edit</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(product)}
                        disabled={toggleStatus.isPending}
                      >
                        {product.status === "active" ? "Archive" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDelete(product)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
