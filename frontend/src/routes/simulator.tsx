
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AIIntelligenceCard } from "@/components/ai-intelligence-card";
import { useGuard } from "@/lib/use-guard";
import { focusIndex, healthIndex, money, projectNetWorth, useTwin } from "@/lib/twin-store";
import { tooltipStyle } from "@/routes/dashboard";
import { compareScenarios, getScenarioSuggestions } from "@/lib/api";


export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — Visual Risk AI" },
      { name: "description", content: "Compare two versions of the next five years side by side." },
      { property: "og:title", content: "What-If Simulator — Visual Risk AI" },
      {
        property: "og:description",
        content: "Compare two versions of the next five years side by side.",
      },
    ],
  }),
  component: SimulatorPage,
});

type Scenario = { savings: number; sleep: number; study: number };
const ZERO: Scenario = { savings: 0, sleep: 0, study: 0 };

function parseMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={i} className="h-2" />;
    
    if (cleanLine.startsWith("### ")) {
      return <h4 key={i} className="text-sm font-semibold mt-3 mb-1 text-foreground">{cleanLine.replace("### ", "")}</h4>;
    }
    if (cleanLine.startsWith("## ")) {
      return <h3 key={i} className="text-base font-bold mt-4 mb-2 text-foreground">{cleanLine.replace("## ", "")}</h3>;
    }
    if (cleanLine.startsWith("# ")) {
      return <h2 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground">{cleanLine.replace("# ", "")}</h2>;
    }
    
    let isBullet = false;
    if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
      isBullet = true;
      cleanLine = cleanLine.substring(2);
    }
    
    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    while ((match = regex.exec(cleanLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push(cleanLine.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-bold text-foreground">{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < cleanLine.length) {
      parts.push(cleanLine.substring(lastIndex));
    }
    
    if (isBullet) {
      return (
        <li key={i} className="ml-4 list-disc text-sm text-muted-foreground pl-1 py-0.5">
          {parts}
        </li>
      );
    }
    
    return (
      <p key={i} className="text-sm text-muted-foreground leading-relaxed my-1">
        {parts}
      </p>
    );
  });
}

