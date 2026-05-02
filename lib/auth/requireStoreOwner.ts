import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Result =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

/**
 * Checks whether the currently authenticated user has the `store_owner` role.
 * Use in Route Handlers and Server Components.
 *
 * @returns `{ authorized: true }` if the user is a store owner,
 *          `{ authorized: false, response }` with a 403 NextResponse otherwise.
 */
export async function requireStoreOwner(
  supabase: SupabaseClient<Database>
): Promise<Result> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: new NextResponse("Unauthorized", { status: 403 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "store_owner") {
    return {
      authorized: false,
      response: new NextResponse("Forbidden", { status: 403 }),
    };
  }

  return { authorized: true };
}
