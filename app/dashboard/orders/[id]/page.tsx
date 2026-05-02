"use client";

import { use } from "react";
import { useOrder } from "@/lib/hooks/useOrders";
import { OrderStatusSelect } from "@/components/features/dashboard/orders/OrderStatusSelect";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "secondary",
  confirmed: "default",
  shipped: "warning",
  delivered: "success",
  cancelled: "destructive",
  payment_failed: "destructive",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ""}`} />;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-muted-foreground py-16 text-center">Order not found.</div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Order</h1>
          <p className="text-muted-foreground font-mono text-sm">{order.id}</p>
        </div>
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Order meta */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="font-medium">Customer</h2>
          <p className="text-sm">{order.customerEmail}</p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Status:</span>
            <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>{order.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Created: {formatDate(order.createdAt)}
          </p>
          {order.statusUpdatedAt && (
            <p className="text-muted-foreground text-sm">
              Last updated: {formatDate(order.statusUpdatedAt)}
            </p>
          )}
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="font-medium">Payment</h2>
          <p className="text-muted-foreground font-mono text-xs break-all">
            {order.stripePaymentIntent}
          </p>
          <p className="text-sm font-medium">
            Total: ${(order.totalAmount / 100).toFixed(2)}
          </p>
          {addr && (
            <div className="text-sm space-y-0.5">
              <h3 className="font-medium mt-2">Shipping Address</h3>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>
                {addr.city}, {addr.state} {addr.postalCode}
              </p>
              <p>{addr.country}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-medium">Items ({order.items.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Product</th>
              <th className="px-4 py-2 text-left font-medium">Size</th>
              <th className="px-4 py-2 text-left font-medium">Color</th>
              <th className="px-4 py-2 text-right font-medium">Unit Price</th>
              <th className="px-4 py-2 text-right font-medium">Qty</th>
              <th className="px-4 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.productName}</td>
                <td className="px-4 py-3">{item.variantSize}</td>
                <td className="px-4 py-3">{item.variantColor}</td>
                <td className="px-4 py-3 text-right">${(item.unitPrice / 100).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right font-medium">
                  ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
