import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { shortCacheOptions } from "@/lib/react-query/query-options";
import type { AuthSession } from "@/types/user";

/**
 * Current auth session — short cache for security
 */
export function useAuthSession() {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: async (): Promise<AuthSession> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { isAuthenticated: false, user: null };

      return {
        isAuthenticated: true,
        user: { id: user.id, email: user.email! },
      };
    },
    ...shortCacheOptions,
  });
}
