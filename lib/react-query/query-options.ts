/**
 * Reusable query option presets
 */

// Auth sessions — short-lived for security
export const shortCacheOptions = {
  staleTime: 1 * 60 * 1000,
  gcTime: 2 * 60 * 1000,
} as const;

// Profiles, settings — stable data
export const longCacheOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
} as const;

// Always fetch fresh
export const noCache = {
  staleTime: 0,
  gcTime: 0,
} as const;

// Static content, config
export const infiniteCache = {
  staleTime: Infinity,
  gcTime: 24 * 60 * 60 * 1000,
} as const;

// Polling helper
export const backgroundRefetch = (intervalMs: number) =>
  ({
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
  }) as const;
