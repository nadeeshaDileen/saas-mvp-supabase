"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "./ImageUploader";
import { useCreateProduct } from "@/lib/hooks/useProductMutations";
import { useUpdateProduct } from "@/lib/hooks/useProductMutations";
import type {
  ProductWithVariants,
  ProductFormValues,
  VariantFormRow,
  ImageMeta,
  VariantSize,
  ProductStatus,
} from "@/types/store";

const CATEGORIES = ["TOPS", "BOTTOMS", "DRESSES", "OUTERWEAR", "ACCESSORIES", "FOOTWEAR", "OTHER"];
const SIZES: VariantSize[] = ["XS", "S", "M", "L", "XL", "XXL"];
const STATUSES: ProductStatus[] = ["draft", "active", "archived"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function emptyVariant(): VariantFormRow {
  return { size: "M", color: "", stock: 0 };
}

interface ProductFormProps {
  product?: ProductWithVariants;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugManual, setSlugManual] = useState(isEdit);
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0]);
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "draft");
  const [images, setImages] = useState<ImageMeta[]>(product?.images ?? []);
  const [variants, setVariants] = useState<VariantFormRow[]>(
    product?.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock,
      priceOverride: v.priceOverride ?? undefined,
    })) ?? [emptyVariant()]
  );
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isPending = createProduct.isPending || updateProduct.isPending;

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManual(true);
    setSlug(value);
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariant(index: number) {
    const v = variants[index];
    if (v.id) {
      setDeletedVariantIds((prev) => [...prev, v.id!]);
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, patch: Partial<VariantFormRow>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const price = parseFloat(basePrice);
    if (!name.trim()) return toast.error("Name is required.");
    if (!slug.trim()) return toast.error("Slug is required.");
    if (!description.trim()) return toast.error("Description is required.");
    if (isNaN(price) || price <= 0) return toast.error("Base price must be a positive number.");

    const values: ProductFormValues = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      basePrice: price,
      category,
      status,
      images,
      variants,
    };

    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id: product.id, values, deletedVariantIds });
        toast.success("Product updated.");
      } else {
        await createProduct.mutateAsync(values);
        toast.success("Product created.");
      }
      onSuccess?.();
    } catch (err) {
      toast.error((err as Error).message ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={120}
              required
              placeholder="e.g. Classic White Tee"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="classic-white-tee"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              required
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="Describe the product…"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="basePrice">Base Price ($)</Label>
              <Input
                id="basePrice"
                type="number"
                min="0.01"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                placeholder="29.99"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            productId={product?.id ?? null}
            images={images}
            onChange={setImages}
          />
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Variants</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            + Add Variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {variants.length === 0 && (
            <p className="text-sm text-muted-foreground">No variants yet. Add at least one.</p>
          )}
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <select
                  value={v.size}
                  onChange={(e) => updateVariant(i, { size: e.target.value as VariantSize })}
                  className="border-input bg-background flex h-9 w-full rounded-md border px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <Input
                  value={v.color}
                  onChange={(e) => updateVariant(i, { color: e.target.value })}
                  placeholder="e.g. White"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, { stock: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Price Override ($)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={v.priceOverride ?? ""}
                  onChange={(e) =>
                    updateVariant(i, {
                      priceOverride: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional"
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeVariant(i)}
                aria-label="Remove variant"
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
