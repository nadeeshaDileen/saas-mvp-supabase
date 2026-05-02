# Product Images Guide

## Overview

Product images are stored in **Supabase Storage** in a public bucket called `product-images`. The system supports up to 8 images per product with drag-and-drop upload, reordering, and deletion.

## Storage Configuration

- **Bucket**: `product-images` (public)
- **Max file size**: 5 MB per image
- **Allowed formats**: JPEG, PNG, WebP
- **Max images per product**: 8
- **Access**: Public read, store owner write/delete

## Image Upload Flow

1. Images are uploaded to Supabase Storage at path: `{productId}/{timestamp}-{random}.{ext}`
2. For new products (not yet saved), images go to `temp/` folder
3. Public URLs are generated and stored in product's `images` JSON field
4. Images are displayed in order based on `order` field

## Using the Image Uploader

### In Product Form

The `ImageUploader` component is integrated into the product form:

```tsx
<ImageUploader
  productId={product?.id ?? null}
  images={images}
  onChange={setImages}
/>
```

### Features

- **Drag & Drop**: Drag images directly into the upload area
- **Click to Browse**: Click the upload area to select files
- **Multiple Upload**: Select multiple images at once
- **Reorder**: Use ← → arrows to change image order
- **Delete**: Hover over image and click "Delete" button
- **Preview**: Thumbnails show in 4-column grid
- **Validation**: Automatic file type and size validation

## Image Storage Structure

```
product-images/
├── {product-id-1}/
│   ├── 1234567890-abc123.jpg
│   ├── 1234567891-def456.png
│   └── ...
├── {product-id-2}/
│   └── ...
└── temp/
    └── (temporary uploads for unsaved products)
```

## Image Data Format

Images are stored in the product's `images` field as JSON:

```json
[
  {
    "url": "https://xxx.supabase.co/storage/v1/object/public/product-images/...",
    "order": 0
  },
  {
    "url": "https://xxx.supabase.co/storage/v1/object/public/product-images/...",
    "order": 1
  }
]
```

## Security (RLS Policies)

- **Public Read**: Anyone can view product images
- **Store Owner Upload**: Only users with `role = 'store_owner'` can upload
- **Store Owner Delete**: Only users with `role = 'store_owner'` can delete

## Troubleshooting

### Images not uploading?

1. Check Supabase Storage bucket exists: `product-images`
2. Verify RLS policies are applied (migration `008_storage_bucket.sql`)
3. Ensure user has `store_owner` role in profiles table
4. Check browser console for errors

### Images not displaying?

1. Verify bucket is set to **public**
2. Check image URLs are valid
3. Ensure CORS is configured in Supabase (usually automatic)

### File size errors?

- Maximum file size is 5 MB per image
- Compress images before uploading if needed
- Use JPEG for photos, PNG for graphics with transparency

## Best Practices

1. **First image is primary**: The first image (order: 0) is used as the main product image
2. **Optimize images**: Compress images before upload to improve load times
3. **Use descriptive filenames**: Helps with organization (though system renames on upload)
4. **WebP format**: Best compression and quality balance
5. **Consistent aspect ratio**: Use similar aspect ratios for all product images
6. **High quality**: Use at least 1000px width for product images
