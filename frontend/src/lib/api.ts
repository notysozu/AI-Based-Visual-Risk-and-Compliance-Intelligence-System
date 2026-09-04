const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errorJson = await res.json();
      if (errorJson?.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      const text = await res.text().catch(() => "");
      if (text) errorDetail = text;
    }
    throw new Error(errorDetail || `API error ${res.status}`);
  }
  return res.json();
}

export function createUser(payload: Record<string, unknown>) {
  return request("/users/", { method: "POST", body: JSON.stringify(payload) });
}

export function loginUser(identifier: string) {
  return request("/users/login", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export function getUserByUsername(username: string) {
  return request(`/users/username/${encodeURIComponent(username)}`);
}

export function getDefaultUser() {
  return request("/users/default");
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

/** Fetch academic performance trend and exam readiness */
export function getStudyForecast(userId: string | number, targetScore: number = 85) {
  return request(`/study/forecast/${userId}?target_score=${targetScore}`);
}

/** Fetch currently saved/persisted 7-day study plan */
export function getSavedStudyPlan(userId: string | number) {
  return request(`/study/plan/${userId}`);
}

/** Generate AI 7-day optimized study plan */
export function generateStudyPlan(userId: string | number, payload: { target_milestone?: string; force_refresh?: boolean }) {
  return request(`/study/generate-plan/${userId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Record completed study block with focus score */
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

// --- Conversational Twin Chat APIs ---

export interface ChatSessionData {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message_preview?: string;
}

export interface ChatMessageData {
  id: number;
  session_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  action_type?: string;
  action_payload?: string | null;
  action_status?: string;
  created_at: string;
}

export function getChatSessions(userId: string | number): Promise<ChatSessionData[]> {
  return request(`/chat/sessions/${userId}`);
}

export function createChatSession(userId: string | number, payload: { title?: string } = {}): Promise<ChatSessionData> {
  return request(`/chat/sessions/${userId}`, {
    method: "POST",
    body: JSON.stringify({ user_id: Number(userId), title: payload.title || "New Conversation" }),
  });
}

export function deleteChatSession(sessionId: number, userId?: number): Promise<{ message: string; session_id: number }> {
  const q = userId ? `?user_id=${userId}` : "";
  return request(`/chat/sessions/${sessionId}${q}`, {
    method: "DELETE",
  });
}

export function getChatMessages(sessionId: number, userId?: number): Promise<ChatMessageData[]> {
  const q = userId ? `?user_id=${userId}` : "";
  return request(`/chat/messages/${sessionId}${q}`);
}

export function sendChatMessage(
  sessionId: number,
  payload: { user_id: number; prompt: string; think_mode?: boolean; client_context?: Record<string, unknown> }
): Promise<{ user_message: ChatMessageData; assistant_message: ChatMessageData }> {
  return request(`/chat/message/${sessionId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createThreadAndSendMessage(payload: {
  user_id: number;
  prompt: string;
  think_mode?: boolean;
  client_context?: Record<string, unknown>;
}): Promise<{ session: ChatSessionData; user_message: ChatMessageData; assistant_message: ChatMessageData }> {
  return request(`/chat/message/create_thread`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function executeChatAction(
  messageId: number,
  payload: { user_id: number; action_type: string; action_payload: Record<string, unknown> }
): Promise<{ status: string; message_id: number; action_type: string; action_status: string; result?: Record<string, unknown> }> {
  return request(`/chat/action/execute/${messageId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function rejectChatAction(
  messageId: number,
  payload: { user_id: number }
): Promise<{ status: string; message_id: number; action_status: string }> {
  return request(`/chat/action/reject/${messageId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --- Application Intelligence Cache APIs (MongoDB Persistence) ---

export function getCache(cacheKey: string) {
  return request(`/cache/${encodeURIComponent(cacheKey)}`);
}

export function setCache(
  cacheKey: string,
  payload: Record<string, unknown>,
  userId?: string | number,
  ttlSeconds?: number
) {
  const queryParams = new URLSearchParams();
  if (userId) queryParams.set("user_id", String(userId));
  if (ttlSeconds) queryParams.set("ttl_seconds", String(ttlSeconds));
  const q = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return request(`/cache/${encodeURIComponent(cacheKey)}${q}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteCache(cacheKey: string) {
  return request(`/cache/${encodeURIComponent(cacheKey)}`, {
    method: "DELETE",
  });
}