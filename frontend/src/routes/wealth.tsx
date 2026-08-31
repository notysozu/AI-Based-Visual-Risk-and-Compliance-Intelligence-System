
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Gauge } from "@/components/gauge";
import { AIIntelligenceCard } from "@/components/ai-intelligence-card";
import { useGuard } from "@/lib/use-guard";
import { money, useTwin, getRoleConfig } from "@/lib/twin-store";
import { tooltipStyle } from "@/routes/dashboard";
import { getWealthAdvice, updateUser } from "@/lib/api";

export const Route = createFileRoute("/wealth")({
  head: () => ({
    meta: [
      { title: "Wealth Planner — Visual Risk AI" },
      { name: "description", content: "AI-driven and Monte Carlo projections toward your target." },
      { property: "og:title", content: "Wealth Planner — Visual Risk AI" },
      {
        property: "og:description",
        content: "AI-driven and Monte Carlo projections toward your target.",
      },
    ],
  }),
  component: WealthPage,
});

function WealthPage() {
  const ok = useGuard();
  const { state, updateProfile, loadForecast } = useTwin();
  const p = state.profile;
  const cfg = getRoleConfig(p.role);

  const [targets, setTargets] = useState({ targetAge: p.targetAge, targetNetWorth: p.targetNetWorth });

  const [advice, setAdvice] = useState<string | null>(p.lastWealthPrediction ?? null);
  const [adviceProbability, setAdviceProbability] = useState<number | null>(p.lastSuccessOdds ?? null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  // Synchronize targets when profile changes (e.g. switching demo persona)
  useEffect(() => {
    setTargets({ targetAge: p.targetAge, targetNetWorth: p.targetNetWorth });
  }, [p.targetAge, p.targetNetWorth]);

  // Sync state advice with loaded profile cache fields
  useEffect(() => {
    if (p.lastWealthPrediction) {
      setAdvice(p.lastWealthPrediction);
    }
    if (p.lastSuccessOdds !== undefined && p.lastSuccessOdds !== null) {
      setAdviceProbability(p.lastSuccessOdds);
    }
  }, [p.lastWealthPrediction, p.lastSuccessOdds]);

  // Fetch the real forecast from the backend when the page loads
  // or when the profile id/targets change.
  useEffect(() => {
    if (p.id !== null && p.id !== undefined) {
      loadForecast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id, p.age, p.targetAge, p.targetNetWorth, p.monthlyIncome, p.monthlyExpenses, p.netWorth]);

  const forecast = state.forecast;
  const running = state.forecastLoading;

  // Map backend monte_carlo shape into the {year, p10, p50, p90} shape the chart expects
  const mcData = useMemo(() => {
    if (!forecast) return [];
    const { years, median, p10, p90 } = forecast.monte_carlo;
    return years.map((year, i) => ({
      year,
      p10: p10[i],
      p50: median[i],
      p90: p90[i],
    }));
  }, [forecast]);

  const success = forecast ? Math.round(forecast.probability_of_success * 100) : 0;

  const handleGetPrediction = async () => {
    const userId = p.id ?? 1;
    setAdviceLoading(true);
    setAdviceError(null);
    try {
      // 1. Direct DB target update for backend computation
      try {
        await updateUser(userId, {
          retirement_goal_age: targets.targetAge,
          target_net_worth: targets.targetNetWorth,
        });
      } catch (err) {
        console.warn("Direct DB user update fallback:", err);
      }

      // 2. Save targets to local twin state
      await updateProfile({
        targetAge: targets.targetAge,
        targetNetWorth: targets.targetNetWorth,
      });

      // 3. Re-run forecast Monte Carlo projection
      await loadForecast();

      // 4. Get fresh AI prediction (with force=true)
      const result = await getWealthAdvice(userId, true);
      setAdvice(result.advice);
      setAdviceProbability(result.probability_of_success);

      // 5. Store prediction into profile cache
      await updateProfile({
        lastWealthPrediction: result.advice,
        lastSuccessOdds: result.probability_of_success,
      });

      toast.success("Wealth prediction generated");
    } catch (e: any) {
      const msg = e.message || "Failed to get prediction";
      setAdviceError(msg);
      toast.error(msg);
    } finally {
      setAdviceLoading(false);
    }
  };

  if (!ok) return null;

  const monthly = Math.max(0, p.monthlyIncome - p.monthlyExpenses);
  const discretionary = Math.round(p.monthlyExpenses * 0.35);
  const fixed = p.monthlyExpenses - discretionary;
  const years = Math.max(1, p.targetAge - p.age);
  const incomeSafe = Math.max(1, p.monthlyIncome);

  return (
    <AppShell
      title={cfg.wealthTitle}
      subtitle={`${years} years to ${cfg.targetAgeLabel.toLowerCase()} (${p.targetAge}) · target ${money(p.targetNetWorth)}`}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className={`panel p-6 ${running ? "animate-pulse-glow" : ""}`}>
            <p className="label-xs">
              Monte Carlo probability bands
            </p>

            {state.forecastError && (
              <p className="mt-4 text-sm text-destructive">
                Couldn't load forecast: {state.forecastError}
              </p>
            )}

            {!forecast && !running && !state.forecastError && (
              <p className="mt-4 text-sm text-muted-foreground">
                No chart data yet. Click "Get Prediction" to fetch your projection.
              </p>
            )}

            {forecast && (
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mcData}>
                    <defs>
                      <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={62}
                      tickFormatter={(v) => {
                        if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                        if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1000)}k`;
                        return `$${Math.round(v)}`;
                      }}
                    />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
                    <Area type="monotone" dataKey="p90" name="90th percentile (Optimistic)" stroke="#34d399" strokeWidth={1.5} fill="url(#band)" />
                    <Area type="monotone" dataKey="p50" name="Median Forecast" stroke="#10b981" strokeWidth={2.5} fill="none" />
                    <Area type="monotone" dataKey="p10" name="10th percentile (Conservative)" stroke="var(--color-muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {adviceLoading && (
              <div className="mt-4 rounded-2xl bg-input p-5 shadow-[var(--clay-inset)] border border-border/30 text-sm text-muted-foreground flex items-center gap-2.5 text-foreground animate-pulse">
                <Sparkles className="h-4 w-4 text-indigo-500 animate-spin" />
                <span>Twin AI is calculating your trajectory and success probability...</span>
              </div>
            )}

            {!adviceLoading && !advice && !adviceError && (
              <div className="mt-4 rounded-2xl bg-input p-4 shadow-[var(--clay-inset)] border border-border/30 text-sm text-muted-foreground text-center">
                <p>Click "Get Prediction" for a plain-language read on your trajectory and probability.</p>
              </div>
            )}

            {adviceError && (
              <div className="mt-4 rounded-2xl bg-rose-500/10 p-4 border border-rose-500/30 text-sm text-rose-500 font-medium">
                <p>Couldn't get prediction: {adviceError}</p>
              </div>
            )}

            {advice && !adviceLoading && (
              <div className="mt-4">
                <AIIntelligenceCard
                  title="Wealth Trajectory & Asset Intelligence"
                  badge="Monte Carlo Engine"
                  content={advice}
                  probability={adviceProbability}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="panel flex flex-col items-center p-6">
            <Gauge
              size={190}
              value={success / 10}
              display={forecast ? `${success}%` : "—"}
              label="Success odds"
              sublabel="from backend simulation"
              warning={forecast ? success < 50 : false}
              colorScheme="emerald"
              animating={running}
            />
          </div>

          <div className="panel p-6">
            <p className="label-xs">Targets</p>
            <div className="mt-4 space-y-3">
              <div className="grid gap-1.5">
                <Label className="label-xs">{cfg.targetAgeLabel}</Label>
                <Input
                  type="number"
                  value={targets.targetAge}
                  onChange={(e) => setTargets({ ...targets, targetAge: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="label-xs">{cfg.targetSavingsLabel}</Label>
                <Input
                  type="number"
                  value={targets.targetNetWorth}
                  onChange={(e) =>
                    setTargets({ ...targets, targetNetWorth: Number(e.target.value) })
                  }
                />
              </div>
              <Button
                className="w-full mt-2"
                size="lg"
                onClick={handleGetPrediction}
                disabled={adviceLoading || running}
              >
                {adviceLoading ? "Predicting…" : "Get Prediction"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 panel p-6">
        <div className="flex items-center justify-between">
          <p className="label-xs">Monthly budget & cashflow</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-slate-400" /> Fixed</span>
            <span className="flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-amber-500" /> Discretionary</span>
            <span className="flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Saved</span>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Figure label={cfg.incomeLabel} value={money(p.monthlyIncome)} dotColor="bg-indigo-500" />
          <Figure label="Fixed living costs" value={money(fixed)} dotColor="bg-slate-400" />
          <Figure label="Discretionary & fun" value={money(discretionary)} dotColor="bg-amber-500" />
          <Figure label={p.role === "student" ? "Saved / Extra" : p.role === "retiree" ? "Preserved / Saved" : "Invested & Saved"} value={money(monthly)} dotColor="bg-emerald-500" />
        </div>
        <div className="mt-6 flex h-3.5 overflow-hidden rounded-full bg-input shadow-[var(--clay-inset)] border border-border/30 p-0.5">
          <Bar w={(fixed / incomeSafe) * 100} className="bg-slate-500/70 rounded-l-full" />
          <Bar w={(discretionary / incomeSafe) * 100} className="bg-amber-500/90" />
          <Bar w={(monthly / incomeSafe) * 100} className="bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] rounded-r-full" />
        </div>
      </div>
    </AppShell>
  );
}

function Bar({ w, className }: { w: number; className: string }) {
  return <div className={className} style={{ width: `${Math.max(0, Math.min(100, w))}%` }} />;
}

function Figure({ label, value, dotColor = "bg-foreground" }: { label: string; value: string; dotColor?: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)]">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <p className="label-xs">{label}</p>
      </div>
      <p className="mt-1 font-display text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}