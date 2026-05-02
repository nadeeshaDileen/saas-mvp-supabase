import { QueryClient } from "@tanstack/react-query";

/**
 * Global QueryClient — shared across the app
 *
 * staleTime: 5 min  — data stays fresh, avoids redundant fetches
 * gcTime:   10 min  — unused cache kept in memory
 * retry:     1      — one retry on failure
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
