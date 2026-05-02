import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/store";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-transparent" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-transparent" },
  shipped: { label: "Shipped", className: "bg-purple-100 text-purple-800 border-transparent" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-800 border-transparent" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600 border-transparent" },
  payment_failed: { label: "Payment Failed", className: "bg-red-100 text-red-800 border-transparent" },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;

  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-medium text-foreground">
              #{order.id.slice(0, 8)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
          </div>

          <Badge className={statusConfig.className}>
            {statusConfig.label}
          </Badge>

          <p className="shrink-0 font-semibold">
            {formatCurrency(order.totalAmount)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
