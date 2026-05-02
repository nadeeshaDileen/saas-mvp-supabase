"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ImageMeta } from "@/types/store";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES = 8;

interface ImageUploaderProps {
  productId: string | null;
  images: ImageMeta[];
  onChange: (images: ImageMeta[]) => void;
}

export function ImageUploader({ productId, images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    const newImages: ImageMeta[] = [];

    setUploading(true);
    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported type. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name}: exceeds 5 MB limit.`);
        continue;
      }

      const folder = productId ?? "temp";
      const ext = file.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${folder}/${filename}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) {
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      newImages.push({ url: urlData.publicUrl, order: images.length + newImages.length });
    }
    setUploading(false);

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  }

  async function handleDelete(index: number) {
    const img = images[index];
    // Extract storage path from public URL
    const urlParts = img.url.split("/product-images/");
    if (urlParts.length === 2) {
      await supabase.storage.from("product-images").remove([urlParts[1]]);
    }
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));
    onChange(updated);
  }

  function moveImage(index: number, direction: "up" | "down") {
    const newImages = [...images];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newImages.length) return;
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
    onChange(newImages.map((img, i) => ({ ...img, order: i })));
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          images.length >= MAX_IMAGES && "opacity-50 pointer-events-none"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="Upload images"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-muted-foreground">
          {uploading
            ? "Uploading…"
            : images.length >= MAX_IMAGES
            ? `Maximum ${MAX_IMAGES} images reached`
            : "Drag & drop images here, or click to select"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP · max 5 MB each · up to {MAX_IMAGES} images</p>
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={img.url} className="relative group rounded-md overflow-hidden border border-border aspect-square bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 w-6 p-0 text-xs"
                    onClick={(e) => { e.stopPropagation(); moveImage(i, "up"); }}
                    disabled={i === 0}
                    aria-label="Move image left"
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 w-6 p-0 text-xs"
                    onClick={(e) => { e.stopPropagation(); moveImage(i, "down"); }}
                    disabled={i === images.length - 1}
                    aria-label="Move image right"
                  >
                    →
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
                  aria-label="Delete image"
                >
                  Delete
                </Button>
              </div>
              <span className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded px-1">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
