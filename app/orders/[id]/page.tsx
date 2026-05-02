"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { useOrder } from "@/lib/hooks/useOrders";
import { OrderDetail } from "@/components/features/orders/OrderDetail";
import { Card, CardContent } from "@/components/ui/card";

function SkeletonDetail() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 h-7 w-32 animate-pulse rounded bg-muted" />
        <SkeletonDetail />
      </main>
    );
  }

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Order Details</h1>
      <OrderDetail order={order} />
    </main>
  );
}
