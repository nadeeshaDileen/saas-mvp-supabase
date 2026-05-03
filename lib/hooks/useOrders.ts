import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { longCacheOptions } from "@/lib/react-query/query-options";
import type { Order, OrderFilters, OrderItem, OrderStatusUpdate, OrderWithItems } from "@/types/store";

const CUSTOMER_PAGE_SIZE = 20;
const ADMIN_PAGE_SIZE = 50;

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    status: row.status as Order["status"],
    totalAmount: row.total_amount as number,
    stripePaymentIntent: row.stripe_payment_intent as string,
    customerEmail: row.customer_email as string,
    customerName: (row.customer_name as string) ?? null,
    customerPhone: (row.customer_phone as string) ?? null,
    shippingAddress: (row.shipping_address as Order["shippingAddress"]) ?? null,
    statusUpdatedAt: (row.status_updated_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    variantId: row.variant_id as string,
    productName: row.product_name as string,
    variantSize: row.variant_size as string,
    variantColor: row.variant_color as string,
    unitPrice: row.unit_price as number,
    quantity: row.quantity as number,
    createdAt: row.created_at as string,
  };
}

/**
 * Current customer's order history (paginated, 20/page)
 */
export function useMyOrders(page = 1) {
  const from = (page - 1) * CUSTOMER_PAGE_SIZE;
  const to = from + CUSTOMER_PAGE_SIZE - 1;

  return useQuery({
    queryKey: [...queryKeys.orders.mine, page],
    queryFn: async (): Promise<{ orders: Order[]; total: number }> => {
      const { data, error, count } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        orders: (data ?? []).map((r) => mapOrder(r as Record<string, unknown>)),
        total: count ?? 0,
      };
    },
    ...longCacheOptions,
  });
}

/**
 * Single order with items
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async (): Promise<OrderWithItems | null> => {
      const { data: orderData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      return {
        ...mapOrder(orderData as Record<string, unknown>),
        items: (itemsData ?? []).map((r) => mapOrderItem(r as Record<string, unknown>)),
      };
    },
    enabled: !!id,
    ...longCacheOptions,
  });
}

/**
 * Admin: all orders with filters (paginated, 50/page)
 */
export function useAdminOrders(filters: OrderFilters = {}) {
  const { status, dateFrom, dateTo, customerEmail, page = 1 } = filters;
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  return useQuery({
    queryKey: queryKeys.orders.adminList(filters as Record<string, unknown>),
    queryFn: async (): Promise<{ orders: Order[]; total: number }> => {
      let query = supabase
        .from("orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (status) query = query.eq("status", status);
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
      if (customerEmail) query = query.ilike("customer_email", `%${customerEmail}%`);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);

      return {
        orders: (data ?? []).map((r) => mapOrder(r as Record<string, unknown>)),
        total: count ?? 0,
      };
    },
    ...longCacheOptions,
  });
}

/**
 * Update order status — uses cancel_order RPC for cancellations
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatusUpdate }) => {
      if (status === "cancelled") {
        const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("orders")
          .update({ status, status_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", orderId);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
}
