import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { longCacheOptions } from "@/lib/react-query/query-options";
import { useAuthSession } from "./useAuth";
import type { Profile } from "@/types/user";

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    email: row.email as string,
    fullName: row.full_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    bio: row.bio as string | null,
    phone: row.phone as string | null,
    shippingAddress: row.shipping_address as Profile["shippingAddress"],
    role: row.role as "customer" | "store_owner",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Current user's profile
 */
export function useCurrentProfile() {
  const { data: session } = useAuthSession();
  const userId = session?.user?.id ?? null;

  return useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw new Error(error.message);
      return data ? mapProfile(data as Record<string, unknown>) : null;
    },
    enabled: !!userId,
    ...longCacheOptions,
  });
}
