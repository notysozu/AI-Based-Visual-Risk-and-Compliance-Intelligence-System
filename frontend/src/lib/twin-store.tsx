
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createUser, loginUser, getUserByUsername, getDefaultUser, getDemoUser, getForecast, getUser, updateUser, adoptSuggestionApi, postHabitRecord, postStudyRecord, postFinancialRecord, getHabitRecords, getStudyRecords, getFinancialRecords } from "@/lib/api";

// Re-export all models from types for 100% backwards compatibility
export type {
  UserRole,
  Profile,
  Log,
  Txn,
  Task,
  Suggestion,
  ScenarioPreset,
  ForecastPoint,
  MonteCarloBand,
  ForecastResult,
  TwinState,
  TwinContextValue
} from "./types";

// Re-export all baseline configurations & generator helpers
export {
  ROLE_CONFIGS,
  type RoleConfig,
  DEFAULT_PROFILE,
  DEFAULT_STATE,
  STORAGE_KEY,
  generateDemoLogs,
  buildDemoProfile
} from "./persona-defaults";

import type {
  UserRole,
  Profile,
  Log,
  Txn,
  Task,
  Suggestion,
  ScenarioPreset,
  ForecastResult,
  TwinState,
  TwinContextValue
} from "./types";

import {
  ROLE_CONFIGS,
  type RoleConfig,
  DEFAULT_PROFILE,
  DEFAULT_STATE,
  STORAGE_KEY,
  generateDemoLogs,
  buildDemoProfile
} from "./persona-defaults";

function loadState(): TwinState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        profile: { ...DEFAULT_PROFILE, ...parsed.profile },
        forecast: null,
        forecastLoading: false,
        forecastError: null,
        profileSyncing: false,
        profileSyncError: null,
      };
    }
  } catch {
    // ignore corrupt storage
  }
  return DEFAULT_STATE;
}

export function getRoleConfig(role?: string | null): RoleConfig {
  if (role === "student") return ROLE_CONFIGS.student;
  if (role === "freelancer") return ROLE_CONFIGS.freelancer;
  if (role === "entrepreneur") return ROLE_CONFIGS.entrepreneur;
  if (role === "retiree") return ROLE_CONFIGS.retiree;
  return ROLE_CONFIGS.professional;
}

// --- Suggestions library by Role ---

export // Student persona default suggestions library
const STUDENT_SUGGESTIONS: Suggestion[] = [
  {
    id: "student-study-sprint",
    category: "Study",
    impact: "+1.2 focus",
    title: "Morning library & study block",
    detail: "Block 60 minutes for your hardest coursework topic before campus distractions.",
    start: "08:00",
    minutes: 60,
  },
  {
    id: "student-pocket-budget",
    category: "Money",
    impact: "+5% savings",
    title: "Pocket money weekly review",
    detail: "Log coffee, snacks, and subscription spending to keep your allowance on track.",
    start: "19:00",
    minutes: 15,
  },
  {
    id: "student-exam-walk",
    category: "Health",
    impact: "+0.5 mood",
    title: "Post-class fresh air walk",
    detail: "Take a 20-minute walk between study sessions to reset your memory consolidation.",
    start: "16:00",
    minutes: 20,
  },
  {
    id: "student-sleep-recovery",
    category: "Health",
    impact: "+0.8 focus",
    title: "Consistent sleep cutoff",
    detail: "Turn off video reels and gaming 30 minutes before bed to wake up sharp for class.",
    start: "22:30",
    minutes: 30,
  },
];

export // Working Professional persona default suggestions library
const WORKER_SUGGESTIONS: Suggestion[] = [
  {
    id: "deep-work-sprint",
    category: "Work",
    impact: "+0.7 focus",
    title: "One uninterrupted deep-work sprint",
    detail: "Block a single 90-minute sprint with notifications off for your hardest task.",
    start: "10:00",
    minutes: 90,
  },
  {
    id: "weekly-budget-review",
    category: "Money",
    impact: "+2% savings",
    title: "Weekly financial review",
    detail: "15 minutes reviewing transactions catches leaks before they become a pattern.",
    start: "18:00",
    minutes: 15,
  },
  {
    id: "morning-upskill-block",
    category: "Study",
    impact: "+0.8 focus",
    title: "Morning learning & upskilling",
    detail: "Dedicate 45 minutes to tutorials, certifications, or side projects before standup.",
    start: "07:30",
    minutes: 45,
  },
  {
    id: "sleep-wind-down",
    category: "Health",
    impact: "+0.6 focus",
    title: "Wind-down routine before bed",
    detail: "Dim screens 30 minutes before sleep so you fall asleep faster and wake up sharper.",
    start: "22:00",
    minutes: 30,
  },
];

