"use client";

import { useUpdateOrderStatus } from "@/lib/hooks/useOrders";
import type { OrderStatus, OrderStatusUpdate } from "@/types/store";
import { toast } from "sonner";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const VALID_TRANSITIONS: OrderStatusUpdate[] = ["confirmed", "shipped", "delivered", "cancelled"];

const STATUS_LABELS: Record<OrderStatusUpdate, string> = {
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

export function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const { mutateAsync: updateStatus, isPending } = useUpdateOrderStatus();

  const isDisabled = TERMINAL_STATUSES.includes(currentStatus) || isPending;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as OrderStatusUpdate;
    if (newStatus === currentStatus) return;

    if (newStatus === "cancelled") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this order? This will restore stock for all items."
      );
      if (!confirmed) {
        e.target.value = currentStatus;
        return;
      }
    }

    try {
      await updateStatus({ orderId, status: newStatus });
      toast.success(`Order status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
      e.target.value = currentStatus;
    }
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isDisabled}
      aria-label="Order status"
      className="border-input bg-background rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* Show current status even if not in valid transitions */}
      {!VALID_TRANSITIONS.includes(currentStatus as OrderStatusUpdate) && (
        <option value={currentStatus}>{currentStatus}</option>
      )}
      {VALID_TRANSITIONS.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
