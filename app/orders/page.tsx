"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/queries/useAuth";
import { OrderList } from "@/components/features/orders/OrderList";

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, isLoading } = useAuthSession();

  useEffect(() => {
    if (!isLoading && !session?.isAuthenticated) {
      router.replace("/auth/login?redirectTo=/orders");
    }
  }, [session, isLoading, router]);

  if (isLoading || !session?.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>
      <OrderList />
    </main>
  );
}
