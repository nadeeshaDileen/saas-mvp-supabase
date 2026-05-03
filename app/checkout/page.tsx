"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/hooks/useCart";
import { useAuthSession } from "@/hooks/queries/useAuth";
import { useCurrentProfile } from "@/hooks/queries/useProfile";
import { useUpdateProfile } from "@/hooks/mutations/useUpdateProfile";
import { ShippingForm } from "@/components/features/checkout/ShippingForm";
import { CheckoutForm } from "@/components/features/checkout/CheckoutForm";
import { OrderSummary } from "@/components/features/checkout/OrderSummary";
import type { ShippingAddress } from "@/types/user";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useAuthSession();
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: cartItems = [] } = useCart();
  const updateProfile = useUpdateProfile();

  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [shippingData, setShippingData] = useState<{
    fullName: string;
    phone: string;
    shippingAddress: ShippingAddress;
  } | null>(null);

  useEffect(() => {
    if (!sessionLoading && !session?.isAuthenticated) {
      router.replace("/auth/login?redirectTo=/checkout");
    }
  }, [session, sessionLoading, router]);

  // Auto-advance to payment if profile already has shipping info
  useEffect(() => {
    if (profile && profile.fullName && profile.phone && profile.shippingAddress) {
      setShippingData({
        fullName: profile.fullName,
        phone: profile.phone,
        shippingAddress: profile.shippingAddress,
      });
      setStep("payment");
    }
  }, [profile]);

  if (sessionLoading || profileLoading || !session?.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  async function handleShippingSubmit(data: {
    fullName: string;
    phone: string;
    shippingAddress: ShippingAddress;
  }) {
    if (!profile) return;

    try {
      await updateProfile.mutateAsync({
        userId: profile.userId,
        input: {
          fullName: data.fullName,
          phone: data.phone,
          shippingAddress: data.shippingAddress,
        },
      });

      setShippingData(data);
      setStep("payment");
      toast.success("Shipping information saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save shipping info");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Checkout</h1>
      
      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === "shipping"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          1
        </div>
        <span className={step === "shipping" ? "font-medium" : "text-muted-foreground"}>
          Shipping
        </span>
        <div className="bg-border h-px flex-1" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === "payment"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
        <span className={step === "payment" ? "font-medium" : "text-muted-foreground"}>
          Payment
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Left column - Form */}
        <div className="order-2 lg:order-1">
          {step === "shipping" && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold">Shipping Information</h2>
              <ShippingForm
                initialData={{
                  fullName: profile?.fullName ?? undefined,
                  phone: profile?.phone ?? undefined,
                  shippingAddress: profile?.shippingAddress,
                }}
                onSubmit={handleShippingSubmit}
                isSubmitting={updateProfile.isPending}
              />
            </div>
          )}

          {step === "payment" && shippingData && (
            <>
              {/* Shipping summary */}
              <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">Shipping to:</h3>
                  <button
                    onClick={() => setStep("shipping")}
                    className="text-primary text-sm hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm">{shippingData.fullName}</p>
                <p className="text-sm">{shippingData.phone}</p>
                <p className="text-muted-foreground text-sm">
                  {shippingData.shippingAddress.line1}
                  {shippingData.shippingAddress.line2 && `, ${shippingData.shippingAddress.line2}`}
                </p>
                <p className="text-muted-foreground text-sm">
                  {shippingData.shippingAddress.city}, {shippingData.shippingAddress.state}{" "}
                  {shippingData.shippingAddress.postalCode}
                </p>
                <p className="text-muted-foreground text-sm">
                  {shippingData.shippingAddress.country}
                </p>
              </div>

              <CheckoutForm shippingData={shippingData} />
            </>
          )}
        </div>

        {/* Right column - Order summary */}
        <div className="order-1 lg:order-2">
          <OrderSummary items={cartItems} />
        </div>
      </div>
    </main>
  );
}