export // Freelancer persona default suggestions library
const FREELANCER_SUGGESTIONS: Suggestion[] = [
  {
    id: "freelance-client-block",
    category: "Work",
    impact: "+1.0 focus",
    title: "Dedicated client delivery sprint",
    detail: "Zero-distraction 2-hour sprint focused strictly on billable client deliverables.",
    start: "09:00",
    minutes: 120,
  },
  {
    id: "freelance-invoice-audit",
    category: "Money",
    impact: "+Runway clarity",
    title: "Weekly invoice & tax buffer audit",
    detail: "Check outstanding client accounts receivable and set aside 25% for tax buffer.",
    start: "16:30",
    minutes: 20,
  },
  {
    id: "freelance-portfolio-hour",
    category: "Study",
    impact: "+0.7 pipeline",
    title: "Inbound pipeline & skill building",
    detail: "Spend 45 minutes publishing case studies or upgrading high-value freelance skills.",
    start: "14:00",
    minutes: 45,
  },
  {
    id: "freelance-shutdown-ritual",
    category: "Personal",
    impact: "+0.5 wellbeing",
    title: "Clear workspace shutdown",
    detail: "Close client tabs and transition out of work mode to prevent freelancer boundary creep.",
    start: "18:30",
    minutes: 15,
  },
];

export // Entrepreneur persona default suggestions library
const ENTREPRENEUR_SUGGESTIONS: Suggestion[] = [
  {
    id: "founder-strategy-sprint",
    category: "Work",
    impact: "+1.2 leverage",
    title: "Morning high-leverage product sprint",
    detail: "Work on core product and distribution before team messages and operational fires.",
    start: "08:30",
    minutes: 90,
  },
  {
    id: "founder-runway-check",
    category: "Money",
    impact: "+Runway extension",
    title: "Burn rate & runway review",
    detail: "Analyze monthly business burn vs cash buffer to maintain minimum 18-month runway.",
    start: "17:00",
    minutes: 25,
  },
  {
    id: "founder-customer-talk",
    category: "Study",
    impact: "+Product clarity",
    title: "Direct customer feedback synthesis",
    detail: "Synthesize user interviews and feedback logs to refine product roadmap.",
    start: "13:30",
    minutes: 45,
  },
  {
    id: "founder-recovery-walk",
    category: "Health",
    impact: "+0.6 resilience",
    title: "Midday reset & walking break",
    detail: "Step away from screens to maintain high cognitive stamina under pressure.",
    start: "12:30",
    minutes: 25,
  },
];

export // Retiree persona default suggestions library
const RETIREE_SUGGESTIONS: Suggestion[] = [
  {
    id: "retiree-morning-walk",
    category: "Health",
    impact: "+0.8 health",
    title: "Morning sunshine walk",
    detail: "A gentle 30-minute morning walk maintains cardiovascular vitality and joint health.",
    start: "08:00",
    minutes: 30,
  },
  {
    id: "retiree-mind-reading",
    category: "Personal",
    impact: "+0.6 focus",
    title: "Daily reading & brain puzzle",
    detail: "Spend 45 minutes with a book, crossword, or crafting hobby to keep your mind sharp.",
    start: "10:30",
    minutes: 45,
  },
  {
    id: "retiree-pension-check",
    category: "Money",
    impact: "+Peace of mind",
    title: "Monthly pension & healthcare check",
    detail: "Review monthly healthcare expenses and utility bills for peace of mind.",
    start: "15:00",
    minutes: 20,
  },
  {
    id: "retiree-evening-stretch",
    category: "Health",
    impact: "+0.4 sleep",
    title: "Evening calming tea & stretching",
    detail: "Gentle stretching and quiet music to prepare for restful, rejuvenating sleep.",
    start: "20:30",
    minutes: 25,
  },
];

