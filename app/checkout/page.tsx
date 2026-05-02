"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { useAuthSession } from "@/hooks/queries/useAuth";
import { CheckoutForm } from "@/components/features/checkout/CheckoutForm";
import { OrderSummary } from "@/components/features/checkout/OrderSummary";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useAuthSession();
  const { data: cartItems = [] } = useCart();

  useEffect(() => {
    if (!sessionLoading && !session?.isAuthenticated) {
      router.replace("/auth/login?redirectTo=/checkout");
    }
  }, [session, sessionLoading, router]);

  if (sessionLoading || !session?.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Payment form — left on desktop, bottom on mobile */}
        <div className="order-2 lg:order-1">
          <CheckoutForm />
        </div>

        {/* Order summary — right on desktop, top on mobile */}
        <div className="order-1 lg:order-2">
          <OrderSummary items={cartItems} />
        </div>
      </div>
    </main>
  );
}
