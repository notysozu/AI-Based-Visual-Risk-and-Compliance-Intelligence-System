import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient — shared across the entire app.
 * Import this anywhere (pages, twin-store mutations) to read or invalidate cache.
 *
 * Defaults chosen per data volatility:
 *  - staleTime: 5 min  (most pages)
 *  - gcTime:   30 min  (keep in memory after component unmounts)
 *  - retry: 1          (one automatic retry on network failure)
 *  - refetchOnWindowFocus: false  (prevent surprise refetches on tab switch)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes
      gcTime: 30 * 60 * 1000,     // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Query key factories — centralised so renaming never causes cache misses */
export const queryKeys = {
  user:              (userId: string | number) => ["user", userId] as const,
  habitRecords:      (userId: string | number) => ["habitRecords", userId] as const,
  studyRecords:      (userId: string | number) => ["studyRecords", userId] as const,
  studyAnalytics:    (userId: string | number) => ["studyAnalytics", userId] as const,
  studyForecast:     (userId: string | number) => ["studyForecast", userId] as const,
  studyPlan:         (userId: string | number) => ["studyPlan", userId] as const,
  studyExams:        (userId: string | number) => ["studyExams", userId] as const,
  studyOnboarding:   (userId: string | number) => ["studyOnboarding", userId] as const,
  suggestions:       (userId: string | number) => ["suggestions", userId] as const,
  forecast:          (userId: string | number) => ["forecast", userId] as const,
  wealthAdvice:      (userId: string | number) => ["wealthAdvice", userId] as const,
  analyticsSummary:  (userId: string | number) => ["analyticsSummary", userId] as const,
  chatSessions:      (userId: string | number) => ["chatSessions", userId] as const,
  chatMessages:      (sessionId: string | number) => ["chatMessages", sessionId] as const,
  scenarioPresets:   (userId: string | number) => ["scenarioPresets", userId] as const,
  /** Invalidates all queries scoped to a user (used on login/logout) */
  allForUser:        (userId: string | number) => [userId] as const,
};
