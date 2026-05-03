"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import type { ShippingAddress } from "@/types/user";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Inner form (needs to be inside <Elements>) ───────────────────────────────

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/success`,
      },
    });

    // confirmPayment only returns here on error (success redirects away)
    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
    }

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={!stripe || isSubmitting} className="w-full" size="lg">
        {isSubmitting ? "Processing…" : "Pay now"}
      </Button>
    </form>
  );
}

// ─── Outer wrapper — fetches clientSecret, mounts Elements ───────────────────

interface CheckoutFormProps {
  shippingData: {
    fullName: string;
    phone: string;
    shippingAddress: ShippingAddress;
  };
}

export function CheckoutForm({ shippingData }: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function createIntent() {
      try {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shippingData }),
        });

        if (res.status === 409) {
          const body = await res.json();
          setOutOfStockItems(body.outOfStockItems ?? []);
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setFetchError(body.error ?? "Failed to initialize checkout.");
          return;
        }

        const { clientSecret: secret } = await res.json();
        setClientSecret(secret);
      } catch {
        setFetchError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    createIntent();
  }, [shippingData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (outOfStockItems.length > 0) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-destructive">Items out of stock</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          The following items are no longer available in the requested quantity:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-1 text-sm">
          {outOfStockItems.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm">
          Please update your cart and try again.
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-destructive">{fetchError}</p>
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold">Payment details</h2>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm />
      </Elements>
    </div>
  );
}
