import type { UserRole, Profile, Log, TwinState } from "./types";

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
    wealthTitle: "Preservation & Longevity",
    wealthSubtitle: "Simulate portfolio sustainability, health buffers, and legacy growth.",
    defaultAge: 65,
    defaultTargetAge: 85,
    defaultIncome: 3200,
    defaultExpenses: 2200,
    defaultNetWorth: 450000,
    defaultTargetNetWorth: 600000,
    taskCategories: ["Vitality", "Health", "Family", "Hobbies", "Finance", "Social"],
    hasStudyIntelligence: false,
  },
};

export const DEFAULT_PROFILE: Profile = {
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

export const DEFAULT_STATE: TwinState = {
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

export const STORAGE_KEY = "digital-twin-state";

export function generateDemoLogs(days = 30, role: UserRole = "professional"): Log[] {
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

export function buildDemoProfile(role: UserRole = "professional", randomize = false): Profile {
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
