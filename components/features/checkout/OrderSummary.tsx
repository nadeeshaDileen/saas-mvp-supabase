import type { CartItem } from "@/types/store";

interface OrderSummaryProps {
  items: CartItem[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents);
}

export function OrderSummary({ items }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => {
    const effectivePrice =
      item.variant?.priceOverride ?? item.variant?.product?.basePrice ?? 0;
    return sum + effectivePrice * item.quantity;
  }, 0);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => {
            const effectivePrice =
              item.variant?.priceOverride ?? item.variant?.product?.basePrice ?? 0;
            const lineTotal = effectivePrice * item.quantity;
            const productName = item.variant?.product?.name ?? "Product";
            const size = item.variant?.size ?? "";
            const color = item.variant?.color ?? "";

            return (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{productName}</p>
                  <p className="text-muted-foreground text-xs">
                    {size} / {color} &times; {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium">{formatPrice(lineTotal)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="font-semibold">Subtotal</span>
        <span className="font-semibold">{formatPrice(subtotal)}</span>
      </div>
    </div>
  );
}