function SimulatorPage() {
  const ok = useGuard();
  const { state, updateProfile, saveScenarioPresets, loadScenarioPresets } = useTwin();
  const p = state.profile;
  const [a, setA] = useState<Scenario>({ savings: 400, sleep: 0.5, study: 4 });
  const [b, setB] = useState<Scenario>({ savings: 1200, sleep: -1, study: 12 });
  const [dragging, setDragging] = useState(false);
  const [ran, setRan] = useState(true);
  const [burst, setBurst] = useState(false);
  const [backendResult, setBackendResult] = useState<any>(null);

  // On mount, pull any previously-saved Scenario A/B slider positions
  // from the backend so the sandbox opens where the user left it.
  useEffect(() => {
    loadScenarioPresets()
      .then(({ a: savedA, b: savedB }) => {
        if (savedA) setA(savedA);
        if (savedB) setB(savedB);
      })
      .catch(() => {
        // no saved presets yet, or not signed in — keep current defaults
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const monthlyBase = Math.max(0, p.monthlyIncome - p.monthlyExpenses);

  const evaluate = (s: Scenario) => {
    const sleep = p.sleepHours + s.sleep;
    const study = p.studyHours / 7 + s.study / 7;
    const health = healthIndex(sleep, p.exerciseDays * 20, p.screenTime);
    const focus = focusIndex(sleep, study, p.screenTime);
    const path = projectNetWorth(p.netWorth, monthlyBase + s.savings, 5);
    return { sleep, health, focus, path, terminal: path[path.length - 1].value };
  };

  const localA = useMemo(() => evaluate(a), [a, p]);
  const localB = useMemo(() => evaluate(b), [b, p]);

  // Backend health_index/focus_index come back on a 0-100 scale;
  // local evaluate() and the rest of this UI (chart axis, burnout threshold) use 0-10.
  const A = backendResult
    ? {
        ...localA,
        health: backendResult.scenario_a.datapoints.at(-1).health_index / 10,
        focus: backendResult.scenario_a.datapoints.at(-1).focus_index / 10,
        terminal: backendResult.scenario_a.wealth_at_end,
      }
    : localA;

  const B = backendResult
    ? {
        ...localB,
        health: backendResult.scenario_b.datapoints.at(-1).health_index / 10,
        focus: backendResult.scenario_b.datapoints.at(-1).focus_index / 10,
        terminal: backendResult.scenario_b.wealth_at_end,
      }
    : localB;

  const chart = useMemo(() => {
    if (backendResult) {
      return backendResult.scenario_a.datapoints.map((dp: any, i: number) => ({
        year: `Age ${p.age + dp.year}`,
        netA: dp.net_worth,
        netB: backendResult.scenario_b.datapoints[i].net_worth,
        focusA: +(dp.focus_index / 10).toFixed(2),
        focusB: +(backendResult.scenario_b.datapoints[i].focus_index / 10).toFixed(2),
      }));
    }
    return localA.path.map((row, i) => ({
      year: `Age ${p.age + row.year}`,
      netA: row.value,
      netB: localB.path[i].value,
      focusA: +(localA.focus - i * 0.02).toFixed(2),
      focusB: +(localB.focus - i * 0.05).toFixed(2),
    }));
  }, [localA, localB, backendResult, p.age]);

  const runComparison = async () => {
    const userId = p.id ?? 1;
    setRan(false);

    let currentA = a;
    let currentB = b;

    // If both Scenario A and Scenario B are ZERO (baseline), use AI to generate suggestions!
    const isAZero = a.savings === 0 && a.sleep === 0 && a.study === 0;
    const isBZero = b.savings === 0 && b.sleep === 0 && b.study === 0;

    if (isAZero && isBZero) {
      toast.info("No inputs detected. AI is generating alternative scenarios for you...");
      try {
        const suggestions = await getScenarioSuggestions(userId);
        currentA = suggestions.scenario_a;
        currentB = suggestions.scenario_b;
        setA(currentA);
        setB(currentB);
        toast.success("AI scenario suggestions loaded");
      } catch (err: any) {
        console.error("AI scenario generation failed, using defaults:", err);
        // Fallback defaults
        currentA = { savings: 400, sleep: 0.5, study: 4 };
        currentB = { savings: 1200, sleep: -1.0, study: 12 };
        setA(currentA);
        setB(currentB);
        toast.success("Loaded fallback scenario suggestions");
      }
    }

    try {
      // 1. Auto-save presets to database in background
      await saveScenarioPresets(currentA, currentB);

      // 2. Run comparative analysis
      const result = await compareScenarios(userId, {
        scenario_a: {
          monthly_investment_change: currentA.savings,
          sleep_hours_change: currentA.sleep,
          weekly_study_change: currentA.study
        },
        scenario_b: {
          monthly_investment_change: currentB.savings,
          sleep_hours_change: currentB.sleep,
          weekly_study_change: currentB.study
        },
        years: 5
      });
      setBackendResult(result);
      toast.success("Comparative analysis complete");
    } catch (e: any) {
      toast.error(e.message || "Failed to run simulation comparison");
    } finally {
      setRan(true);
    }
  };

  const adopt = (s: Scenario, name: string) => {
    const r = evaluate(s);
    updateProfile({
      sleepHours: +r.sleep.toFixed(1),
      studyHours: Math.max(0, p.studyHours + s.study),
      savingsRate: Math.min(
        95,
        Math.round(((monthlyBase + s.savings) / Math.max(1, p.monthlyIncome)) * 100),
      ),
    });
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
    toast.success(`Scenario ${name} adopted as your active metrics`);
  };

  if (!ok) return null;

  const better = B.terminal > A.terminal ? "B" : "A";
  const worse = better === "A" ? B : A;
  const win = better === "A" ? A : B;
  const gap = Math.abs(A.terminal - B.terminal);

  return (
    <AppShell
      title="Decision Sandbox"
      subtitle="Move the sliders. The twin re-runs the next five years instantly."
    >
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <ScenarioCard name="A" s={a} set={setA} result={A} onDrag={setDragging} adopt={adopt} role={p.role} />
          <ScenarioCard name="B" s={b} set={setB} result={B} onDrag={setDragging} adopt={adopt} role={p.role} />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={runComparison}
              disabled={!ran}
            >
              {!ran ? "Analyzing..." : "Compare & Analyze"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setA(ZERO);
                setB(ZERO);
                setBackendResult(null);
                toast("Sandbox reset to baseline");
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <div
            className={`panel p-6 ${dragging || !ran ? "animate-pulse-glow" : ""}`}
          >
            <div className="flex items-center justify-between">
              <p className="label-xs">Future trajectory comparison</p>
              <span className="text-xs text-muted-foreground">
                {dragging || !ran ? "Syncing twin forecast…" : "Synced"}
              </span>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={58} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={26} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line yAxisId="left" type="monotone" dataKey="netA" name="Scenario A (Net Worth)" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="netB" name="Scenario B (Net Worth)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="focusA" name="Scenario A (Focus)" stroke="#818cf8" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="focusB" name="Scenario B (Focus)" stroke="#34d399" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Structured Verdict Summary Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Financial Impact Card */}
            <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] flex flex-col justify-between hover:shadow-[var(--clay-shadow)] transition-all">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Financial Impact</span>
                <h4 className="text-sm font-bold mt-1 font-display">Net Worth @ 5 Years</h4>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Scenario A:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{money(A.terminal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Scenario B:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{money(B.terminal)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Advantage:</span>
                <span className="clay-badge-emerald text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Scenario {better} (+{money(gap)})
                </span>
              </div>
            </div>

            {/* Wellbeing Impact Card */}
            <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] flex flex-col justify-between hover:shadow-[var(--clay-shadow)] transition-all">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Wellbeing Analysis</span>
                <h4 className="text-sm font-bold mt-1 font-display">Health & Focus Index</h4>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Health (A / B):</span>
                    <span className="font-bold text-foreground">{A.health.toFixed(1)} / {B.health.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Focus (A / B):</span>
                    <span className="font-bold text-foreground">{A.focus.toFixed(1)} / {B.focus.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-border/40 flex items-center">
                {worse.health < 5 ? (
                  <span className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1 font-semibold">
                    <TriangleAlert className="h-3.5 w-3.5 text-rose-500 animate-pulse" /> Burnout risk warning
                  </span>
                ) : (
                  <span className="clay-badge-emerald text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Safe health levels
                  </span>
                )}
              </div>
            </div>

            {/* Summary Verdict Card */}
            <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] flex flex-col justify-between hover:shadow-[var(--clay-shadow)] transition-all">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Strategy Verdict</span>
                <h4 className="text-sm font-bold mt-1 font-display">Recommended Trajectory</h4>
                <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Scenario {better.toUpperCase()} yields {money(win.terminal)} while holding focus at {win.focus.toFixed(1)}/10.
                </div>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Winner:</span>
                <span className="clay-badge-indigo text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Scenario {better}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive AI Advice Narrative Card */}
          {backendResult && (
            <AIIntelligenceCard
              title="Twin Strategy & Tradeoff Analysis"
              badge="Neural Engine"
              content={backendResult.recommendation}
              recommendedScenario={better}
              onAdoptA={() => adopt(a, "A")}
              onAdoptB={() => adopt(b, "B")}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

/** Interactive slider card for Scenario A / B */
function ScenarioCard({
  name,
  s,
  set,
  result,
  onDrag,
  adopt,
  role = "professional",
}: {
  name: "A" | "B";
  s: Scenario;
  set: (s: Scenario) => void;
  result: Result;
  onDrag: (v: boolean) => void;
  adopt: (s: Scenario, name: string) => void;
  role?: string;
}) {
  const warn = result.health < 4;
  const savingsLabel =
    role === "student"
      ? "Pocket savings change"
      : role === "retiree"
      ? "Monthly savings change"
      : "Monthly investment change";

  const studyLabel =
    role === "student"
      ? "Weekly study & homework"
      : role === "retiree"
      ? "Weekly hobbies & reading"
      : "Weekly upskilling & work";

  return (
    <div
      className={`panel p-6 transition-all duration-200 ${
        warn ? "border-destructive/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${name === "A" ? "clay-badge-indigo" : "clay-badge-emerald"}`}>
          Scenario {name}
        </span>
        {warn && (
          <span className="flex items-center gap-1 text-xs text-rose-500 dark:text-rose-400 font-semibold">
            <TriangleAlert className="h-3.5 w-3.5" /> Burnout risk
          </span>
        )}
      </div>

      <div className="mt-5 space-y-5">
        <SliderRow
          label={savingsLabel}
          value={s.savings}
          display={`+$${s.savings}`}
          min={0}
          max={2000}
          step={50}
          onChange={(v) => set({ ...s, savings: v })}
          onDrag={onDrag}
        />
        <SliderRow
          label="Sleep change"
          value={s.sleep}
          display={`${s.sleep > 0 ? "+" : ""}${s.sleep}h`}
          min={-2}
          max={3}
          step={0.5}
          onChange={(v) => set({ ...s, sleep: v })}
          onDrag={onDrag}
        />
        <SliderRow
          label={studyLabel}
          value={s.study}
          display={`${s.study > 0 ? "+" : ""}${s.study}h`}
          min={-10}
          max={20}
          step={1}
          onChange={(v) => set({ ...s, study: v })}
          onDrag={onDrag}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2.5 rounded-2xl bg-input p-3 shadow-[var(--clay-inset)] border border-border/30 text-center">
        <Mini label="Health" value={result.health.toFixed(1)} />
        <Mini label="Focus" value={result.focus.toFixed(1)} />
        <Mini label="5y net" value={money(result.terminal)} />
      </div>

      <Button
        className="mt-5 w-full rounded-xl"
        variant="outline"
        size="sm"
        onClick={() => adopt(s, name)}
      >
        Adopt Scenario {name}
      </Button>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-sm font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  onDrag,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onDrag: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="label-xs">{label}</span>
        <span className="font-display font-semibold tabular-nums">{display}</span>
      </div>
      <Slider
        className="mt-3"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => {
          onDrag(true);
          onChange(v);
        }}
        onValueCommit={() => onDrag(false)}
      />
    </div>
  );
}