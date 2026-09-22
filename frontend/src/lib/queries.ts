/**
 * Typed useQuery hooks for every async data source in Visual Risk AI.
 *
 * Each hook:
 *  - Has a typed query key from `queryKeys`
 *  - Has a per-endpoint staleTime
 *  - Is disabled when userId is falsy (`enabled: !!userId`)
 *  - Returns the same shape as the raw API response
 *
 * Import from pages to get instant in-session caching and background refresh.
 */
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-client";
import {
  getStudyAnalytics,
  getStudyForecast,
  getSavedStudyPlan,
  generateStudyPlan,
  logStudySession,
  getStudyOnboardingStatus,
  getStudyExams,
  addStudyExam,
  deleteStudyExam,
  getStudyRecords,
  getUserSuggestions,
  getForecast,
  getWealthAdvice,
  getAnalyticsSummary,
  getChatSessions,
  getChatMessages,
  getUser,
} from "./api";

const MIN = 60 * 1000;

// ─── Study ──────────────────────────────────────────────────────────────────

export function useStudyOnboardingStatus(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.studyOnboarding(userId ?? 0),
    queryFn: () => getStudyOnboardingStatus(userId!),
    staleTime: 30 * MIN,
    gcTime: 120 * MIN,
    enabled: !!userId,
  });
}

export function useSavedStudyPlan(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.studyPlan(userId ?? 0),
    queryFn: () => getSavedStudyPlan(userId!),
    staleTime: 5 * MIN,
    gcTime: 30 * MIN,
    enabled: !!userId,
  });
}

export function useStudyAnalytics(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.studyAnalytics(userId ?? 0),
    queryFn: () => getStudyAnalytics(userId!),
    staleTime: 10 * MIN,
    gcTime: 60 * MIN,
    enabled: !!userId,
  });
}

export function useStudyForecast(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.studyForecast(userId ?? 0),
    queryFn: () => getStudyForecast(userId!),
    staleTime: 15 * MIN,
    gcTime: 60 * MIN,
    enabled: !!userId,
  });
}

export function useStudyExams(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.studyExams(userId ?? 0),
    queryFn: () => getStudyExams(userId!),
    staleTime: 5 * MIN,
    gcTime: 60 * MIN,
    enabled: !!userId,
  });
}

export function useStudyRecords(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.studyRecords(userId ?? 0),
    queryFn: () => getStudyRecords(userId!),
    staleTime: 5 * MIN,
    gcTime: 30 * MIN,
    enabled: !!userId,
  });
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export function useAnalyticsSummary(
  userId: string | number | null | undefined,
  payload: { logs: unknown[] },
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.analyticsSummary(userId ?? 0), payload.logs.length] as const,
    queryFn: () => getAnalyticsSummary(userId!, payload),
    staleTime: 15 * MIN,
    gcTime: 60 * MIN,
    enabled: !!userId && enabled,
  });
}

// ─── Suggestions ────────────────────────────────────────────────────────────

export function useSuggestions(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.suggestions(userId ?? 0),
    queryFn: () => getUserSuggestions(userId!),
    staleTime: 10 * MIN,
    gcTime: 60 * MIN,
    enabled: !!userId,
  });
}

// ─── Wealth / Forecast ───────────────────────────────────────────────────────

export function useForecast(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.forecast(userId ?? 0),
    queryFn: () => getForecast(userId!),
    staleTime: 30 * MIN,
    gcTime: 120 * MIN,
    enabled: !!userId,
  });
}

export function useWealthAdvice(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.wealthAdvice(userId ?? 0),
    queryFn: () => getWealthAdvice(userId!),
    staleTime: 30 * MIN,
    gcTime: 120 * MIN,
    enabled: !!userId,
  });
}

// ─── Simulator ───────────────────────────────────────────────────────────────

function parsePreset(raw: string | null | undefined): Record<string, number> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useScenarioPresets(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.scenarioPresets(userId ?? 0),
    queryFn: async () => {
      const user = await getUser(userId!);
      return {
        a: parsePreset(user.scenario_a_preset),
        b: parsePreset(user.scenario_b_preset),
      };
    },
    staleTime: 10 * MIN,
    gcTime: 60 * MIN,
    enabled: !!userId,
  });
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export function useChatSessions(userId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.chatSessions(userId ?? 0),
    queryFn: () => getChatSessions(userId!),
    staleTime: 2 * MIN,
    gcTime: 30 * MIN,
    enabled: !!userId,
    // Chat sessions should be somewhat fresh — refetch on window focus
    refetchOnWindowFocus: true,
  });
}

export function useChatMessages(sessionId: string | number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.chatMessages(sessionId ?? 0),
    queryFn: () => getChatMessages(sessionId!),
    staleTime: MIN,
    gcTime: 30 * MIN,
    enabled: !!sessionId,
    refetchOnWindowFocus: true,
  });
}
