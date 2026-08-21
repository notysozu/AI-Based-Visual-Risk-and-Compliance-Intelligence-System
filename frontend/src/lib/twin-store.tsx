
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createUser, getUserByUsername, getDefaultUser, getForecast, getUser, updateUser, adoptSuggestionApi } from "@/lib/api";

// --- Types ---

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

/** 500-iteration Monte Carlo forecast response payload */
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
  role: "professional",
  onboarded: false,
  age: 25,
  targetAge: 60,
  sleepHours: 7.5,
  exerciseDays: 3,
  screenTime: 4,
  studyHours: 10,
  savingsRate: 20,
  monthlyIncome: 5000,
  monthlyExpenses: 2900,
  netWorth: 15000,
  targetNetWorth: 1000000,
  focusArea: "Career progression",
  goalName: "Emergency Fund",
  goalCurrent: 15000,
  goalTarget: 20000,
  lastSuccessOdds: null,
  lastWealthPrediction: null,
  lastAnalyticsSummary: null,
  lastAnalyticsUpdated: null,
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

function generateDemoLogs(days = 30, role: UserRole = "professional"): Log[] {
  const logs: Log[] = [];
  const now = new Date();
  for (let i = days; i > 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    
    let sleep = +(6.5 + Math.random() * 1.8).toFixed(1);
    let screen = +(2.5 + Math.random() * 3.5).toFixed(1);
    let study = +(1.0 + Math.random() * 2.5).toFixed(1);
    let exercise = Math.round(15 + Math.random() * 45);
    let mood = Math.round(5 + Math.random() * 5);

    if (role === "student") {
      sleep = +(6.0 + Math.random() * 2.5).toFixed(1);
      screen = +(3.0 + Math.random() * 3.5).toFixed(1);
      study = +(2.0 + Math.random() * 3.5).toFixed(1);
      exercise = Math.round(10 + Math.random() * 40);
    } else if (role === "freelancer") {
      sleep = +(6.5 + Math.random() * 2.0).toFixed(1);
      screen = +(4.0 + Math.random() * 4.0).toFixed(1);
      study = +(1.2 + Math.random() * 2.5).toFixed(1);
    } else if (role === "entrepreneur") {
      sleep = +(5.8 + Math.random() * 2.2).toFixed(1);
      screen = +(4.5 + Math.random() * 4.0).toFixed(1);
      study = +(1.5 + Math.random() * 3.0).toFixed(1);
      exercise = Math.round(20 + Math.random() * 45);
    } else if (role === "retiree") {
      sleep = +(7.0 + Math.random() * 2.0).toFixed(1);
      screen = +(1.5 + Math.random() * 2.5).toFixed(1);
      study = +(1.5 + Math.random() * 2.5).toFixed(1);
      exercise = Math.round(30 + Math.random() * 45);
    }

    logs.push({
      id: `${date}-demo`,
      date,
      sleep,
      screen,
      study,
      exercise,
      mood,
    });
  }
  return logs;
}

