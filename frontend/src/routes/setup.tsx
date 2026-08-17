import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Briefcase, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTwin, type Profile, type UserRole, ROLE_CONFIGS } from "@/lib/twin-store";
import { toast } from "sonner";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Set up your twin — Digital Twin" },
      { name: "description", content: "Answer a few questions so your twin can model your life." },
      { property: "og:title", content: "Set up your twin — Digital Twin" },
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
      { key: "targetAge", question: "By what age do you want to be financially independent / launch your career?", hint: "Your target milestone horizon.", kind: "slider", min: 20, max: 35, step: 1 },
      { key: "monthlyIncome", question: "What comes in each month as pocket money, allowance, or part-time earnings?", hint: "Your monthly inflow in dollars.", kind: "slider", min: 0, max: 3000, step: 50, unit: "$" },
      { key: "monthlyExpenses", question: "What goes out each month for food, books, study supplies, and fun?", hint: "Your monthly spending.", kind: "slider", min: 0, max: 2000, step: 50, unit: "$" },
      { key: "netWorth", question: "How much pocket money / savings do you have saved so far?", hint: "Bank account plus cash saved.", kind: "number", unit: "$" },
      { key: "targetNetWorth", question: "What target savings milestone are you aiming for?", hint: "For tech gear, emergency fund, or graduation trip.", kind: "number", unit: "$" },
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
  const { state, updateProfile } = useTwin();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // step 0 is Role Selection, step 1..N are questions
  const [dir, setDir] = useState<1 | -1>(1);
  const [draft, setDraft] = useState<Profile>(state.profile);

  const questions = useMemo(() => getQuestionsForRole(draft.role), [draft.role]);
  const totalSteps = questions.length + 1; // +1 for the role selection step
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSelectRole = (role: UserRole) => {
    const cfg = ROLE_CONFIGS[role];
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

  const next = () => {
    if (step === totalSteps - 1) {
      const savingsRate = Math.max(
        0,
        Math.round(
          ((draft.monthlyIncome - draft.monthlyExpenses) / Math.max(1, draft.monthlyIncome)) * 100,
        ),
      );
      updateProfile({ ...draft, savingsRate, onboarded: true });
      toast.success("Twin initialized with your personalized persona!");
      navigate({ to: "/" });
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
      <div className="h-0.5 w-full bg-border">
        <div
          className="h-full bg-foreground transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-6 py-10">
        <div
          key={step}
          className="w-full max-w-xl"
          style={{
            animation: `slide-q 420ms cubic-bezier(.22,1,.36,1) both`,
            ["--from" as string]: dir === 1 ? "56px" : "-56px",
          }}
        >
          <p className="label-xs">
            Step {step + 1} of {totalSteps}
          </p>

          {isRoleStep ? (
            <div>
              <h1 className="mt-3 font-display text-3xl font-semibold leading-tight md:text-4xl">
                Who are you?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Select your role. Your twin will adapt its questions, wealth vocabulary, task planner, and AI advice specifically for your journey.
              </p>

              <div className="mt-8 grid gap-4">
                {/* Option 1: Student */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("student")}
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                    draft.role === "student"
                      ? "border-foreground bg-accent/60 shadow-[0_0_20px_-8px_var(--color-foreground)]"
                      : "border-border bg-muted/20 hover:border-foreground/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="rounded-lg bg-background p-3 border border-border shrink-0">
                    <GraduationCap className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-base">Student</h3>
                      {draft.role === "student" && <span className="text-xs bg-foreground text-background font-semibold px-2 py-0.5 rounded-full">Selected</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      In school, college, or learning. Model study blocks, exam goals, habit streaks, and pocket money savings.
                    </p>
                  </div>
                </button>

                {/* Option 2: Professional */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("professional")}
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                    draft.role === "professional"
                      ? "border-foreground bg-accent/60 shadow-[0_0_20px_-8px_var(--color-foreground)]"
                      : "border-border bg-muted/20 hover:border-foreground/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="rounded-lg bg-background p-3 border border-border shrink-0">
                    <Briefcase className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-base">Working Professional</h3>
                      {draft.role === "professional" && <span className="text-xs bg-foreground text-background font-semibold px-2 py-0.5 rounded-full">Selected</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Job, freelancing, or career. Model monthly salary, 401(k) / retirement net worth, upskilling, and work-life balance.
                    </p>
                  </div>
                </button>

                {/* Option 3: Retiree */}
                <button
                  type="button"
                  onClick={() => handleSelectRole("retiree")}
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                    draft.role === "retiree"
                      ? "border-foreground bg-accent/60 shadow-[0_0_20px_-8px_var(--color-foreground)]"
                      : "border-border bg-muted/20 hover:border-foreground/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="rounded-lg bg-background p-3 border border-border shrink-0">
                    <HeartHandshake className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-base">Retiree / Senior</h3>
                      {draft.role === "retiree" && <span className="text-xs bg-foreground text-background font-semibold px-2 py-0.5 rounded-full">Selected</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Retired or financially independent. Model pension drawdown, healthcare buffer, active walking, and legacy goals.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            currentQ && (
              <div>
                <h1 className="mt-3 font-display text-3xl font-semibold leading-tight md:text-4xl">
                  {currentQ.question}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{currentQ.hint}</p>

                <div className="mt-10">
                  {currentQ.kind === "slider" ? (
                    <div>
                      <div className="font-display text-5xl font-semibold tabular-nums">
                        {currentQ.unit === "$" ? "$" : ""}
                        {Number(value).toLocaleString()}
                        {currentQ.unit && currentQ.unit !== "$" ? currentQ.unit : ""}
                      </div>
                      <Slider
                        className="mt-8"
                        min={currentQ.min}
                        max={currentQ.max}
                        step={currentQ.step}
                        value={[Number(value)]}
                        onValueChange={([v]) => setDraft({ ...draft, [currentQ.key]: v })}
                      />
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>{currentQ.min}</span>
                        <span>{currentQ.max}</span>
                      </div>
                    </div>
                  ) : (
                    <Input
                      autoFocus
                      type={currentQ.kind === "number" ? "number" : "text"}
                      value={String(value ?? "")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [currentQ.key]: currentQ.kind === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      className="h-14 border-0 border-b border-border bg-transparent px-0 font-display !text-3xl shadow-none focus-visible:ring-0"
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
