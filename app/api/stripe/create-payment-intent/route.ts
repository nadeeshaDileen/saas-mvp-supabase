import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST() {
  const supabase = await getSupabaseServerClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch cart items with variant and product info
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
    .eq("user_id", user.id);

  if (cartError) {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Validate stock for all items
  const outOfStockItems: string[] = [];

  for (const item of cartItems) {
    const variant = item.variant as {
      id: string;
      stock: number;
      price_override: number | null;
      size: string;
      color: string;
      product: { id: string; name: string; base_price: number } | null;
    } | null;

    if (!variant || variant.stock < item.quantity) {
      const productName = variant?.product?.name ?? "Unknown item";
      outOfStockItems.push(`${productName} (${variant?.size ?? ""} / ${variant?.color ?? ""})`);
    }
  }

  if (outOfStockItems.length > 0) {
    return NextResponse.json({ outOfStockItems }, { status: 409 });
  }

  // Calculate total server-side
  let totalCents = 0;
  for (const item of cartItems) {
    const variant = item.variant as {
      price_override: number | null;
      product: { base_price: number } | null;
    } | null;

    const effectivePrice = variant?.price_override ?? variant?.product?.base_price ?? 0;
    totalCents += effectivePrice * item.quantity;
  }

  // Convert to cents
  const amountInCents = Math.round(totalCents * 100);

  if (amountInCents <= 0) {
    return NextResponse.json({ error: "Invalid cart total" }, { status: 400 });
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: {
      userId: user.id,
      customerEmail: user.email ?? "",
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
