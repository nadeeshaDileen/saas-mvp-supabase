"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminOrders } from "@/lib/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { OrderFilters, OrderStatus } from "@/types/store";

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "payment_failed", label: "Payment Failed" },
];

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "secondary",
  confirmed: "default",
  shipped: "warning",
  delivered: "success",
  cancelled: "destructive",
  payment_failed: "destructive",
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="bg-muted h-4 rounded" />
        </td>
      ))}
    </tr>
  );
}

interface OrdersTableProps {
  onFiltersChange?: (filters: OrderFilters) => void;
}

export function OrdersTable({ onFiltersChange }: OrdersTableProps) {
  const [filters, setFilters] = useState<OrderFilters>({ page: 1 });

  function updateFilters(patch: Partial<OrderFilters>) {
    const next = { ...filters, ...patch, page: 1 };
    setFilters(next);
    onFiltersChange?.(next);
  }

  const { data, isLoading } = useAdminOrders(filters);
  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const page = filters.page ?? 1;
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.status ?? ""}
          onChange={(e) =>
            updateFilters({ status: (e.target.value as OrderStatus) || undefined })
          }
          className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => updateFilters({ dateFrom: e.target.value || undefined })}
          className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          aria-label="Date from"
        />

        <input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => updateFilters({ dateTo: e.target.value || undefined })}
          className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          aria-label="Date to"
        />

        <input
          type="text"
          placeholder="Customer email"
          value={filters.customerEmail ?? ""}
          onChange={(e) => updateFilters({ customerEmail: e.target.value || undefined })}
          className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          aria-label="Filter by customer email"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Order ID</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-primary font-mono text-xs hover:underline"
                      >
                        {order.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{order.customerEmail}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${(order.totalAmount / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {total} order{total !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
          >
            Previous
          </Button>
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
