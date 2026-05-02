/**
 * Application-level domain types for the Falcky clothing store marketplace.
 * These are camelCase models derived from the snake_case DB Row types.
 */

export type { ProductStatus, OrderStatus, VariantSize } from "./database";
import type { ProductStatus, OrderStatus, VariantSize } from "./database";

// ─── Image ───────────────────────────────────────────────────────────────────

export interface ImageMeta {
  url: string;
  order: number;
}

// ─── Product & Variant ───────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  category: string;
  status: ProductStatus;
  images: ImageMeta[];
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: string;
  productId: string;
  size: VariantSize;
  color: string;
  priceOverride: number | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithVariants extends Product {
  variants: Variant[];
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  userId: string;
  variantId: string;
  quantity: number;
  variant?: Variant & { product?: Product };
  createdAt: string;
  updatedAt: string;
}

/** Guest (unauthenticated) cart item stored in localStorage */
export interface GuestCartItem {
  variantId: string;
  quantity: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  stripePaymentIntent: string;
  customerEmail: string;
  shippingAddress: ShippingAddress | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantSize: string;
  variantColor: string;
  unitPrice: number;
  quantity: number;
  createdAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface CatalogFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: VariantSize[];
  page?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  customerEmail?: string;
  page?: number;
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface VariantFormRow {
  id?: string;
  size: VariantSize;
  color: string;
  stock: number;
  priceOverride?: number;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  category: string;
  status: ProductStatus;
  images: ImageMeta[];
  variants: VariantFormRow[];
}

export type OrderStatusUpdate = "confirmed" | "shipped" | "delivered" | "cancelled";
