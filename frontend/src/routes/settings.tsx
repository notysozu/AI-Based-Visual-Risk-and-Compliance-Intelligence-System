import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  User,
  Sparkles,
  Sliders,
  Moon,
  Sun,
  Shield,
  Download,
  RotateCcw,
  Check,
  Save,
  Briefcase,
  GraduationCap,
  Laptop,
  Rocket,
  HeartPulse,
  Clock,
  TrendingUp,
  Brain,
  DollarSign,
  Activity,
  AlertTriangle,
  ChevronRight,
  Zap,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useGuard } from "@/lib/use-guard";
import {
  useTwin,
  money,
  type Profile,
  type UserRole,
  getRoleConfig
} from "@/lib/twin-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — VisualRisk AI" },
      { name: "description", content: "Configure your twin persona, telemetry baselines, financial compounding, and AI intelligence." },
      { property: "og:title", content: "Settings — VisualRisk AI" },
    ],
  }),
  component: SettingsPage,
});

const ROLE_OPTIONS: {
  role: UserRole;
  title: string;
  desc: string;
  icon: any;
  badgeColor: string;
  focusHighlight: string;
}[] = [
  {
    role: "student",
    title: "Student / Academic",
    desc: "Optimized for exam prep, coursework sprints, sleep hygiene, and pocket budgeting.",
    icon: GraduationCap,
    badgeColor: "clay-badge-purple",
    focusHighlight: "Study Hours & Cognitive Retention"
  },
  {
    role: "professional",
    title: "Working Professional",
    desc: "Calibrated for career growth, salary compounding, retirement goals, and peak focus blocks.",
    icon: Briefcase,
    badgeColor: "clay-badge-indigo",
    focusHighlight: "Career Velocity & Net Worth Growth"
  },
  {
    role: "freelancer",
    title: "Freelancer / Creator",
    desc: "Tailored for client deliverable deep work, variable cash flow buffers, and billable hours.",
    icon: Laptop,
    badgeColor: "clay-badge-amber",
    focusHighlight: "Client Runway & High-Rate Output"
  },
  {
    role: "entrepreneur",
    title: "Founder / Entrepreneur",
    desc: "Engineered for startup runway, venture risk analysis, equity milestones, and leverage sprints.",
    icon: Rocket,
    badgeColor: "clay-badge-rose",
    focusHighlight: "Startup Runway & High-Leverage Strategy"
  },
  {
    role: "retiree",
    title: "Retiree / Senior",
    desc: "Structured for capital preservation, longevity routines, active wellness, and lifestyle peace.",
    icon: HeartPulse,
    badgeColor: "clay-badge-emerald",
    focusHighlight: "Longevity & Capital Preservation"
  }
];