/** Resolves default suggestion library by persona role */
export function getRoleSuggestions(role?: string | null): Suggestion[] {
  if (role === "student") return STUDENT_SUGGESTIONS;
  if (role === "freelancer") return FREELANCER_SUGGESTIONS;
  if (role === "entrepreneur") return ENTREPRENEUR_SUGGESTIONS;
  if (role === "retiree") return RETIREE_SUGGESTIONS;
  return WORKER_SUGGESTIONS;
}

export const SUGGESTIONS = WORKER_SUGGESTIONS;

// --- Backend <-> frontend Profile field mapping ---
// Only these fields currently have a home on the backend User model.
// Everything else (netWorth, monthlyExpenses, exerciseDays, screenTime,
// savingsRate, goalName, goalCurrent, goalTarget) stays localStorage-only
// until the backend schema is extended to support them.

/** Maps frontend profile state to backend schema payload */
function mapProfileToBackend(profile: Profile) {
  return {
    role: profile.role,
    age: profile.age,
    retirement_goal_age: profile.targetAge,
    target_net_worth: profile.targetNetWorth,
    monthly_income: profile.monthlyIncome,
    monthly_expenses: profile.monthlyExpenses,
    net_worth: profile.netWorth,
    sleep_target_hours: profile.sleepHours,
    study_target_hours_week: profile.studyHours,
    exercise_target_days: profile.exerciseDays,
    screen_time_target_hours: profile.screenTime,
    savings_rate_target: profile.savingsRate,
    focus_area: profile.focusArea,
    goal_name: profile.goalName,
    goal_current: profile.goalCurrent,
    goal_target: profile.goalTarget,
    is_onboarded: profile.onboarded ? 1 : 0,
    last_success_odds: profile.lastSuccessOdds,
    last_wealth_prediction: profile.lastWealthPrediction,
    last_analytics_summary: profile.lastAnalyticsSummary,
    last_analytics_updated: profile.lastAnalyticsUpdated,
    last_study_plan: profile.lastStudyPlan,
    last_study_plan_updated: profile.lastStudyPlanUpdated,
  };
}

/** Maps backend User response to frontend Profile interface */
function mapBackendToProfile(user: any): Partial<Profile> {
  return {
    role: user.role ?? "professional",
    age: user.age ?? 25,
    targetAge: user.retirement_goal_age ?? 60,
    targetNetWorth: user.target_net_worth ?? 1000000,
    monthlyIncome: user.monthly_income ?? 5000,
    monthlyExpenses: user.monthly_expenses ?? 2900,
    netWorth: user.net_worth ?? 15000,
    sleepHours: user.sleep_target_hours ?? 8.0,
    studyHours: user.study_target_hours_week ?? 15.0,
    exerciseDays: user.exercise_target_days ?? 4.0,
    screenTime: user.screen_time_target_hours ?? 3.5,
    savingsRate: user.savings_rate_target ?? 20.0,
    focusArea: user.focus_area ?? "Deep Work",
    goalName: user.goal_name ?? "Emergency Fund",
    goalCurrent: user.goal_current ?? 15000,
    goalTarget: user.goal_target ?? 50000,
    onboarded: Boolean(user.is_onboarded === 1 || user.is_onboarded === true),
    name: user.username ?? undefined,
    email: user.email ?? undefined,
    lastSuccessOdds: user.last_success_odds ?? null,
    lastWealthPrediction: user.last_wealth_prediction ?? null,
    lastAnalyticsSummary: user.last_analytics_summary ?? null,
    lastAnalyticsUpdated: user.last_analytics_updated ?? null,
    lastStudyPlan: user.last_study_plan ?? null,
    lastStudyPlanUpdated: user.last_study_plan_updated ?? null,
  };
}

/** Safely deserializes stored JSON scenario presets */
function parsePreset(raw: string | null | undefined): ScenarioPreset | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.savings === "number" &&
      typeof parsed.sleep === "number" &&
      typeof parsed.study === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// --- Context ---

