import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { longCacheOptions } from "@/lib/react-query/query-options";
import { useAuthSession } from "./useAuth";
import type { UserOrganization } from "@/types/organization";

/**
 * All organizations the current user belongs to
 */
export function useMyOrganizations() {
  const { data: session } = useAuthSession();
  const userId = session?.user?.id ?? null;

  return useQuery({
    queryKey: queryKeys.organizations.my,
    queryFn: async (): Promise<UserOrganization[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("organization_members")
        .select("role, organizations(*)")
        .eq("user_id", userId);

      if (error) throw new Error(error.message);

      return (data ?? []).map((row: Record<string, unknown>) => {
        const org = row.organizations as Record<string, unknown>;
        return {
          id: org.id as string,
          name: org.name as string,
          slug: org.slug as string,
          ownerId: org.owner_id as string,
          plan: org.plan as UserOrganization["plan"],
          createdAt: org.created_at as string,
          updatedAt: org.updated_at as string,
          userRole: row.role as UserOrganization["userRole"],
          isOwner: org.owner_id === userId,
        };
      });
    },
    enabled: !!userId,
    ...longCacheOptions,
  });
}
