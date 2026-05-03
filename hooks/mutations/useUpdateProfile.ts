import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { UpdateProfileInput } from "@/types/user";

/**
 * Update current user's profile with cache invalidation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      input,
    }: {
      userId: string;
      input: UpdateProfileInput;
    }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (input.fullName !== undefined) updateData.full_name = input.fullName;
      if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.shippingAddress !== undefined) updateData.shipping_address = input.shippingAddress;

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}
