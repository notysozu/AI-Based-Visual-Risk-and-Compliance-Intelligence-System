export type UserRole = "student" | "professional" | "freelancer" | "entrepreneur" | "retiree";

export type Profile = {
  id: string | number | null;
  name: string;
  email: string;
  role: UserRole;
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
  lastAnalyticsSummary?: string | null;
  lastAnalyticsUpdated?: string | null;
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

export type ScenarioPreset = {
  savings: number;
  sleep: number;
  study: number;
};

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

export type TwinState = {
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

export type TwinContextValue = {
  state: TwinState;
  login: (name: string, role: UserRole) => void;
  signIn: (identifier: string) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  logToday: (log: Omit<Log, "id" | "date">) => void;
  addTxn: (txn: Txn) => void;
  addTask: (task: Omit<Task, "id">) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  adoptSuggestion: (s: Suggestion) => void;
  refreshForecast: (overrideProfile?: Profile) => Promise<void>;
  saveScenarioPresets: (scenA: ScenarioPreset, scenB: ScenarioPreset) => Promise<void>;
  loadScenarioPresets: () => Promise<{ scenA: ScenarioPreset; scenB: ScenarioPreset } | null>;
  resetToDemo: (role?: UserRole, randomize?: boolean) => void;
};
