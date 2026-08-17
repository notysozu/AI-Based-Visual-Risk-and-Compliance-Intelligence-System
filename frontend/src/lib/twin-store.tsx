
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createUser, getUserByUsername, getForecast, getUser, updateUser } from "@/lib/api";

// --- Types ---

export type Profile = {
  id: string | number | null;
  name: string;
  email: string;
  onboarded: boolean;
  age: number;
  targetAge: number;
  sleepHours: number;
  exerciseDays: number;
  screenTime: number;
  studyHours: number;
  savingsRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
  targetNetWorth: number;
  focusArea: string;
  goalName: string;
  goalCurrent: number;
  goalTarget: number;
  lastSuccessOdds?: number | null;
  lastWealthPrediction?: string | null;
};


export type Log = {
  id: string;
  date: string;
  sleep: number;
  screen: number;
  study: number;
  exercise: number;
  mood: number;
};

export type Txn = {
  date: string;
  label: string;
  amount: number;
  kind: "income" | "expense";
};

export type Task = {
  id: string;
  title: string;
  start: string;
  minutes: number;
  category: "Work" | "Study" | "Health" | "Money" | "Personal";
  done: boolean;
  date: string;
  fromSuggestion?: boolean;
};

export type Suggestion = {
  id: string;
  category: Task["category"];
  impact: string;
  title: string;
  detail: string;
  start: string;
  minutes: number;
};

// Decision Sandbox scenario slider preset (Scenario A or B)
export type ScenarioPreset = { savings: number; sleep: number; study: number };

// --- real backend forecast shape (from /simulations/forecast/{user_id}) ---
export type ForecastPoint = {
  year: number;
  age: number;
  net_worth: number;
};

export type MonteCarloBand = {
  years: number[];
  ages: number[];
  median: number[];
  p10: number[];
  p90: number[];
};

export type ForecastResult = {
  deterministic: ForecastPoint[];
  monte_carlo: MonteCarloBand;
  probability_of_success: number;
};

type TwinState = {
  authed: boolean;
  theme: "light" | "dark";
  profile: Profile;
  logs: Log[];
  txns: Txn[];
  tasks: Task[];
  adopted: string[];
  forecast: ForecastResult | null;
  forecastLoading: boolean;
  forecastError: string | null;
  profileSyncing: boolean;
  profileSyncError: string | null;
};

// --- Defaults ---

const DEFAULT_PROFILE: Profile = {
  id: null,
  name: "",
  email: "",
  onboarded: false,
  age: 22,
  targetAge: 45,
  sleepHours: 7.5,
  exerciseDays: 3,
  screenTime: 4,
  studyHours: 10,
  savingsRate: 20,
  monthlyIncome: 3800,
  monthlyExpenses: 2900,
  netWorth: 15000,
  targetNetWorth: 250000,
  focusArea: "Finishing my degree",
  goalName: "Emergency Fund",
  goalCurrent: 15000,
  goalTarget: 20000,
  lastSuccessOdds: null,
  lastWealthPrediction: null,
};


const DEFAULT_STATE: TwinState = {
  authed: false,
  theme: "dark",
  profile: DEFAULT_PROFILE,
  logs: [],
  txns: [],
  tasks: [],
  adopted: [],
  forecast: null,
  forecastLoading: false,
  forecastError: null,
  profileSyncing: false,
  profileSyncError: null,
};

const STORAGE_KEY = "digital-twin-state";

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

function generateDemoLogs(days = 30): Log[] {
  const logs: Log[] = [];
  const now = new Date();
  for (let i = days; i > 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    logs.push({
      id: `${date}-demo`,
      date,
      sleep: +(6.5 + Math.random() * 2).toFixed(1),
      screen: +(2 + Math.random() * 4).toFixed(1),
      study: +(Math.random() * 3).toFixed(1),
      exercise: Math.round(Math.random() * 60),
      mood: Math.round(5 + Math.random() * 5),
    });
  }
  return logs;
}

// --- Suggestions library ---

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "sleep-wind-down",
    category: "Health",
    impact: "+0.6 focus",
    title: "Wind-down routine before bed",
    detail: "Dim screens 30 minutes before sleep so you fall asleep faster and wake up sharper.",
    start: "22:00",
    minutes: 30,
  },
  {
    id: "morning-study-block",
    category: "Study",
    impact: "+0.8 focus",
    title: "Protect a morning study block",
    detail: "Your focus score is highest early in the day — use it before notifications pile up.",
    start: "07:30",
    minutes: 60,
  },
  {
    id: "midday-walk",
    category: "Health",
    impact: "+0.4 health",
    title: "Midday walk",
    detail: "A short walk after lunch resets attention and counts toward your active days.",
    start: "13:00",
    minutes: 20,
  },
  {
    id: "weekly-budget-review",
    category: "Money",
    impact: "+2% savings",
    title: "Weekly budget review",
    detail: "15 minutes reviewing transactions catches leaks before they become a pattern.",
    start: "18:00",
    minutes: 15,
  },
  {
    id: "screen-free-wind-down",
    category: "Personal",
    impact: "+0.3 mood",
    title: "Screen-free wind-down",
    detail: "Trade the last 20 minutes before bed for reading or journaling instead of a screen.",
    start: "21:30",
    minutes: 20,
  },
  {
    id: "deep-work-sprint",
    category: "Work",
    impact: "+0.7 focus",
    title: "One uninterrupted deep-work sprint",
    detail: "Block a single 90-minute sprint with notifications off for your hardest task.",
    start: "10:00",
    minutes: 90,
  },
];

