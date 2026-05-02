import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireStoreOwner } from "@/lib/auth/requireStoreOwner";
import type { OrderStatus } from "@/types/store";

function escapeCsvField(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(",");
}

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const guard = await requireStoreOwner(supabase);
  if (!guard.authorized) {
    return guard.response;
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as OrderStatus | null;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const customerEmail = searchParams.get("customerEmail");

  let query = supabase
    .from("orders")
    .select("id, customer_email, status, total_amount, created_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);
  if (customerEmail) query = query.ilike("customer_email", `%${customerEmail}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = buildCsvRow(["Order ID", "Customer Email", "Status", "Total Amount", "Created Date"]);
  const rows = (data ?? []).map((row) =>
    buildCsvRow([
      row.id,
      row.customer_email,
      row.status,
      ((row.total_amount as number) / 100).toFixed(2),
      new Date(row.created_at as string).toISOString(),
    ])
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="orders.csv"',
    },
  });
}