function SettingsPage() {
  const ok = useGuard();
  const navigate = useNavigate();
  const { state, updateProfile, setTheme, reset, loadDemo } = useTwin();

  const [draft, setDraft] = useState<Profile>(state.profile);
  const [activeTab, setActiveTab] = useState<string>("persona");
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // AI Twin Specific Settings
  const [thinkModeDefault, setThinkModeDefault] = useState(true);
  const [simulationTrials, setSimulationTrials] = useState(500);
  const [suggestionIntensity, setSuggestionIntensity] = useState<"conservative" | "balanced" | "proactive">("proactive");

  if (!ok) return null;

  const cfg = getRoleConfig(draft.role);

  // Calculate live changes and financial metrics
  const hasChanges = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(state.profile);
  }, [draft, state.profile]);

  const monthlySavings = Math.max(0, draft.monthlyIncome - draft.monthlyExpenses);
  const calculatedSavingsRate = draft.monthlyIncome > 0 ? Math.round((monthlySavings / draft.monthlyIncome) * 100) : 0;
  
  // 5-Year compound projection estimate at 8% CAGR
  const annualSavings = monthlySavings * 12;
  const compounded5Y = draft.netWorth * Math.pow(1.08, 5) + annualSavings * ((Math.pow(1.08, 5) - 1) / 0.08);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(draft);
      toast.success("Settings & twin telemetry updated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(state.profile);
    toast.info("Changes reverted to saved values");
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `digital_twin_${draft.name.toLowerCase().replace(/\s+/g, "_")}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Digital Twin profile data exported as JSON");
  };

  return (
    <AppShell
      title="Settings"
      subtitle="Manage your Digital Twin persona, telemetry baselines, financial models, and AI engine."
      actions={
        hasChanges ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={handleDiscard} className="cursor-pointer">
              Discard Changes
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0071E3] hover:bg-[#0071E3]/90 text-white font-medium flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isSaving ? (
                <span className="flex items-center gap-1">Saving...</span>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6 pb-12">
        {/* Profile Identity Summary Banner */}
        <div className="panel p-5 sm:p-6 bg-gradient-to-r from-card via-card/80 to-muted/30 border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0071E3] via-indigo-600 to-purple-600 text-white font-bold font-display text-xl shadow-[0_4px_16px_rgba(0,113,227,0.35)] shrink-0">
              {(draft.name || "D")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{draft.name || "Digital Twin User"}</h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                  draft.role === "student"
                    ? "clay-badge-purple"
                    : draft.role === "professional"
                    ? "clay-badge-indigo"
                    : draft.role === "freelancer"
                    ? "clay-badge-amber"
                    : draft.role === "entrepreneur"
                    ? "clay-badge-rose"
                    : "clay-badge-emerald"
                }`}>
                  {draft.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{draft.email || "local_user@digitaltwin.ai"}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
            <div className="px-3 py-1.5 rounded-xl bg-background/80 border border-border/60 text-xs flex items-center gap-1.5 shadow-2xs">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Baseline Sleep:</span>
              <strong className="text-foreground">{draft.sleepHours}h</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-background/80 border border-border/60 text-xs flex items-center gap-1.5 shadow-2xs">
              <DollarSign className="h-3.5 w-3.5 text-[#0071E3]" />
              <span className="text-muted-foreground">Savings Pace:</span>
              <strong className="text-emerald-500">${monthlySavings.toLocaleString()}/mo</strong>
            </div>
          </div>
        </div>

        {/* Interactive Tabs Header */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto p-1 bg-muted/60 dark:bg-white/5 border border-border/60 rounded-2xl h-auto gap-1">
            <TabsTrigger
              value="persona"
              className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-indigo-500" />
              <span>Persona & Role</span>
            </TabsTrigger>

            <TabsTrigger
              value="biometrics"
              className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-purple-500" />
              <span>Biometrics & Routine</span>
            </TabsTrigger>

            <TabsTrigger
              value="finances"
              className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              <span>Financial Telemetry</span>
            </TabsTrigger>

            <TabsTrigger
              value="ai"
              className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Brain className="h-3.5 w-3.5 text-[#0071E3]" />
              <span>AI Intelligence Engine</span>
            </TabsTrigger>

            <TabsTrigger
              value="system"
              className="rounded-xl px-4 py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5 text-zinc-500" />
              <span>System & Data</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================= */}
          {/* TAB 1: PERSONA & ROLE SELECTION                           */}
          {/* ========================================================= */}
          <TabsContent value="persona" className="space-y-6">
            <div className="panel p-6 space-y-5">
              <div>
                <h4 className="text-base font-semibold text-foreground">Select Your Twin Persona</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your active role dynamically adapts the AI advisor's advice, scheduling algorithms, and financial projections.
                </p>
              </div>

              {/* 5 Interactive Persona Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = draft.role === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setDraft({ ...draft, role: opt.role })}
                      className={`p-4 rounded-2xl border text-left transition-all relative group cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#0071E3]/5 dark:bg-[#0071E3]/10 border-[#0071E3] ring-2 ring-[#0071E3]/20 shadow-sm"
                          : "bg-card dark:bg-white/5 border-border/70 hover:border-border dark:hover:border-white/20 hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl border ${isSelected ? "bg-[#0071E3] text-white border-[#0071E3]" : "bg-muted dark:bg-white/10 text-foreground border-border/50"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-sm text-foreground">{opt.title}</span>
                          </div>
                          {isSelected && (
                            <span className="h-5 w-5 rounded-full bg-[#0071E3] text-white flex items-center justify-center shadow-xs">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Focus Target:</span>
                        <span className="font-medium text-[#0071E3] dark:text-blue-400">{opt.focusHighlight}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* General User Identity Inputs */}
              <div className="pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Full Name / Display Alias</Label>
                  <Input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Alex Mercer"
                    className="rounded-xl bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Current Age</Label>
                  <Input
                    type="number"
                    value={draft.age}
                    onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })}
                    className="rounded-xl bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Primary Goal Title</Label>
                  <Input
                    type="text"
                    value={draft.goalName}
                    onChange={(e) => setDraft({ ...draft, goalName: e.target.value })}
                    placeholder="e.g. Emergency Fund"
                    className="rounded-xl bg-background"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 2: BIOMETRICS & ROUTINE TELEMETRY                     */}
          {/* ========================================================= */}
          <TabsContent value="biometrics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Sleep Hygiene & Baseline */}
              <div className="panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Sleep Baseline</h4>
                      <p className="text-[11px] text-muted-foreground">Nightly restorative sleep duration</p>
                    </div>
                  </div>
                  <span className="font-mono text-base font-bold text-[#0071E3] bg-[#0071E3]/10 px-2.5 py-0.5 rounded-lg">
                    {draft.sleepHours} hrs
                  </span>
                </div>

                <Slider
                  min={4}
                  max={12}
                  step={0.5}
                  value={[draft.sleepHours]}
                  onValueChange={(vals) => setDraft({ ...draft, sleepHours: vals[0] })}
                  className="py-2"
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>4 hrs (Severe Deficit)</span>
                  <span className="text-emerald-500 font-medium">Optimal: 7.5 - 8.5 hrs</span>
                  <span>12 hrs (Oversleep)</span>
                </div>
              </div>

              {/* Study & Upskilling Target */}
              <div className="panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{cfg.studyLabel}</h4>
                      <p className="text-[11px] text-muted-foreground">Weekly dedicated cognitive focus hours</p>
                    </div>
                  </div>
                  <span className="font-mono text-base font-bold text-purple-500 bg-purple-500/10 px-2.5 py-0.5 rounded-lg">
                    {draft.studyHours} hrs/wk
                  </span>
                </div>

                <Slider
                  min={0}
                  max={40}
                  step={1}
                  value={[draft.studyHours]}
                  onValueChange={(vals) => setDraft({ ...draft, studyHours: vals[0] })}
                  className="py-2"
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>0 hrs</span>
                  <span className="text-purple-500 font-medium">Daily Avg: {(draft.studyHours / 7).toFixed(1)} hrs/day</span>
                  <span>40 hrs/wk</span>
                </div>
              </div>

              {/* Screen Time Cap */}
              <div className="panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Screen Time Cap</h4>
                      <p className="text-[11px] text-muted-foreground">Non-work leisure screen exposure limit</p>
                    </div>
                  </div>
                  <span className="font-mono text-base font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-lg">
                    {draft.screenTime} hrs/day
                  </span>
                </div>

                <Slider
                  min={1}
                  max={14}
                  step={0.5}
                  value={[draft.screenTime]}
                  onValueChange={(vals) => setDraft({ ...draft, screenTime: vals[0] })}
                  className="py-2"
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>1 hr (Minimal)</span>
                  <span className="text-amber-500 font-medium">Cap: {draft.screenTime}h</span>
                  <span>14 hrs (High Burnout)</span>
                </div>
              </div>

              {/* Weekly Active Exercise Days */}
              <div className="panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <HeartPulse className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Exercise & Physical Vitality</h4>
                      <p className="text-[11px] text-muted-foreground">Active workout / cardio days per week</p>
                    </div>
                  </div>
                  <span className="font-mono text-base font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg">
                    {draft.exerciseDays} days/wk
                  </span>
                </div>

                {/* Interactive 7 Day Pill Selectors */}
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const isActive = day <= draft.exerciseDays;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setDraft({ ...draft, exerciseDays: day })}
                        className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-emerald-500 text-white shadow-2xs"
                            : "bg-muted dark:bg-white/5 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {day}d
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {draft.exerciseDays >= 4
                    ? "✨ Optimal vitality zone (+1.2 Health Index boost)."
                    : "⚠️ Increasing to 4+ days stabilizes deep sleep cycles."}
                </p>
              </div>
            </div>

            {/* Focus Area Customization */}
            <div className="panel p-6 space-y-3">
              <Label className="text-xs font-semibold">Primary Skill & Focus Area</Label>
              <Input
                type="text"
                value={draft.focusArea}
                onChange={(e) => setDraft({ ...draft, focusArea: e.target.value })}
                placeholder="e.g. Distributed Systems, Venture Scaling, CFA Exam"
                className="rounded-xl bg-background"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {["Software Architecture", "Financial Modeling", "Deep Learning", "Startup Growth", "Physical Longevity"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setDraft({ ...draft, focusArea: tag })}
                    className="px-2.5 py-1 rounded-lg bg-muted/60 dark:bg-white/5 hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 3: FINANCIAL TELEMETRY & COMPOUNDING                  */}
          {/* ========================================================= */}
          <TabsContent value="finances" className="space-y-6">
            {/* Live Financial Health KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="panel p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20">
                <span className="text-xs text-muted-foreground">Calculated Monthly Surplus</span>
                <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">
                  ${monthlySavings.toLocaleString()}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {calculatedSavingsRate}% Savings Rate
                </span>
              </div>

              <div className="panel p-4 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20">
                <span className="text-xs text-muted-foreground">Current Net Worth</span>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">
                  ${draft.netWorth.toLocaleString()}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Target: ${draft.targetNetWorth.toLocaleString()} by age {draft.targetAge}
                </span>
              </div>

              <div className="panel p-4 bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20">
                <span className="text-xs text-muted-foreground">5-Year Compounded Projection</span>
                <p className="text-2xl font-bold font-mono text-purple-500 mt-1">
                  ${Math.round(compounded5Y).toLocaleString()}
                </p>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  At 8.0% historical index CAGR
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Cash Flow Inputs */}
              <div className="panel p-6 space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Monthly Cash Flow</h4>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{cfg.incomeLabel} ($/month)</Label>
                    <Input
                      type="number"
                      value={draft.monthlyIncome}
                      onChange={(e) => setDraft({ ...draft, monthlyIncome: Number(e.target.value) })}
                      className="rounded-xl bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{cfg.expensesLabel} ($/month)</Label>
                    <Input
                      type="number"
                      value={draft.monthlyExpenses}
                      onChange={(e) => setDraft({ ...draft, monthlyExpenses: Number(e.target.value) })}
                      className="rounded-xl bg-background font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Long-Term Milestone Goal */}
              <div className="panel p-6 space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Active Milestone Goal</h4>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Milestone Target ($)</Label>
                    <Input
                      type="number"
                      value={draft.goalTarget}
                      onChange={(e) => setDraft({ ...draft, goalTarget: Number(e.target.value) })}
                      className="rounded-xl bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Current Saved Toward Goal ($)</Label>
                    <Input
                      type="number"
                      value={draft.goalCurrent}
                      onChange={(e) => setDraft({ ...draft, goalCurrent: Number(e.target.value) })}
                      className="rounded-xl bg-background font-mono"
                    />
                  </div>

                  {/* Visual Completion Progress Bar */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{draft.goalName || "Milestone Goal"} Progress</span>
                      <strong className="text-foreground">
                        {draft.goalTarget > 0 ? Math.min(100, Math.round((draft.goalCurrent / draft.goalTarget) * 100)) : 0}%
                      </strong>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0071E3] to-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${draft.goalTarget > 0 ? Math.min(100, (draft.goalCurrent / draft.goalTarget) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Retirement & Net Worth */}
              <div className="panel p-6 space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Target Wealth & Age Horizon</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sets the terminal target threshold for Monte Carlo stochastic retirement runs.
                    </p>
                  </div>
                  <span className="font-mono text-base font-bold text-foreground bg-muted px-3 py-1 rounded-xl">
                    Age {draft.targetAge} ➔ ${draft.targetNetWorth.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Current Net Worth ($)</Label>
                    <Input
                      type="number"
                      value={draft.netWorth}
                      onChange={(e) => setDraft({ ...draft, netWorth: Number(e.target.value) })}
                      className="rounded-xl bg-background font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Target Net Worth ($)</Label>
                    <Input
                      type="number"
                      value={draft.targetNetWorth}
                      onChange={(e) => setDraft({ ...draft, targetNetWorth: Number(e.target.value) })}
                      className="rounded-xl bg-background font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Target Age: {draft.targetAge} years</span>
                    <span>Years Remaining: {Math.max(0, draft.targetAge - draft.age)} years</span>
                  </div>
                  <Slider
                    min={Math.max(30, draft.age + 1)}
                    max={85}
                    step={1}
                    value={[draft.targetAge]}
                    onValueChange={(vals) => setDraft({ ...draft, targetAge: vals[0] })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 4: AI INTELLIGENCE & COPILOT ENGINE                   */}
          {/* ========================================================= */}
          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Reasoning Think Mode Default */}
              <div className="panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Chain-of-Thought Reasoning</h4>
                      <p className="text-xs text-muted-foreground">Include &lt;think&gt; disclosures in AI responses</p>
                    </div>
                  </div>
                  <Switch
                    checked={thinkModeDefault}
                    onCheckedChange={(val) => {
                      setThinkModeDefault(val);
                      toast.success(val ? "Default Think Mode activated" : "Direct Mode activated");
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When enabled, your Digital Twin will reveal step-by-step telemetry math, circadian peak evaluations, and 5-year opportunity cost calculations.
                </p>
              </div>

              {/* Monte Carlo Simulation Depth */}
              <div className="panel p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Monte Carlo Simulation Depth</h4>
                      <p className="text-xs text-muted-foreground">Number of stochastic market trials</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-purple-500 bg-purple-500/10 px-2.5 py-0.5 rounded-lg">
                    {simulationTrials} Trials
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[250, 500, 1000].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setSimulationTrials(count);
                        toast.info(`Set to ${count} stochastic trials`);
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        simulationTrials === count
                          ? "bg-purple-600 text-white shadow-2xs"
                          : "bg-muted dark:bg-white/5 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {count} Runs
                    </button>
                  ))}
                </div>
              </div>

              {/* Proactive Task & Routine Scheduling Sensitivity */}
              <div className="panel p-6 space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Proactive Intelligence Calibration</h4>
                      <p className="text-xs text-muted-foreground">Controls how assertively the twin suggests schedule optimizations</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    {suggestionIntensity}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {(
                    [
                      { id: "conservative", title: "Conservative", desc: "Suggests tasks only when explicitly prompted." },
                      { id: "balanced", title: "Balanced", desc: "Suggests daily blocks when routine imbalances occur." },
                      { id: "proactive", title: "Hyper-Proactive", desc: "Actively designs full daily routines & multi-task schedules." }
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSuggestionIntensity(item.id);
                        toast.info(`AI mode set to ${item.title}`);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        suggestionIntensity === item.id
                          ? "bg-emerald-500/10 border-emerald-500/40 text-foreground ring-1 ring-emerald-500/20"
                          : "bg-muted/40 dark:bg-white/5 border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="font-semibold text-xs text-foreground block">{item.title}</span>
                      <span className="text-[11px] text-muted-foreground mt-1 block leading-snug">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 5: SYSTEM, PREFERENCES & DATA MANAGEMENT              */}
          {/* ========================================================= */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Appearance / Theme Selector */}
              <div className="panel p-6 space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Appearance & Theme</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      state.theme === "light"
                        ? "bg-amber-500/10 border-amber-500 text-foreground ring-1 ring-amber-500/20"
                        : "bg-muted/40 dark:bg-white/5 border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-semibold">Light Theme</span>
                    </div>
                    {state.theme === "light" && <Check className="h-3.5 w-3.5 text-amber-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      state.theme === "dark"
                        ? "bg-blue-500/10 border-blue-500 text-foreground ring-1 ring-blue-500/20"
                        : "bg-muted/40 dark:bg-white/5 border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Moon className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-semibold">Dark Theme</span>
                    </div>
                    {state.theme === "dark" && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </button>
                </div>
              </div>

              {/* Data Export & Backup */}
              <div className="panel p-6 space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Export Digital Twin Data</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download an offline snapshot of your complete profile, habit logs, task schedule, and financial simulations.
                </p>
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="w-full justify-center gap-2 rounded-xl cursor-pointer"
                >
                  <Download className="h-4 w-4 text-[#0071E3]" />
                  <span>Download Telemetry JSON</span>
                </Button>
              </div>

              {/* Maintenance & Onboarding Setup */}
              <div className="panel p-6 space-y-4 lg:col-span-2">
                <h4 className="text-sm font-semibold text-foreground">Twin Maintenance & Reset Controls</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/setup" })}
                    className="justify-center gap-2 rounded-xl cursor-pointer h-11"
                  >
                    <Sliders className="h-4 w-4 text-indigo-500" />
                    <span>Re-run Setup Wizard</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      loadDemo();
                      toast.success("Loaded default demo parameters");
                    }}
                    className="justify-center gap-2 rounded-xl cursor-pointer h-11"
                  >
                    <RotateCcw className="h-4 w-4 text-emerald-500" />
                    <span>Reload Demo Twin</span>
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setShowResetConfirm(true)}
                    className="justify-center gap-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer h-11"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Factory Reset All Data</span>
                  </Button>
                </div>

                {showResetConfirm && (
                  <div className="mt-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                    <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Are you sure you want to erase all local data?</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      This will reset your profile, habit records, study sessions, and financial transactions to empty defaults.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          reset();
                          toast.success("All local data cleared");
                          navigate({ to: "/" });
                        }}
                        className="cursor-pointer"
                      >
                        Yes, Erase Everything
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowResetConfirm(false)}
                        className="cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
