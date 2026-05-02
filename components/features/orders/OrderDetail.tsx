import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { OrderStatus, OrderWithItems } from "@/types/store";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-transparent" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-transparent" },
  shipped: { label: "Shipped", className: "bg-purple-100 text-purple-800 border-transparent" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-800 border-transparent" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600 border-transparent" },
  payment_failed: { label: "Payment Failed", className: "bg-red-100 text-red-800 border-transparent" },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

interface OrderDetailProps {
  order: OrderWithItems;
}

export function OrderDetail({ order }: OrderDetailProps) {
  const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-mono text-base">
                Order #{order.id.slice(0, 8)}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Color</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Unit price</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{item.productName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.variantSize}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{item.variantColor}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Total */}
      <div className="flex justify-end">
        <div className="rounded-xl border bg-card px-6 py-4 shadow-sm">
          <div className="flex items-center gap-8">
            <span className="text-sm text-muted-foreground">Order total</span>
            <span className="text-lg font-bold">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