// --- Backend <-> frontend Profile field mapping ---
// Only these fields currently have a home on the backend User model.
// Everything else (netWorth, monthlyExpenses, exerciseDays, screenTime,
// savingsRate, goalName, goalCurrent, goalTarget) stays localStorage-only
// until the backend schema is extended to support them.

function mapProfileToBackend(profile: Profile) {
  return {
    age: profile.age,
    retirement_goal_age: profile.targetAge,
    target_net_worth: profile.targetNetWorth,
    monthly_income: profile.monthlyIncome,
    monthly_expenses: profile.monthlyExpenses,
    net_worth: profile.netWorth,
    sleep_target_hours: profile.sleepHours,
    study_target_hours_week: profile.studyHours,
  };
}

function mapBackendToProfile(user: any): Partial<Profile> {
  return {
    age: user.age,
    targetAge: user.retirement_goal_age,
    targetNetWorth: user.target_net_worth,
    monthlyIncome: user.monthly_income,
    monthlyExpenses: user.monthly_expenses ?? 2900,
    netWorth: user.net_worth ?? 15000,
    sleepHours: user.sleep_target_hours,
    studyHours: user.study_target_hours_week,
    name: user.username ?? undefined,
    email: user.email ?? undefined,
    lastSuccessOdds: user.last_success_odds ?? null,
    lastWealthPrediction: user.last_wealth_prediction ?? null,
  };
}

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
  addTxn: (txn: Txn) => void;
  updateProfile: (partial: Partial<Profile>) => Promise<void>;
  reset: () => void;
  clearLogs: () => void;
  signIn: (username: string, email: string, isSignup: boolean) => Promise<boolean>;
  loadDemo: () => Promise<void>;
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
  };

  const updateProfile = async (partial: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...partial } }));
    
    // Auto-save settings in the background to backend database
    const userId = state.profile.id;
    if (userId !== null && userId !== undefined) {
      try {
        const fullProfile = { ...state.profile, ...partial };
        const payload = mapProfileToBackend(fullProfile);
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
    const withId: Task = { ...task, id: `${task.date}-${Date.now()}` };
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
  };

  // signIn pulls saved backend fields (age, sleep target, study target,
  // savings target, income) directly into the profile at login time.
  const signIn = async (username: string, email: string, isSignup: boolean): Promise<boolean> => {
    if (isSignup) {
      const user = await createUser({ username, email, age: 25 });
      setState((s) => ({
        ...s,
        authed: true,
        profile: { ...s.profile, ...mapBackendToProfile(user), id: user.id, name: username, email, onboarded: false },
      }));
      hasAutoSynced.current = true;
      return false;
    } else {
      let user;
      try {
        user = await getUserByUsername(username);
      } catch {
        throw new Error("Please sign up first");
      }
      setState((s) => ({
        ...s,
        authed: true,
        profile: {
          ...s.profile,
          ...mapBackendToProfile(user),
          id: user.id,
          name: user.username ?? username,
          email: user.email ?? email,
          onboarded: true,
        },
      }));
      hasAutoSynced.current = true;
      return true;
    }
  };

  const loadDemo = async () => {
    let demoUserId: number = 1;
    try {
      const res = await fetch("http://localhost:8000/users/default");
      if (res.ok) {
        const user = await res.json();
        demoUserId = user.id;
      }
    } catch (err) {
      console.warn("Failed to fetch default user from backend, using fallback ID 1:", err);
    }

    const demoLogs = generateDemoLogs(30);
    setState((s) => ({
      ...s,
      authed: true,
      logs: demoLogs,
      profile: {
        ...s.profile,
        id: demoUserId,
        name: "Demo Twin",
        email: "demo@twin.local",
        onboarded: true,
      },
    }));
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

  // Pull backend profile state, overwriting local edits (used by Reset).
  const syncProfile = async () => {
    const userId = state.profile.id;
    if (userId === null || userId === undefined) return;
    setState((s) => ({ ...s, profileSyncing: true, profileSyncError: null }));
    try {
      const user = await getUser(userId);
      setState((s) => ({
        ...s,
        profile: { ...s.profile, ...mapBackendToProfile(user) },
        profileSyncing: false,
      }));
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

export function healthIndex(sleepHours: number, exerciseMinutes: number, screenHours: number): number {
  const score = (sleepHours / 8) * 4 + (exerciseMinutes / 30) * 3 - (screenHours / 4) * 2 + 3;
  return +clamp(score, 0, 10).toFixed(1);
}

export function focusIndex(sleepHours: number, studyHoursDaily: number, screenHours: number): number {
  const score = (sleepHours / 8) * 3 + (studyHoursDaily / 2) * 5 - (screenHours / 4) * 2 + 2;
  return +clamp(score, 0, 10).toFixed(1);
}

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

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