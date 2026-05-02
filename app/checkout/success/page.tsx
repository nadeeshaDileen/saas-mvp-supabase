"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent");
  const queryClient = useQueryClient();

  // Invalidate cart so it reflects the cleared state after order creation
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
  }, [queryClient]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Order confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. We&apos;ll send you a confirmation email shortly.
          </p>
        </div>

        {paymentIntentId && (
          <p className="text-muted-foreground rounded-md bg-muted px-4 py-2 font-mono text-xs">
            Payment ID: {paymentIntentId}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/orders">View my orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
