"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/react-query/query-client";
import { supabase } from "@/lib/supabase/client";
import { useMergeGuestCart } from "@/lib/hooks/useCart";

function CartMergeListener() {
  const mergeGuestCart = useMergeGuestCart();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        mergeGuestCart.mutate();
      }
    });

    return () => subscription.unsubscribe();
    // mergeGuestCart.mutate is stable — intentionally omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CartMergeListener />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
