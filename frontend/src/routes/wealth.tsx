
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
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Gauge } from "@/components/gauge";
import { useGuard } from "@/lib/use-guard";
import { money, useTwin } from "@/lib/twin-store";
import { tooltipStyle } from "@/routes/dashboard";
import { getWealthAdvice, updateUser } from "@/lib/api";

export const Route = createFileRoute("/wealth")({
  head: () => ({
    meta: [
      { title: "Wealth Planner — Digital Twin" },
      { name: "description", content: "AI-driven and Monte Carlo projections toward your target." },
      { property: "og:title", content: "Wealth Planner — Digital Twin" },
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

  const [targets, setTargets] = useState({ targetAge: p.targetAge, targetNetWorth: p.targetNetWorth });

  const [advice, setAdvice] = useState<string | null>(p.lastWealthPrediction ?? null);
  const [adviceProbability, setAdviceProbability] = useState<number | null>(p.lastSuccessOdds ?? null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

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
  // or when the profile id becomes available (e.g. right after sign-in).
  useEffect(() => {
    if (p.id !== null && p.id !== undefined) {
      loadForecast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

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
    if (p.id === null || p.id === undefined) {
      toast.error("Sign in first");
      return;
    }
    setAdviceLoading(true);
    setAdviceError(null);
    try {
      // 1. Save targets to settings (which runs database update automatically)
      await updateProfile({
        targetAge: targets.targetAge,
        targetNetWorth: targets.targetNetWorth,
      });
      // 2. Load forecast (refreshes chart data in background)
      await loadForecast();
      // 3. Get AI prediction (cache-checked in backend)
      const result = await getWealthAdvice(p.id);
      setAdvice(result.advice);
      setAdviceProbability(result.probability_of_success);
      toast.success("Prediction updated");
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

  return (
    <AppShell
      title="Financial Twin"
      subtitle={`${years} years to age ${p.targetAge} · target ${money(p.targetNetWorth)}`}
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
                        <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={58} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => money(v)} />
                    <Area type="monotone" dataKey="p90" name="90th percentile" stroke="var(--color-foreground)" strokeWidth={1.5} fill="url(#band)" />
                    <Area type="monotone" dataKey="p50" name="Median" stroke="var(--color-foreground)" strokeWidth={2.5} fill="none" />
                    <Area type="monotone" dataKey="p10" name="10th percentile" stroke="var(--color-muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="panel p-6 font-mono text-xs leading-relaxed">
            <p className="label-xs font-sans pb-3">AI wealth prediction</p>
            <div className="space-y-1 border-t border-border pt-3 text-muted-foreground font-sans">
              {adviceLoading && (
                <p>Analyzing your projections…</p>
              )}
              {!adviceLoading && !advice && !adviceError && (
                <p>Click "Get Prediction" for a plain-language read on your trajectory.</p>
              )}
              {adviceError && (
                <p className="text-destructive">Couldn't get prediction: {adviceError}</p>
              )}
              {advice && (
                <div className="whitespace-pre-line text-sm text-foreground">
                  {advice}
                  {adviceProbability !== null && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Backing probability of success: {Math.round(adviceProbability * 100)}%
                    </p>
                  )}
                </div>
              )}
            </div>
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
              animating={running}
            />
          </div>

          <div className="panel p-6">
            <p className="label-xs">Targets</p>
            <div className="mt-4 space-y-3">
              <div className="grid gap-1.5">
                <Label className="label-xs">Target age</Label>
                <Input
                  type="number"
                  value={targets.targetAge}
                  onChange={(e) => setTargets({ ...targets, targetAge: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="label-xs">Target net worth</Label>
                <Input
                  type="number"
                  value={targets.targetNetWorth}
                  onChange={(e) =>
                    setTargets({ ...targets, targetNetWorth: Number(e.target.value) })
                  }
                />
              </div>
              <Button
                className="w-full"
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
        <p className="label-xs">Monthly budget</p>
        <div className="mt-4 grid gap-6 md:grid-cols-4">
          <Figure label="Income" value={money(p.monthlyIncome)} />
          <Figure label="Fixed costs" value={money(fixed)} />
          <Figure label="Discretionary" value={money(discretionary)} />
          <Figure label="Invested" value={money(monthly)} />
        </div>
        <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-muted">
          <Bar w={(fixed / p.monthlyIncome) * 100} className="bg-foreground" />
          <Bar w={(discretionary / p.monthlyIncome) * 100} className="bg-muted-foreground" />
          <Bar w={(monthly / p.monthlyIncome) * 100} className="bg-foreground/30" />
        </div>
      </div>
    </AppShell>
  );
}

function Bar({ w, className }: { w: number; className: string }) {
  return <div className={className} style={{ width: `${Math.max(0, Math.min(100, w))}%` }} />;
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-xs">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}