type TwinContextValue = {
  state: TwinState;
  ready: boolean;
  addLog: (log: Omit<Log, "id">) => void;
  logHabitActivity: (habitName: string, hours: number) => void;
  logStudyActivity: (subject: string, hours: number) => void;
  addTxn: (txn: Txn) => void;
  updateProfile: (partial: Partial<Profile>) => Promise<void>;
  reset: () => void;
  clearLogs: () => void;
  signIn: (username: string, email: string, isSignup: boolean) => Promise<boolean>;
  loadDemo: (role?: UserRole, randomize?: boolean) => Promise<void>;
  setTheme: (theme: "light" | "dark") => void;
  addTask: (task: Omit<Task, "id">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  adopt: (suggestion: Suggestion) => void;
  loadForecast: () => Promise<void>;
  signOut: () => void;
  saveProfile: () => Promise<void>;
  syncProfile: () => Promise<void>;
  saveScenarioPresets: (a: ScenarioPreset, b: ScenarioPreset) => Promise<void>;
  loadScenarioPresets: () => Promise<{ a: ScenarioPreset | null; b: ScenarioPreset | null }>;
};


const TwinContext = createContext<TwinContextValue | null>(null);

export function TwinProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TwinState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const hasAutoSynced = useRef(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    if (ready) document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme, ready]);

  const addLog = (log: Omit<Log, "id">) => {
    const withId: Log = { ...log, id: `${log.date}-${Date.now()}` };
    setState((s) => ({ ...s, logs: [...s.logs, withId] }));

    if (state.profile.id) {
      if (log.sleep > 0) {
        postHabitRecord(state.profile.id, {
          habit_name: "Sleep",
          duration_minutes: Math.round(log.sleep * 60),
          impact_score: 8
        }).catch((e) => console.warn("Failed to persist sleep record to MongoDB:", e));
      }
      if (log.study > 0) {
        postStudyRecord(state.profile.id, {
          subject: "Daily Coursework",
          duration_minutes: Math.round(log.study * 60),
          focus_score: 8,
          session_type: "study"
        }).catch((e) => console.warn("Failed to persist study record to MongoDB:", e));
      }
    }
  };

  const logHabitActivity = (habitName: string, hours: number) => {
    const todayDate = today();
    setState((s) => {
      const existingIndex = s.logs.findIndex((l) => l.date === todayDate);
      const hLower = (habitName || "").toLowerCase();
      const isEx = hLower.includes("exercise") || hLower.includes("workout") || hLower.includes("gym") || hLower.includes("training") || hLower.includes("walk") || hLower.includes("run");
      const isSl = hLower.includes("sleep") || hLower.includes("rest");
      const isSc = hLower.includes("screen");

      if (existingIndex >= 0) {
        const existing = s.logs[existingIndex];
        const updated: Log = {
          ...existing,
          exercise: isEx ? Math.max(1, (existing.exercise || 0) + 1) : existing.exercise,
          sleep: isSl ? hours : existing.sleep,
          screen: isSc ? hours : existing.screen,
        };
        const newLogs = [...s.logs];
        newLogs[existingIndex] = updated;
        return { ...s, logs: newLogs };
      } else {
        const newLog: Log = {
          id: `${todayDate}-${Date.now()}`,
          date: todayDate,
          sleep: isSl ? hours : (s.profile.sleepHours || 7.5),
          screen: isSc ? hours : 3.5,
          study: 0,
          exercise: isEx ? 1 : 0,
          mood: 8,
        };
        return { ...s, logs: [...s.logs, newLog] };
      }
    });

    if (state.profile.id) {
      postHabitRecord(state.profile.id, {
        habit_name: habitName,
        duration_minutes: Math.round(hours * 60),
        impact_score: 8
      }).catch((e) => console.warn("Failed to persist habit record to MongoDB:", e));
    }
  };

  const logStudyActivity = (subject: string, hours: number) => {
    const todayDate = today();
    setState((s) => {
      const existingIndex = s.logs.findIndex((l) => l.date === todayDate);
      if (existingIndex >= 0) {
        const existing = s.logs[existingIndex];
        const updated: Log = {
          ...existing,
          study: Number(((existing.study || 0) + hours).toFixed(1)),
        };
        const newLogs = [...s.logs];
        newLogs[existingIndex] = updated;
        return { ...s, logs: newLogs };
      } else {
        const newLog: Log = {
          id: `${todayDate}-${Date.now()}`,
          date: todayDate,
          sleep: s.profile.sleepHours || 7.5,
          screen: 3.5,
          study: hours,
          exercise: 0,
          mood: 8,
        };
        return { ...s, logs: [...s.logs, newLog] };
      }
    });

    if (state.profile.id) {
      postStudyRecord(state.profile.id, {
        subject: subject,
        duration_minutes: Math.round(hours * 60),
        focus_score: 8,
        session_type: "study"
      }).catch((e) => console.warn("Failed to persist study record to MongoDB:", e));
    }
  };

  const clearLogs = () => {
    setState((s) => ({ ...s, logs: [] }));
  };

  const addTxn = (txn: Txn) => {
    setState((s) => {
      const delta = txn.kind === "income" ? txn.amount : -txn.amount;
      return {
        ...s,
        txns: [...s.txns, txn],
        profile: { ...s.profile, netWorth: s.profile.netWorth + delta },
      };
    });

    if (state.profile.id) {
      postFinancialRecord(state.profile.id, {
        category: txn.kind === "income" ? "Income" : "Discretionary Expense",
        description: txn.label,
        amount: txn.amount
      }).catch((e) => console.warn("Failed to persist financial record to MongoDB:", e));
    }
  };

  const updateProfile = async (partial: Partial<Profile>) => {
    const isAuthed = partial.onboarded ? true : state.authed;
    const nextProfile = { ...state.profile, ...partial };
    setState((s) => ({
      ...s,
      authed: isAuthed || s.authed,
      profile: nextProfile,
    }));
    
    // Auto-save settings in the background to backend database
    const userId = partial.id ?? state.profile.id ?? 1;
    if (userId !== null && userId !== undefined) {
      try {
        const payload = mapProfileToBackend(nextProfile);
        await updateUser(userId, payload);
      } catch (err) {
        console.error("Failed to auto-save profile settings to backend:", err);
      }
    }
  };

  const reset = () => {
    hasAutoSynced.current = false;
    setState(DEFAULT_STATE);
  };

  const signOut = () => {
    hasAutoSynced.current = false;
    setState(DEFAULT_STATE);
  };

  const setTheme = (theme: "light" | "dark") => {
    setState((s) => ({ ...s, theme }));
  };

  const addTask = (task: Omit<Task, "id">) => {
    const taskDate = task.date || today();
    const withId: Task = {
      ...task,
      date: taskDate,
      id: `${taskDate}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setState((s) => ({ ...s, tasks: [...s.tasks, withId] }));
  };

  const toggleTask = (id: string) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  };

  const removeTask = (id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  };

  const adopt = (suggestion: Suggestion) => {
    setState((s) => {
      if (s.adopted.includes(suggestion.id)) return s;
      const task: Task = {
        id: `${suggestion.id}-${Date.now()}`,
        title: suggestion.title,
        start: suggestion.start,
        minutes: suggestion.minutes,
        category: suggestion.category,
        done: false,
        date: today(),
        fromSuggestion: true,
      };
      return {
        ...s,
        adopted: [...s.adopted, suggestion.id],
        tasks: [...s.tasks, task],
      };
    });

    if (state.profile.id) {
      adoptSuggestionApi(state.profile.id, {
        suggestion_id: suggestion.id,
        is_adopted: true,
      }).catch((e) => console.warn("Failed to persist suggestion adoption to DB:", e));
    }
  };

  // signIn pulls saved backend fields (age, sleep target, study target,
  // savings target, income) directly into the profile at login time.
  const signIn = async (username: string, email: string, isSignup: boolean): Promise<boolean> => {
    if (isSignup) {
      let user;
      try {
        user = await createUser({ username: username.trim(), email: email.trim().toLowerCase(), age: 25, is_onboarded: 0 });
      } catch (err: any) {
        // If an account already exists for this email or username, seamlessly fetch their existing profile
        const msg = (err?.message || "").toLowerCase();
        if (msg.includes("already exists") || msg.includes("already taken")) {
          try {
            user = await loginUser(email.trim().toLowerCase()).catch(() => loginUser(username.trim()));
          } catch {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // New registrations are strictly not onboarded until they complete /setup
      const hasOnboarded = Boolean(user?.is_onboarded === 1 || user?.is_onboarded === true);
      setState((s) => ({
        ...s,
        authed: true,
        profile: { ...s.profile, ...mapBackendToProfile(user), id: user.id, name: user.username || username, email: user.email || email, onboarded: false },
      }));
      hasAutoSynced.current = true;
      return false;
    } else {
      let user;
      try {
        // Search by email first, fallback to username
        user = await loginUser(email.trim()).catch(() => loginUser(username.trim()));
      } catch {
        throw new Error("No account found for this email/username. Please sign up first.");
      }

      const hasOnboarded = Boolean(user?.is_onboarded === 1 || user?.is_onboarded === true);
      setState((s) => ({
        ...s,
        authed: true,
        profile: {
          ...s.profile,
          ...mapBackendToProfile(user),
          id: user.id,
          name: user.username ?? username,
          email: user.email ?? email,
          onboarded: hasOnboarded,
        },
      }));
      hasAutoSynced.current = true;
      return hasOnboarded;
    }
  };

  const loadDemo = async (role: UserRole = "professional", randomize = false) => {
    let demoUserId: string | number = 1;
    let backendUser: any = null;
    try {
      backendUser = await getDemoUser(role);
      if (backendUser?.id) {
        demoUserId = backendUser.id;
      }
    } catch (err) {
      console.warn(`Failed to fetch dedicated demo user for role ${role} from backend, using fallback:`, err);
      try {
        const defaultUser = await getDefaultUser();
        if (defaultUser?.id) demoUserId = defaultUser.id;
      } catch {}
    }

    const demoProfile = buildDemoProfile(role, randomize);
    demoProfile.id = demoUserId;
    demoProfile.onboarded = true;
    if (backendUser) {
      Object.assign(demoProfile, mapBackendToProfile(backendUser));
      demoProfile.role = role;
      demoProfile.id = demoUserId;
      demoProfile.onboarded = true;
    }

    // Sync demo profile to backend asynchronously without blocking UI navigation
    try {
      const payload = mapProfileToBackend(demoProfile);
      updateUser(demoUserId, payload).catch((e) =>
        console.warn("Failed to sync demo profile to backend:", e)
      );
    } catch (e) {
      console.warn("Failed to map demo profile for backend:", e);
    }

    const demoLogs = generateDemoLogs(30, role);
    setState((s) => ({
      ...s,
      authed: true,
      logs: demoLogs,
      profile: demoProfile,
      forecast: null,
      forecastLoading: false,
      forecastError: null,
    }));

    hasAutoSynced.current = true;

    // Load updated forecast in the background
    getForecast(demoUserId)
      .then((data) => {
        setState((s) => ({ ...s, forecast: data, forecastLoading: false }));
      })
      .catch((err) => {
        console.warn("Failed to load initial forecast for demo twin:", err);
      });
  };

  const loadForecast = async () => {
    const userId = state.profile.id;
    if (userId === null || userId === undefined) {
      setState((s) => ({ ...s, forecastError: "No user ID set — sign in first." }));
      return;
    }
    setState((s) => ({ ...s, forecastLoading: true, forecastError: null }));
    try {
      const data: ForecastResult = await getForecast(userId);
      setState((s) => ({ ...s, forecast: data, forecastLoading: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        forecastLoading: false,
        forecastError: err instanceof Error ? err.message : "Failed to load forecast",
      }));
    }
  };

  // Push current local profile edits (age, sleep target, study target,
  // income, net worth target) to the backend.
  const saveProfile = async () => {
    const userId = state.profile.id;
    if (userId === null || userId === undefined) {
      setState((s) => ({ ...s, profileSyncError: "No user ID set — sign in first." }));
      return;
    }
    setState((s) => ({ ...s, profileSyncing: true, profileSyncError: null }));
    try {
      const payload = mapProfileToBackend(state.profile);
      const updated = await updateUser(userId, payload);
      setState((s) => ({
        ...s,
        profile: { ...s.profile, ...mapBackendToProfile(updated) },
        profileSyncing: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        profileSyncing: false,
        profileSyncError: err instanceof Error ? err.message : "Failed to save profile",
      }));
      throw err;
    }
  };

  // Pull backend profile and records state from MongoDB, synchronizing store with database
  const syncProfile = async () => {
    const userId = state.profile.id;
    if (userId === null || userId === undefined) return;
    setState((s) => ({ ...s, profileSyncing: true, profileSyncError: null }));
    try {
      const user = await getUser(userId);
      const [habitsData, finData] = await Promise.all([
        getHabitRecords(userId).catch(() => []),
        getFinancialRecords(userId).catch(() => []),
      ]);

      setState((s) => {
        const nextProfile = { ...s.profile, ...mapBackendToProfile(user) };
        let nextLogs = s.logs;
        if (Array.isArray(habitsData) && habitsData.length > 0) {
          const dateMap: Record<string, Log> = {};
          habitsData.forEach((rec: any) => {
            const dateStr = (rec.created_at || "").slice(0, 10) || today();
            if (!dateMap[dateStr]) {
              dateMap[dateStr] = {
                id: `${dateStr}-${rec.id || Math.random()}`,
                date: dateStr,
                sleep: rec.habit_name === "Sleep" ? +(rec.duration_minutes / 60).toFixed(1) : (nextProfile.sleepHours || 8.0),
                screen: 3.5,
                study: 0,
                exercise: rec.habit_name === "Exercise" ? Math.round(rec.duration_minutes) : 0,
                mood: 8,
              };
            } else {
              if (rec.habit_name === "Sleep") dateMap[dateStr].sleep = +(rec.duration_minutes / 60).toFixed(1);
              if (rec.habit_name === "Exercise") dateMap[dateStr].exercise = Math.round(rec.duration_minutes);
            }
          });
          nextLogs = Object.values(dateMap);
        }

        let nextTxns = s.txns;
        if (Array.isArray(finData) && finData.length > 0) {
          nextTxns = finData.map((f: any) => ({
            date: (f.record_date || "").slice(0, 10) || today(),
            label: f.description || f.category || "Transaction",
            amount: Number(f.amount || 0),
            kind: (f.category === "Income" ? "income" : "expense") as "income" | "expense",
          }));
        }

        return {
          ...s,
          profile: nextProfile,
          logs: nextLogs.length > 0 ? nextLogs : s.logs,
          txns: nextTxns.length > 0 ? nextTxns : s.txns,
          profileSyncing: false,
        };
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        profileSyncing: false,
        profileSyncError: err instanceof Error ? err.message : "Failed to sync profile",
      }));
      throw err;
    }
  };

  // --- Decision Sandbox scenario slider presets ---
  // Stored separately from Profile since they're not profile settings —
  // they're the last-used Scenario A / Scenario B slider positions.
  const saveScenarioPresets = async (a: ScenarioPreset, b: ScenarioPreset) => {
    const userId = state.profile.id;
    if (userId === null || userId === undefined) {
      throw new Error("No user ID set — sign in first.");
    }
    await updateUser(userId, {
      scenario_a_preset: JSON.stringify(a),
      scenario_b_preset: JSON.stringify(b),
    });
  };

  const loadScenarioPresets = async (): Promise<{ a: ScenarioPreset | null; b: ScenarioPreset | null }> => {
    const userId = state.profile.id;
    if (userId === null || userId === undefined) {
      return { a: null, b: null };
    }
    const user = await getUser(userId);
    return {
      a: parsePreset(user.scenario_a_preset),
      b: parsePreset(user.scenario_b_preset),
    };
  };

  // Fallback auto-sync: covers cases like loadDemo() where signIn() wasn't
  // called directly (so profile fields weren't already pulled from the
  // backend at that point). Only runs once per session per user id.
  useEffect(() => {
    if (ready && state.profile.id !== null && state.profile.id !== undefined && !hasAutoSynced.current) {
      hasAutoSynced.current = true;
      syncProfile().catch(() => {
        // non-fatal — local/localStorage state remains as fallback
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.profile.id]);

  return (
    <TwinContext.Provider
      value={{
        state,
        ready,
        addLog,
        logHabitActivity,
        logStudyActivity,
        addTxn,
        updateProfile,
        reset,
        clearLogs,
        signIn,
        loadDemo,
        setTheme,
        addTask,
        toggleTask,
        removeTask,
        adopt,
        loadForecast,
        signOut,
        saveProfile,
        syncProfile,
        saveScenarioPresets,
        loadScenarioPresets,
      }}

    >
      {children}
    </TwinContext.Provider>
  );
}

export function useTwin() {
  const ctx = useContext(TwinContext);
  if (!ctx) throw new Error("useTwin must be used within TwinProvider");
  return ctx;
}

// --- Derived metrics & helpers ---

export function baseline(logs: Log[]) {
  if (!logs.length) return { days: 0, sleep: 0, exercise: 0, screen: 0, study: 0 };
  const days = logs.length;
  const sum = (key: keyof Log) => logs.reduce((acc, l) => acc + (Number(l[key]) || 0), 0);
  return {
    days,
    sleep: +(sum("sleep") / days).toFixed(2),
    exercise: +(sum("exercise") / days).toFixed(2),
    screen: +(sum("screen") / days).toFixed(2),
    study: +(sum("study") / days).toFixed(2),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Calculate 0-10 Health Index from lifestyle metrics */
export function healthIndex(sleepHours: number, exerciseMinutes: number, screenHours: number): number {
  const score = (sleepHours / 8) * 4 + (exerciseMinutes / 30) * 3 - (screenHours / 4) * 2 + 3;
  return +clamp(score, 0, 10).toFixed(1);
}

/** Calculate 0-10 Focus Index from daily focus and sleep */
export function focusIndex(sleepHours: number, studyHoursDaily: number, screenHours: number): number {
  const score = (sleepHours / 8) * 3 + (studyHoursDaily / 2) * 5 - (screenHours / 4) * 2 + 2;
  return +clamp(score, 0, 10).toFixed(1);
}

/** Format currency in USD */
export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Returns current date formatted as YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Multi-year compound wealth projection */
export function projectNetWorth(
  current: number,
  monthlyContribution: number,
  years: number,
  annualReturnRate = 0.06,
) {
  const monthlyRate = annualReturnRate / 12;
  const rows: { year: number; value: number }[] = [];
  let balance = current;
  for (let year = 1; year <= years; year++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }
    rows.push({ year, value: +balance.toFixed(2) });
  }
  return rows;
}

function randomNormal(mean: number, std: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** 500-iteration client-side Monte Carlo fallback */
export function monteCarlo(
  current: number,
  monthlyContribution: number,
  years: number,
  iterations = 500,
  annualReturnMean = 0.07,
  annualReturnStd = 0.15,
) {
  const paths: number[][] = [];
  const startYear = new Date().getFullYear();

  for (let i = 0; i < iterations; i++) {
    let balance = current;
    const path: number[] = [];
    for (let y = 0; y < years; y++) {
      for (let m = 0; m < 12; m++) {
        const monthlyReturn = randomNormal(annualReturnMean / 12, annualReturnStd / Math.sqrt(12));
        balance = Math.max(0, balance * (1 + monthlyReturn) + monthlyContribution);
      }
      path.push(balance);
    }
    paths.push(path);
  }

  const data = Array.from({ length: years }, (_, y) => {
    const valuesAtYear = paths.map((p) => p[y]).sort((a, b) => a - b);
    const pct = (q: number) => valuesAtYear[Math.floor(q * (valuesAtYear.length - 1))];
    return {
      year: startYear + y + 1,
      p10: Math.round(pct(0.1)),
      p50: Math.round(pct(0.5)),
      p90: Math.round(pct(0.9)),
    };
  });

  return { paths, data };
}