export /** Generates pre-calibrated baseline profile for demo persona */
function buildDemoProfile(role: UserRole = "professional", randomize = false): Profile {
  const baseDefaults = {
    id: 1,
    onboarded: true,
    lastSuccessOdds: null,
    lastWealthPrediction: null,
    lastAnalyticsSummary: null,
    lastAnalyticsUpdated: null,
  };

  if (role === "student") {
    const age = randomize ? 18 + Math.floor(Math.random() * 6) : 20;
    const targetAge = randomize ? age + 4 + Math.floor(Math.random() * 3) : 25;
    const income = randomize ? 500 + Math.floor(Math.random() * 12) * 50 : 850;
    const expenses = randomize ? 350 + Math.floor(Math.random() * 8) * 50 : 520;
    const savingsRate = Math.max(0, Math.round(((income - expenses) / Math.max(1, income)) * 100));
    return {
      ...baseDefaults,
      name: randomize ? "Alex Rivera (Student - Randomized)" : "Alex Rivera (Student)",
      email: "student.demo@twin.local",
      role: "student",
      age,
      targetAge,
      sleepHours: randomize ? +(6.5 + Math.random() * 2).toFixed(1) : 7.5,
      exerciseDays: randomize ? Math.floor(2 + Math.random() * 4) : 3,
      screenTime: randomize ? +(3.0 + Math.random() * 3.5).toFixed(1) : 4.2,
      studyHours: randomize ? Math.floor(18 + Math.random() * 16) : 24,
      savingsRate,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      netWorth: randomize ? 800 + Math.floor(Math.random() * 20) * 100 : 1600,
      targetNetWorth: randomize ? 15000 + Math.floor(Math.random() * 10) * 1000 : 25000,
      focusArea: "Computer Science & Machine Learning Finals",
      goalName: "MacBook Pro & Tech Rig",
      goalCurrent: 1200,
      goalTarget: 2600,
    };
  }
  if (role === "freelancer") {
    const age = randomize ? 24 + Math.floor(Math.random() * 10) : 27;
    const targetAge = randomize ? age + 15 + Math.floor(Math.random() * 10) : 48;
    const income = randomize ? 5000 + Math.floor(Math.random() * 20) * 200 : 6800;
    const expenses = randomize ? 3200 + Math.floor(Math.random() * 10) * 150 : 3600;
    const savingsRate = Math.max(0, Math.round(((income - expenses) / Math.max(1, income)) * 100));
    return {
      ...baseDefaults,
      name: randomize ? "Samira Chen (Freelancer - Randomized)" : "Samira Chen (Freelancer)",
      email: "freelancer.demo@twin.local",
      role: "freelancer",
      age,
      targetAge,
      sleepHours: randomize ? +(6.5 + Math.random() * 2).toFixed(1) : 7.2,
      exerciseDays: randomize ? Math.floor(2 + Math.random() * 4) : 3,
      screenTime: randomize ? +(3.5 + Math.random() * 3).toFixed(1) : 5.0,
      studyHours: randomize ? Math.floor(8 + Math.random() * 12) : 12,
      savingsRate,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      netWorth: randomize ? 20000 + Math.floor(Math.random() * 25) * 1000 : 35000,
      targetNetWorth: randomize ? 600000 + Math.floor(Math.random() * 10) * 50000 : 850000,
      focusArea: "Retainer Client Acquisition & High-Ticket Inbound",
      goalName: "12-Month Living Runway Fund",
      goalCurrent: 24000,
      goalTarget: 48000,
    };
  }
  if (role === "entrepreneur") {
    const age = randomize ? 26 + Math.floor(Math.random() * 12) : 31;
    const targetAge = randomize ? age + 10 + Math.floor(Math.random() * 8) : 42;
    const income = randomize ? 6000 + Math.floor(Math.random() * 25) * 250 : 8000;
    const expenses = randomize ? 3800 + Math.floor(Math.random() * 12) * 150 : 4400;
    const savingsRate = Math.max(0, Math.round(((income - expenses) / Math.max(1, income)) * 100));
    return {
      ...baseDefaults,
      name: randomize ? "Marcus Vance (Founder - Randomized)" : "Marcus Vance (Founder)",
      email: "founder.demo@twin.local",
      role: "entrepreneur",
      age,
      targetAge,
      sleepHours: randomize ? +(5.5 + Math.random() * 2.5).toFixed(1) : 6.8,
      exerciseDays: randomize ? Math.floor(3 + Math.random() * 4) : 4,
      screenTime: randomize ? +(4.0 + Math.random() * 3).toFixed(1) : 6.2,
      studyHours: randomize ? Math.floor(12 + Math.random() * 14) : 16,
      savingsRate,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      netWorth: randomize ? 60000 + Math.floor(Math.random() * 40) * 2000 : 90000,
      targetNetWorth: randomize ? 2000000 + Math.floor(Math.random() * 20) * 100000 : 3000000,
      focusArea: "Seed Round Closing & Enterprise Expansion",
      goalName: "18-Month Business Capital Buffer",
      goalCurrent: 60000,
      goalTarget: 120000,
    };
  }
  if (role === "retiree") {
    const age = randomize ? 62 + Math.floor(Math.random() * 12) : 67;
    const targetAge = randomize ? age + 15 + Math.floor(Math.random() * 10) : 88;
    const income = randomize ? 3000 + Math.floor(Math.random() * 10) * 200 : 3600;
    const expenses = randomize ? 2000 + Math.floor(Math.random() * 8) * 150 : 2400;
    const savingsRate = Math.max(0, Math.round(((income - expenses) / Math.max(1, income)) * 100));
    return {
      ...baseDefaults,
      name: randomize ? "Eleanor Woods (Retiree - Randomized)" : "Eleanor Woods (Retiree)",
      email: "retiree.demo@twin.local",
      role: "retiree",
      age,
      targetAge,
      sleepHours: randomize ? +(7.0 + Math.random() * 2).toFixed(1) : 7.8,
      exerciseDays: randomize ? Math.floor(4 + Math.random() * 4) : 6,
      screenTime: randomize ? +(1.5 + Math.random() * 2.5).toFixed(1) : 2.5,
      studyHours: randomize ? Math.floor(8 + Math.random() * 10) : 12,
      savingsRate,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      netWorth: randomize ? 400000 + Math.floor(Math.random() * 25) * 15000 : 520000,
      targetNetWorth: randomize ? 550000 + Math.floor(Math.random() * 15) * 20000 : 650000,
      focusArea: "Daily Vitality, Gardening & Grandchildren",
      goalName: "Family Heritage Fund & World Tour",
      goalCurrent: 35000,
      goalTarget: 50000,
    };
  }
  // Default: Working Professional
  const age = randomize ? 25 + Math.floor(Math.random() * 12) : 29;
  const targetAge = randomize ? 50 + Math.floor(Math.random() * 15) : 55;
  const income = randomize ? 4500 + Math.floor(Math.random() * 15) * 200 : 5600;
  const expenses = randomize ? 2800 + Math.floor(Math.random() * 10) * 150 : 3400;
  const savingsRate = Math.max(0, Math.round(((income - expenses) / Math.max(1, income)) * 100));
  return {
    ...baseDefaults,
    name: randomize ? "Jordan Taylor (Professional - Randomized)" : "Jordan Taylor (Professional)",
    email: "pro.demo@twin.local",
    role: "professional",
    age,
    targetAge,
    sleepHours: randomize ? +(6.0 + Math.random() * 2).toFixed(1) : 7.0,
    exerciseDays: randomize ? Math.floor(2 + Math.random() * 4) : 4,
    screenTime: randomize ? +(2.5 + Math.random() * 3).toFixed(1) : 3.5,
    studyHours: randomize ? Math.floor(6 + Math.random() * 10) : 10,
    savingsRate,
    monthlyIncome: income,
    monthlyExpenses: expenses,
    netWorth: randomize ? 30000 + Math.floor(Math.random() * 30) * 1000 : 48000,
    targetNetWorth: randomize ? 800000 + Math.floor(Math.random() * 15) * 50000 : 1200000,
    focusArea: "Senior Engineering Promotion & 401(k)",
    goalName: "Home Down Payment Fund",
    goalCurrent: 32000,
    goalTarget: 60000,
  };
}

