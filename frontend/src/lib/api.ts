const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export function createUser(payload: Record<string, unknown>) {
  return request("/users/", { method: "POST", body: JSON.stringify(payload) });
}

export function getUserByUsername(username: string) {
  return request(`/users/username/${encodeURIComponent(username)}`);
}

export function getUserByEmail(email: string) {
  return request(`/users/email/${encodeURIComponent(email)}`);
}

export function updateUser(userId: string | number, payload: Record<string, unknown>) {
  return request(`/users/${userId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function getHabitRecords(userId: string | number) {
  return request(`/records/habit/${userId}`);
}

export function postHabitRecord(userId: string | number, payload: Record<string, unknown>) {
  return request(`/records/habit/${userId}`, { method: "POST", body: JSON.stringify(payload) });
}

export function getStudyRecords(userId: string | number) {
  return request(`/records/study/${userId}`);
}

export function postStudyRecord(userId: string | number, payload: Record<string, unknown>) {
  return request(`/records/study/${userId}`, { method: "POST", body: JSON.stringify(payload) });
}

export function getFinancialRecords(userId: string | number) {
  return request(`/records/financial/${userId}`);
}

export function postFinancialRecord(userId: string | number, payload: Record<string, unknown>) {
  return request(`/records/financial/${userId}`, { method: "POST", body: JSON.stringify(payload) });
}

export function getBaseline(userId: string | number) {
  return request(`/simulations/baseline/${userId}`);
}

/** Retrieve 500-run Monte Carlo forecast */
export function getForecast(userId: string | number) {
  return request(`/simulations/forecast/${userId}`);
}

/** Run comparative What-If simulation against baseline */
export function compareScenarios(userId: string | number, payload: Record<string, unknown>) {
  return request(`/simulations/compare/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Retrieve AI-generated scenario slider suggestions */
export function getScenarioSuggestions(userId: string | number) {
  return request(`/simulations/suggest/${userId}`);
}

/** Fetch 12:00 PM cached habit overview narrative */
export function getAnalyticsSummary(userId: string | number, payload: { logs: any[] }) {
  return request(`/simulations/analytics-summary/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Fetch AI wealth advice and success probability */
export function getWealthAdvice(userId: string | number, force: boolean = false) {
  return request(`/simulations/wealth-advice/${userId}${force ? "?force=true" : ""}`);
}

export function getUser(userId: string | number) {
  return request(`/users/${userId}`);
}

/** Fetch aggregated study schedule analytics */
export function getStudyAnalytics(userId: string | number) {
  return request(`/study/analytics/${userId}`);
}

export function getStudyForecast(userId: string | number, targetScore: number = 85) {
  return request(`/study/forecast/${userId}?target_score=${targetScore}`);
}

export function generateStudyPlan(userId: string | number, payload: { target_milestone?: string; force_refresh?: boolean }) {
  return request(`/study/generate-plan/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logStudySession(userId: string | number, payload: Record<string, unknown>) {
  return request(`/study/log/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getUserSuggestions(userId: string | number) {
  return request(`/suggestions/${userId}`);
}

export function generateSmartSuggestions(
  userId: string | number,
  payload: { mode: "regenerate" | "more"; custom_focus?: string } = { mode: "regenerate" }
) {
  return request(`/suggestions/generate/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adoptSuggestionApi(
  userId: string | number,
  payload: { suggestion_id: string; is_adopted: boolean }
) {
  return request(`/suggestions/adopt/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetSuggestionsApi(userId: string | number) {
  return request(`/suggestions/reset/${userId}`, {
    method: "POST",
  });
}