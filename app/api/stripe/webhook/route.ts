import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

// Disable Next.js body parsing — Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // ── payment_intent.succeeded ──────────────────────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const paymentIntentId = pi.id;
    const amountTotal = pi.amount / 100; // convert cents → dollars
    const userId = pi.metadata?.userId;
    const customerEmail = pi.metadata?.customerEmail ?? "";
    const customerName = pi.metadata?.customerName ?? "";
    const customerPhone = pi.metadata?.customerPhone ?? "";
    
    // Parse shipping address from metadata
    let shippingAddress = null;
    if (pi.metadata?.shippingAddress) {
      try {
        shippingAddress = JSON.parse(pi.metadata.shippingAddress);
      } catch (e) {
        console.error("Failed to parse shipping address", e);
      }
    }

    if (!userId) {
      console.error("Webhook: payment_intent.succeeded missing userId in metadata", paymentIntentId);
      return NextResponse.json({ received: true });
    }

    // Idempotency guard — check if order already exists
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_payment_intent", paymentIntentId)
      .maybeSingle();

    if (existingOrder) {
      // Already processed — return 200 immediately
      return NextResponse.json({ received: true });
    }

    // Fetch cart items for the user
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        quantity,
        variant:variants(
          id,
          stock,
          price_override,
          size,
          color,
          product:products(id, name, base_price)
        )
      `
      )
      .eq("user_id", userId);

    if (cartError || !cartItems || cartItems.length === 0) {
      console.error("Webhook: failed to fetch cart items for user", userId, cartError);
      return NextResponse.json({ received: true });
    }

    // Create order record with shipping info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "confirmed",
        total_amount: amountTotal,
        stripe_payment_intent: paymentIntentId,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        status_updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Webhook: failed to create order", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Insert order_items and decrement stock
    for (const item of cartItems) {
      const variant = item.variant as {
        id: string;
        stock: number;
        price_override: number | null;
        size: string;
        color: string;
        product: { id: string; name: string; base_price: number } | null;
      } | null;

      if (!variant) continue;

      const effectivePrice = variant.price_override ?? variant.product?.base_price ?? 0;

      // Insert order item (denormalized)
      await supabase.from("order_items").insert({
        order_id: order.id,
        variant_id: variant.id,
        product_name: variant.product?.name ?? "Unknown",
        variant_size: variant.size,
        variant_color: variant.color,
        unit_price: effectivePrice,
        quantity: item.quantity,
      });

      // Atomic stock decrement — only if sufficient stock remains
      const { data: decremented } = await supabase
        .from("variants")
        .update({ stock: variant.stock - item.quantity })
        .eq("id", variant.id)
        .gte("stock", item.quantity)
        .select("id");

      if (!decremented || decremented.length === 0) {
        // Stock was insufficient — log warning but don't fail
        // (stock was validated at payment intent creation; race condition edge case)
        console.warn(
          `Webhook: insufficient stock for variant ${variant.id} (needed ${item.quantity}, had ${variant.stock})`
        );
      }
    }

    // Clear cart for the user
    await supabase.from("cart_items").delete().eq("user_id", userId);
  }

  // ── payment_intent.payment_failed ─────────────────────────────────────────
  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_payment_intent", pi.id)
      .maybeSingle();

    if (existingOrder) {
      await supabase
        .from("orders")
        .update({ status: "payment_failed", status_updated_at: new Date().toISOString() })
        .eq("id", existingOrder.id);
    }
  }

  return NextResponse.json({ received: true });
}