// --- Role Configurations & Dynamic Vocabulary ---

export type RoleConfig = {
  role: UserRole;
  name: string;
  badge: string;
  tagline: string;
  incomeLabel: string;
  expensesLabel: string;
  savingsLabel: string;
  targetSavingsLabel: string;
  targetAgeLabel: string;
  studyLabel: string;
  focusLabel: string;
  goalLabel: string;
  wealthTitle: string;
  wealthSubtitle: string;
  defaultAge: number;
  defaultTargetAge: number;
  defaultIncome: number;
  defaultExpenses: number;
  defaultNetWorth: number;
  defaultTargetNetWorth: number;
  taskCategories: string[];
  hasStudyIntelligence?: boolean;
};

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  student: {
    role: "student",
    name: "Student",
    badge: "Student",
    tagline: "Track coursework blocks, exam readiness, and pocket money savings.",
    incomeLabel: "Pocket Money / Allowance",
    expensesLabel: "Daily Student Expenses",
    savingsLabel: "Saved Pocket Money",
    targetSavingsLabel: "Target Savings Milestone",
    targetAgeLabel: "Target Career Launch Age",
    studyLabel: "Study & Coursework",
    focusLabel: "Academic / Skill Focus",
    goalLabel: "Student Goal (Gear/Courses)",
    wealthTitle: "Pocket Money & Savings",
    wealthSubtitle: "Model your savings rate, allowance growth, and milestone targets.",
    defaultAge: 20,
    defaultTargetAge: 25,
    defaultIncome: 800,
    defaultExpenses: 500,
    defaultNetWorth: 1200,
    defaultTargetNetWorth: 10000,
    taskCategories: ["Study", "Exams", "Campus", "Money", "Health", "Social"],
    hasStudyIntelligence: true,
  },
  professional: {
    role: "professional",
    name: "Working Professional",
    badge: "Professional",
    tagline: "Optimize salary growth, deep-work sprints, and retirement trajectory.",
    incomeLabel: "Monthly Take-Home Salary",
    expensesLabel: "Fixed & Living Costs",
    savingsLabel: "Current Net Worth",
    targetSavingsLabel: "Target Retirement Wealth",
    targetAgeLabel: "Target Retirement Age",
    studyLabel: "Upskilling & Learning",
    focusLabel: "Career / Project Focus",
    goalLabel: "Financial Goal (Assets/Home)",
    wealthTitle: "Wealth & Net Worth",
    wealthSubtitle: "Monte Carlo wealth projections, success odds, and retirement velocity.",
    defaultAge: 28,
    defaultTargetAge: 55,
    defaultIncome: 5000,
    defaultExpenses: 3200,
    defaultNetWorth: 35000,
    defaultTargetNetWorth: 1000000,
    taskCategories: ["Work", "Career", "Finance", "Health", "Upskilling", "Personal"],
    hasStudyIntelligence: false,
  },
  freelancer: {
    role: "freelancer",
    name: "Freelancer / Creator",
    badge: "Freelancer",
    tagline: "Manage variable invoice cashflow, client projects, and emergency runway.",
    incomeLabel: "Average Monthly Invoiced Revenue",
    expensesLabel: "Monthly Operating & Living Costs",
    savingsLabel: "Cash Buffer & Net Worth",
    targetSavingsLabel: "Target Emergency Runway & Wealth",
    targetAgeLabel: "Target Financial Freedom Age",
    studyLabel: "Skill Building & Portfolio Work",
    focusLabel: "Current Client or Portfolio Focus",
    goalLabel: "Freelance Goal (Runway/Gear)",
    wealthTitle: "Cashflow & Runway Planner",
    wealthSubtitle: "Simulate variable income, emergency buffers, and investment compounding.",
    defaultAge: 26,
    defaultTargetAge: 50,
    defaultIncome: 6500,
    defaultExpenses: 3800,
    defaultNetWorth: 25000,
    defaultTargetNetWorth: 800000,
    taskCategories: ["Client Work", "Projects", "Invoices", "Admin", "Health", "Upskilling"],
    hasStudyIntelligence: false,
  },
  entrepreneur: {
    role: "entrepreneur",
    name: "Founder / Entrepreneur",
    badge: "Founder",
    tagline: "Model startup runway, intensive build sprints, and equity/growth goals.",
    incomeLabel: "Founder Draw / Monthly Income",
    expensesLabel: "Personal & Business Fixed Costs",
    savingsLabel: "Liquid Capital & Net Worth",
    targetSavingsLabel: "Target Exit / Business Valuation",
    targetAgeLabel: "Target Exit / Independence Age",
    studyLabel: "Market Research & Strategic Learning",
    focusLabel: "Company Milestone Focus",
    goalLabel: "Venture Goal (Milestone/Launch)",
    wealthTitle: "Venture & Equity Wealth",
    wealthSubtitle: "Forecast personal runway, reinvestment pace, and equity realization.",
    defaultAge: 29,
    defaultTargetAge: 45,
    defaultIncome: 7000,
    defaultExpenses: 4200,
    defaultNetWorth: 60000,
    defaultTargetNetWorth: 2500000,
    taskCategories: ["Product", "Growth", "Fundraising", "Operations", "Team", "Health"],
    hasStudyIntelligence: false,
  },
  retiree: {
    role: "retiree",
    name: "Retiree / Senior",
    badge: "Retiree",
    tagline: "Preserve portfolio wealth, sustain pension drawdown, and protect health & vitality.",
    incomeLabel: "Monthly Pension / Passive Income",
    expensesLabel: "Healthcare & Living Expenses",
    savingsLabel: "Nest Egg & Portfolio",
    targetSavingsLabel: "Preservation & Legacy Target",
    targetAgeLabel: "Longevity Target Age",
    studyLabel: "Reading & Mind Hobbies",
    focusLabel: "Health & Lifestyle Focus",
    goalLabel: "Milestone Goal (Family/Travel)",
    wealthTitle: "Retirement & Longevity",
    wealthSubtitle: "Simulate portfolio sustainability, health buffer, and peace of mind.",
    defaultAge: 65,
    defaultTargetAge: 85,
    defaultIncome: 3500,
    defaultExpenses: 2400,
    defaultNetWorth: 450000,
    defaultTargetNetWorth: 600000,
    taskCategories: ["Health", "Hobbies", "Finance", "Family", "Home", "Leisure"],
    hasStudyIntelligence: false,
  },
};

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
    last_success_odds: profile.lastSuccessOdds,
    last_wealth_prediction: profile.lastWealthPrediction,
    last_analytics_summary: profile.lastAnalyticsSummary,
    last_analytics_updated: profile.lastAnalyticsUpdated,
  };
}

/** Maps backend User response to frontend Profile interface */
function mapBackendToProfile(user: any): Partial<Profile> {
  return {
    role: user.role ?? "professional",
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
    lastAnalyticsSummary: user.last_analytics_summary ?? null,
    lastAnalyticsUpdated: user.last_analytics_updated ?? null,
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

  const loadDemo = async (role: UserRole = "professional", randomize = false) => {
    let demoUserId: number = 1;
    try {
      const user = await getDefaultUser();
      if (user?.id) {
        demoUserId = user.id;
      }
    } catch (err) {
      console.warn("Failed to fetch default user from backend, using fallback ID 1:", err);
    }

    const demoProfile = buildDemoProfile(role, randomize);
    demoProfile.id = demoUserId;
    demoProfile.onboarded = true;

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