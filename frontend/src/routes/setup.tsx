import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Briefcase, Laptop, Rocket, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTwin, type Profile, type UserRole, ROLE_CONFIGS, money } from "@/lib/twin-store";
import { toast } from "sonner";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Set up your intelligence — Visual Risk AI" },
      { name: "description", content: "Answer a few questions so your twin can model your life." },
      { property: "og:title", content: "Set up your intelligence — Visual Risk AI" },
      {
        property: "og:description",
        content: "Answer a few questions so your twin can model your life.",
      },
    ],
  }),
  component: SetupPage,
});

type Q = {
  key: keyof Profile;
  question: string;
  hint: string;
  kind: "slider" | "text" | "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

function getQuestionsForRole(role: UserRole): Q[] {
  if (role === "student") {
    return [
      { key: "age", question: "How old are you?", hint: "Starting point of your student model.", kind: "slider", min: 14, max: 28, step: 1 },
      { key: "targetAge", question: "By what age do you want to launch your career / achieve independence?", hint: "Your target milestone horizon.", kind: "slider", min: 20, max: 35, step: 1 },
      { key: "monthlyIncome", question: "What comes in each month as pocket money, allowance, or part-time earnings?", hint: "Your monthly inflow in dollars.", kind: "slider", min: 0, max: 3000, step: 50, unit: "$" },
      { key: "monthlyExpenses", question: "What goes out each month for food, books, study supplies, and fun?", hint: "Your monthly spending.", kind: "slider", min: 0, max: 2000, step: 50, unit: "$" },
      { key: "netWorth", question: "How much pocket money / savings do you have saved so far?", hint: "Bank account plus cash saved.", kind: "number", unit: "$" },
      { key: "targetNetWorth", question: "What target savings milestone are you aiming for?", hint: "For tech gear, emergency fund, or graduation fund.", kind: "number", unit: "$" },
      { key: "sleepHours", question: "How many hours do you usually sleep?", hint: "Crucial for memory consolidation and exam focus.", kind: "slider", min: 4, max: 11, step: 0.5, unit: "h" },
      { key: "screenTime", question: "How much screen time on an average day outside of study?", hint: "Reels, games, social apps.", kind: "slider", min: 0, max: 12, step: 0.5, unit: "h" },
      { key: "studyHours", question: "Hours a week spent studying, doing coursework or homework?", hint: "Lectures, study sessions, reading.", kind: "slider", min: 0, max: 50, step: 1, unit: "h" },
      { key: "exerciseDays", question: "How many active movement or sports days per week?", hint: "Walking, gym, sports.", kind: "slider", min: 0, max: 7, step: 1 },
      { key: "focusArea", question: "What is your main academic or skill focus right now?", hint: "e.g. Computer Science exams, learning AI, passing finals.", kind: "text" },
      { key: "goalName", question: "Name your primary student goal.", hint: "Something you want to achieve soon.", kind: "text" },
      { key: "goalTarget", question: "What does this goal cost in total?", hint: "Total amount needed in dollars.", kind: "number", unit: "$" },
      { key: "goalCurrent", question: "How much have you saved toward it?", hint: "Already set aside.", kind: "number", unit: "$" },
    ];
  }

  if (role === "freelancer") {
    return [
      { key: "age", question: "How old are you?", hint: "Starting point of your freelance career trajectory.", kind: "slider", min: 18, max: 65, step: 1 },
      { key: "targetAge", question: "By what age do you want to reach complete financial independence?", hint: "Your financial freedom horizon.", kind: "slider", min: 35, max: 70, step: 1 },
      { key: "monthlyIncome", question: "What is your average monthly invoiced revenue?", hint: "Average monthly client billings.", kind: "slider", min: 500, max: 30000, step: 100, unit: "$" },
      { key: "monthlyExpenses", question: "What are your total monthly business and living expenses?", hint: "Software, home office, rent, bills, living costs.", kind: "slider", min: 400, max: 20000, step: 100, unit: "$" },
      { key: "netWorth", question: "How much cash buffer and liquid savings do you have?", hint: "Emergency runway plus investment portfolio.", kind: "number", unit: "$" },
      { key: "targetNetWorth", question: "What financial freedom net worth target do you aim for?", hint: "Target runway and long-term net worth.", kind: "number", unit: "$" },
      { key: "sleepHours", question: "How many hours do you usually sleep per night?", hint: "Essential for sustained creative clarity.", kind: "slider", min: 4, max: 11, step: 0.5, unit: "h" },
      { key: "screenTime", question: "How much recreational screen time outside of client work?", hint: "Social feeds, streaming, gaming.", kind: "slider", min: 0, max: 12, step: 0.5, unit: "h" },
      { key: "studyHours", question: "Hours a week spent on high-income skill building & portfolio work?", hint: "Upgrading tools, case studies, inbound marketing.", kind: "slider", min: 0, max: 40, step: 0.5, unit: "h" },
      { key: "exerciseDays", question: "How many active workout or movement days per week?", hint: "Combats sedentary desk fatigue.", kind: "slider", min: 0, max: 7, step: 1 },
      { key: "focusArea", question: "What is your current freelance focus or key project?", hint: "e.g. Scaling retainer clients, launching SaaS, brand revamp.", kind: "text" },
      { key: "goalName", question: "Name your primary freelance milestone goal.", hint: "e.g. 12-month runway fund, new workstation gear.", kind: "text" },
      { key: "goalTarget", question: "What is the dollar target for this goal?", hint: "Amount needed in dollars.", kind: "number", unit: "$" },
      { key: "goalCurrent", question: "How much do you currently have allocated?", hint: "Already set aside.", kind: "number", unit: "$" },
    ];
  }

  if (role === "entrepreneur") {
    return [
      { key: "age", question: "How old are you?", hint: "Starting point of your founder model.", kind: "slider", min: 18, max: 65, step: 1 },
      { key: "targetAge", question: "By what age do you aim for a major venture exit or financial freedom?", hint: "Target liquidity or exit age.", kind: "slider", min: 30, max: 65, step: 1 },
      { key: "monthlyIncome", question: "What is your monthly founder draw or take-home income?", hint: "Current personal salary from your venture.", kind: "slider", min: 500, max: 35000, step: 100, unit: "$" },
      { key: "monthlyExpenses", question: "What are your fixed monthly personal living expenses?", hint: "Living costs required to sustain your focus.", kind: "slider", min: 500, max: 25000, step: 100, unit: "$" },
      { key: "netWorth", question: "What is your current liquid net worth & capital reserve?", hint: "Personal cash, liquid assets, and investments.", kind: "number", unit: "$" },
      { key: "targetNetWorth", question: "What target equity value or exit net worth are you building toward?", hint: "Target exit valuation or liquid wealth.", kind: "number", unit: "$" },
      { key: "sleepHours", question: "How many hours of sleep do you average per night?", hint: "Protects executive decision-making and cognitive stamina.", kind: "slider", min: 4, max: 11, step: 0.5, unit: "h" },
      { key: "screenTime", question: "Recreational screen time per day outside of business operations?", hint: "Casual browsing, social media, entertainment.", kind: "slider", min: 0, max: 12, step: 0.5, unit: "h" },
      { key: "studyHours", question: "Hours a week spent on market research, strategy, and books?", hint: "Industry insights, strategy, and strategic learning.", kind: "slider", min: 0, max: 40, step: 0.5, unit: "h" },
      { key: "exerciseDays", question: "How many active training or physical wellness days per week?", hint: "Maintains high energy and stress resilience.", kind: "slider", min: 0, max: 7, step: 1 },
      { key: "focusArea", question: "What is your company's core strategic milestone right now?", hint: "e.g. Reaching $50k MRR, closing seed round, product launch.", kind: "text" },
      { key: "goalName", question: "Name your primary venture or personal milestone goal.", hint: "e.g. 18-month business runway, initial seed round.", kind: "text" },
      { key: "goalTarget", question: "What is the financial target for this goal?", hint: "Target in dollars.", kind: "number", unit: "$" },
      { key: "goalCurrent", question: "How much is currently banked toward it?", hint: "Already secured.", kind: "number", unit: "$" },
    ];
  }

  if (role === "retiree") {
    return [
      { key: "age", question: "How old are you?", hint: "Starting point of your longevity model.", kind: "slider", min: 55, max: 95, step: 1 },
      { key: "targetAge", question: "What longevity age horizon should your twin plan for?", hint: "Financial peace of mind horizon.", kind: "slider", min: 75, max: 100, step: 1 },
      { key: "monthlyIncome", question: "What comes in each month from pensions, annuities, or passive returns?", hint: "Monthly retirement inflow.", kind: "slider", min: 500, max: 15000, step: 100, unit: "$" },
      { key: "monthlyExpenses", question: "What goes out each month for healthcare, home living, and leisure?", hint: "Monthly retirement living costs.", kind: "slider", min: 300, max: 12000, step: 100, unit: "$" },
      { key: "netWorth", question: "What is your total retirement nest egg & portfolio value?", hint: "Savings, 401(k), investments, minus debt.", kind: "number", unit: "$" },
      { key: "targetNetWorth", question: "What preservation or family legacy target do you want to keep?", hint: "Target legacy or buffer amount.", kind: "number", unit: "$" },
      { key: "sleepHours", question: "How many hours do you usually sleep per night?", hint: "Restful sleep supports cognitive vitality.", kind: "slider", min: 4, max: 11, step: 0.5, unit: "h" },
      { key: "screenTime", question: "How much daily TV or screen time?", hint: "Shows, news, tablet browsing.", kind: "slider", min: 0, max: 12, step: 0.5, unit: "h" },
      { key: "studyHours", question: "Hours a week spent reading, crafting, gardening, or mind hobbies?", hint: "Keeping your mind active and engaged.", kind: "slider", min: 0, max: 40, step: 1, unit: "h" },
      { key: "exerciseDays", question: "How many active walking or movement days per week?", hint: "Daily walks, yoga, gardening.", kind: "slider", min: 0, max: 7, step: 1 },
      { key: "focusArea", question: "What is your main focus in this chapter of life?", hint: "e.g. Daily wellness, family time, travel, gardening.", kind: "text" },
      { key: "goalName", question: "Name a personal milestone you are planning.", hint: "e.g. Family vacation, home upgrade, grandchildren fund.", kind: "text" },
      { key: "goalTarget", question: "What does that milestone require?", hint: "Target amount in dollars.", kind: "number", unit: "$" },
      { key: "goalCurrent", question: "How much is currently set aside for it?", hint: "Already reserved.", kind: "number", unit: "$" },
    ];
  }

  // Default: Professional / Worker
  return [
    { key: "age", question: "How old are you?", hint: "Sets the starting point of every career projection.", kind: "slider", min: 20, max: 65, step: 1 },
    { key: "targetAge", question: "By what age do you plan to be financially free or retire?", hint: "Your target retirement horizon.", kind: "slider", min: 40, max: 75, step: 1 },
    { key: "monthlyIncome", question: "What is your monthly take-home salary or income?", hint: "Take-home income after tax.", kind: "slider", min: 500, max: 25000, step: 100, unit: "$" },
    { key: "monthlyExpenses", question: "What goes out each month for rent, bills, subscriptions, and living?", hint: "Total monthly fixed and variable spending.", kind: "slider", min: 300, max: 18000, step: 100, unit: "$" },
    { key: "netWorth", question: "What have you saved & invested so far?", hint: "Cash plus investments, minus any debt.", kind: "number", unit: "$" },
    { key: "targetNetWorth", question: "What retirement net worth target would feel like enough?", hint: "Your long-term retirement target.", kind: "number", unit: "$" },
    { key: "sleepHours", question: "How many hours do you usually sleep?", hint: "The single strongest driver of your focus score.", kind: "slider", min: 4, max: 11, step: 0.5, unit: "h" },
    { key: "screenTime", question: "How much leisure screen time on an average day?", hint: "Outside of work hours.", kind: "slider", min: 0, max: 12, step: 0.5, unit: "h" },
    { key: "studyHours", question: "Hours a week spent on upskilling, certifications, or side projects?", hint: "Courses, technical reading, building.", kind: "slider", min: 0, max: 40, step: 0.5, unit: "h" },
    { key: "exerciseDays", question: "How many active workout or gym days per week?", hint: "Any active movement counts.", kind: "slider", min: 0, max: 7, step: 1 },
    { key: "focusArea", question: "What is your primary career or life focus right now?", hint: "e.g. Senior promotion, launching a business, buying a home.", kind: "text" },
    { key: "goalName", question: "Name your primary financial milestone goal.", hint: "e.g. Home down payment, 6-month emergency buffer.", kind: "text" },
    { key: "goalTarget", question: "What does that goal cost?", hint: "The finish line in dollars.", kind: "number", unit: "$" },
    { key: "goalCurrent", question: "How much have you saved toward it?", hint: "Already saved toward this goal.", kind: "number", unit: "$" },
  ];
}

function SetupPage() {
  const { state, ready, updateProfile } = useTwin();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // step 0 is Role Selection, step 1..N are questions
  const [dir, setDir] = useState<1 | -1>(1);
  const [draft, setDraft] = useState<Profile>(() => ({
    ...DEFAULT_PROFILE,
    ...state.profile,
  }));

  // If not logged in, redirect to signup
  useEffect(() => {
    if (ready && !state.authed && !state.profile.id) {
      navigate({ to: "/signup" });
    }
  }, [ready, state.authed, state.profile.id, navigate]);

  // Keep draft profile synced with current user name and id
  useEffect(() => {
    if (state.profile?.name || state.profile?.email || state.profile?.id) {
      setDraft((prev) => ({
        ...prev,
        id: state.profile.id ?? prev.id,
        name: state.profile.name ?? prev.name,
        email: state.profile.email ?? prev.email,
        role: prev.role || state.profile.role || "professional",
      }));
    }
  }, [state.profile]);

  const questions = useMemo(() => getQuestionsForRole(draft?.role || "professional"), [draft?.role]);
  const totalSteps = questions.length + 1; // +1 for the role selection step
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSelectRole = (role: UserRole) => {
    const cfg = ROLE_CONFIGS[role] || ROLE_CONFIGS.professional;
    setDraft((prev) => ({
      ...prev,
      role,
      age: cfg.defaultAge,
      targetAge: cfg.defaultTargetAge,
      monthlyIncome: cfg.defaultIncome,
      monthlyExpenses: cfg.defaultExpenses,
      netWorth: cfg.defaultNetWorth,
      targetNetWorth: cfg.defaultTargetNetWorth,
    }));
  };

  const next = async () => {
    if (step === totalSteps - 1) {
      const savingsRate = Math.max(
        0,
        Math.round(
          ((draft.monthlyIncome - draft.monthlyExpenses) / Math.max(1, draft.monthlyIncome)) * 100,
        ),
      );
      const finalProfile: Profile = {
        ...draft,
        id: draft.id ?? state.profile.id ?? 1,
        savingsRate,
        onboarded: true,
      };
      await updateProfile(finalProfile);
      toast.success("Twin initialized with your personalized persona!");
      navigate({ to: "/dashboard" });
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
  };

  const isRoleStep = step === 0;
  const currentQ = !isRoleStep ? questions[step - 1] : null;
  const value = currentQ ? draft[currentQ.key] : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="px-6 pt-6">
        <div className="mx-auto max-w-xl h-2.5 w-full rounded-full bg-input shadow-[var(--clay-inset)] overflow-hidden border border-border/30">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[var(--clay-btn-primary)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
        <div
          key={step}
          className="panel-lg w-full max-w-xl p-6 sm:p-10"
          style={{
            animation: `slide-q 420ms cubic-bezier(.34,1.56,.64,1) both`,
            ["--from" as string]: dir === 1 ? "40px" : "-40px",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="label-xs">Step {step + 1} of {totalSteps}</span>
            <span className="text-xs font-mono font-semibold text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>

          {isRoleStep ? (
            <div>
              <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">Who are you?</h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Select your persona. Your twin will adapt its questions, wealth vocabulary, task planner, and AI advice specifically for your journey.</p>
              <div className="mt-6 grid gap-3.5">
                {[
                  { id: "student", icon: GraduationCap, iconClass: "clay-icon-purple", title: "Student", desc: "In school, college, or learning. Model study blocks, exam goals, habit streaks, and pocket money savings." },
                  { id: "professional", icon: Briefcase, iconClass: "clay-icon-indigo", title: "Working Professional", desc: "Salaried career. Model monthly salary, 401(k) / retirement net worth, upskilling, and deep-work sprints." },
                  { id: "freelancer", icon: Laptop, iconClass: "clay-icon-amber", title: "Freelancer / Creator", desc: "Independent contractor or creator. Model variable client invoicing, emergency runway, and creative sprints." },
                  { id: "entrepreneur", icon: Rocket, iconClass: "clay-icon-rose", title: "Founder / Entrepreneur", desc: "Building a startup or business. Model founder runway, equity targets, intensive build cycles, and growth milestones." },
                  { id: "retiree", icon: HeartHandshake, iconClass: "clay-icon-emerald", title: "Retiree / Senior", desc: "Preserve wealth, sustain pension drawdown, and protect daily health, hobbies, and peace of mind." },
                ].map((role) => (
                  <button key={role.id} type="button" onClick={() => handleSelectRole(role.id as UserRole)} className={`flex items-start gap-4 rounded-2xl border p-4 text-left cursor-pointer transition-all duration-150 ease-out active:scale-[0.98] ${draft.role === role.id ? "border-foreground bg-accent/70 shadow-[var(--clay-shadow)] translate-y-[-2px]" : "border-border/60 bg-card shadow-[var(--clay-shadow-sm)] hover:border-foreground/40 hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow)]"}`}>
                    <div className={`rounded-xl p-2.5 shrink-0 ${role.iconClass}`}>
                      <role.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-sm sm:text-base">{role.title}</h3>
                        {draft.role === role.id && <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full shadow-[var(--clay-btn-primary)]">Selected</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{role.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentQ && (
              <div>
                <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">{currentQ.question}</h1>
                {currentQ.hint && <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{currentQ.hint}</p>}
                <div className="mt-8">
                  {currentQ.kind === "slider" ? (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="font-display text-3xl sm:text-4xl font-bold tabular-nums">
                          {currentQ.unit === "$" ? money(Number(value)) : `${value}${currentQ.unit ?? ""}`}
                        </div>

                        {/* Direct Number Typing Input */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center">
                            {currentQ.unit === "$" && (
                              <span className="absolute left-3 text-sm font-semibold text-muted-foreground">$</span>
                            )}
                            <Input
                              type="number"
                              min={currentQ.min}
                              max={currentQ.max}
                              step={currentQ.step ?? 1}
                              value={Number.isNaN(Number(value)) ? "" : Number(value)}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                setDraft((p) => ({ ...p, [currentQ.key]: val }));
                              }}
                              onKeyDown={(e) => e.key === "Enter" && next()}
                              className={`w-32 h-11 text-base font-bold font-display rounded-xl text-right pr-3 shadow-[var(--clay-shadow-sm)] ${
                                currentQ.unit === "$" ? "pl-7" : "pl-3"
                              }`}
                              placeholder="Type value"
                            />
                            {currentQ.unit && currentQ.unit !== "$" && (
                              <span className="ml-2 text-xs font-semibold text-muted-foreground font-mono">{currentQ.unit}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Slider
                        min={currentQ.min}
                        max={currentQ.max}
                        step={currentQ.step ?? 1}
                        value={[Number(value) || currentQ.min || 0]}
                        onValueChange={([v]) => setDraft((p) => ({ ...p, [currentQ.key]: v }))}
                        className="py-2"
                      />
                    </div>
                  ) : (
                    <Input
                      autoFocus
                      type={currentQ.kind === "number" ? "number" : "text"}
                      value={String(value ?? "")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [currentQ.key]: currentQ.kind === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value,
                        })
                      }
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      className="h-14 font-display text-2xl sm:text-3xl rounded-2xl shadow-[var(--clay-shadow-sm)]"
                      placeholder="Type your answer"
                    />
                  )}
                </div>
              </div>
            )
          )}

          <div className="mt-12 flex items-center gap-3">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => {
                setDir(-1);
                setStep((s) => Math.max(0, s - 1));
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={next}>
              {step === totalSteps - 1 ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Finish setup
                </>
              ) : (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <style>{`@keyframes slide-q { from { opacity:0; transform: translateX(var(--from)); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}
