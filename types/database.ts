/**
 * Supabase database types
 * Run `npx supabase gen types typescript --project-id <id>` to auto-generate
 * and replace this file with the output.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ProductStatus = "draft" | "active" | "archived";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_failed";
export type VariantSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: "customer" | "store_owner";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "customer" | "store_owner";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "customer" | "store_owner";
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          base_price: number;
          category: string;
          status: ProductStatus;
          images: Json;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          base_price: number;
          category: string;
          status?: ProductStatus;
          images?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
          base_price?: number;
          category?: string;
          status?: ProductStatus;
          images?: Json;
          updated_at?: string;
        };
      };
      variants: {
        Row: {
          id: string;
          product_id: string;
          size: VariantSize;
          color: string;
          price_override: number | null;
          stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: VariantSize;
          color: string;
          price_override?: number | null;
          stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          size?: VariantSize;
          color?: string;
          price_override?: number | null;
          stock?: number;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          variant_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          variant_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          quantity?: number;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: OrderStatus;
          total_amount: number;
          stripe_payment_intent: string;
          customer_email: string;
          shipping_address: Json | null;
          status_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: OrderStatus;
          total_amount: number;
          stripe_payment_intent: string;
          customer_email: string;
          shipping_address?: Json | null;
          status_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OrderStatus;
          shipping_address?: Json | null;
          status_updated_at?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          product_name: string;
          variant_size: string;
          variant_color: string;
          unit_price: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id: string;
          product_name: string;
          variant_size: string;
          variant_color: string;
          unit_price: number;
          quantity: number;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          plan: PlanType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          plan?: PlanType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          plan?: PlanType;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          role?: MemberRole;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      plan_type: PlanType;
      member_role: MemberRole;
      product_status: ProductStatus;
      order_status: OrderStatus;
      variant_size: VariantSize;
    };
  };
}

export type PlanType = "free" | "pro" | "enterprise";
export type MemberRole = "owner" | "admin" | "member";
