import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Check, Dumbbell, MoonStar, Smartphone, Smile } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AIIntelligenceCard } from "@/components/ai-intelligence-card";
import { HabitDrawer, tooltipStyle } from "@/routes/dashboard";
import { useGuard } from "@/lib/use-guard";
import { baseline, focusIndex, useTwin, getRoleConfig } from "@/lib/twin-store";
import { getAnalyticsSummary } from "@/lib/api";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — VisualRisk AI (VRCI)" },
      { name: "description", content: "Correlations, streaks and the full history of your logs." },
      { property: "og:title", content: "Analytics — VisualRisk AI (VRCI)" },
      {
        property: "og:description",
        content: "Correlations, streaks and the full history of your logs.",
      },
    ],
  }),
  component: AnalyticsPage,
});

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

function AnalyticsPage() {
  const ok = useGuard();
  const { state, addLog, clearLogs, updateProfile } = useTwin();
  const p = state.profile;
  const [drawer, setDrawer] = useState(false);
  const [summary, setSummary] = useState<string>(p.lastAnalyticsSummary ?? "");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Request/Update the AI Analytics narrative based on the 12:00 PM internal time rule
  useEffect(() => {
    if (!p.id || state.logs.length === 0) return;

    // Check if we already have a cached summary and if it's still fresh for today
    if (p.lastAnalyticsSummary && p.lastAnalyticsUpdated) {
      const lastUpdated = new Date(p.lastAnalyticsUpdated);
      const now = new Date();
      
      // Determine the critical "last 12:00 PM" milestone
      const todayNoon = new Date();
      todayNoon.setHours(12, 0, 0, 0);

      let criticalMilestone: Date;
      if (now >= todayNoon) {
        // If current time is past 12 PM today, the update must have occurred after 12 PM today
        criticalMilestone = todayNoon;
      } else {
        // If current time is before 12 PM today, the update must have occurred after 12 PM yesterday
        const yesterdayNoon = new Date();
        yesterdayNoon.setDate(yesterdayNoon.getDate() - 1);
        yesterdayNoon.setHours(12, 0, 0, 0);
        criticalMilestone = yesterdayNoon;
      }

      // If the cache was updated after the milestone, skip generation and load cache!
      if (lastUpdated >= criticalMilestone) {
        setSummary(p.lastAnalyticsSummary);
        return;
      }
    }

    // Otherwise, generate a fresh summary!
    setSummaryLoading(true);
    const minimalLogs = state.logs.map((l) => ({
      sleep: l.sleep,
      screen: l.screen,
      study: l.study,
      exercise: l.exercise,
      mood: l.mood,
    }));

    getAnalyticsSummary(p.id, { logs: minimalLogs })
      .then((res: any) => {
        if (res?.summary) {
          setSummary(res.summary);
          // Save to state profile context and persist to database
          updateProfile({
            lastAnalyticsSummary: res.summary,
            lastAnalyticsUpdated: new Date().toISOString()
          });
        }
      })
      .catch((err: any) => {
        console.error("Failed to generate analytics summary:", err);
      })
      .finally(() => {
        setSummaryLoading(false);
      });
  }, [p.id, state.logs, p.lastAnalyticsSummary, p.lastAnalyticsUpdated]);

  const base = useMemo(() => baseline(state.logs), [state.logs]);
  const cfg = getRoleConfig(p.role);
  
  // Calculate average stats for simplified widgets
  const avgStats = useMemo(() => {
    if (!state.logs.length) return { sleep: 0, screen: 0, exercise: 0, study: 0, mood: 0 };
    const len = state.logs.length;
    return {
      sleep: +(state.logs.reduce((acc, l) => acc + l.sleep, 0) / len).toFixed(1),
      screen: +(state.logs.reduce((acc, l) => acc + l.screen, 0) / len).toFixed(1),
      exercise: +(state.logs.reduce((acc, l) => acc + l.exercise, 0) / len).toFixed(0),
      study: +(state.logs.reduce((acc, l) => acc + l.study, 0) / len).toFixed(1),
      mood: +(state.logs.reduce((acc, l) => acc + l.mood, 0) / len).toFixed(1),
    };
  }, [state.logs]);

  // 1. Group focus ratings by sleep duration
  const sleepFocusData = useMemo(() => {
    const categories = [
      { label: "Short Sleep (<7h)", min: 0, max: 7, sum: 0, count: 0 },
      { label: "Healthy Sleep (7-8.5h)", min: 7, max: 8.5, sum: 0, count: 0 },
      { label: "Long Sleep (>8.5h)", min: 8.5, max: 24, sum: 0, count: 0 },
    ];
    
    state.logs.forEach((l) => {
      const focus = focusIndex(l.sleep, l.study, l.screen);
      categories.forEach((c) => {
        if (l.sleep >= c.min && l.sleep < c.max) {
          c.sum += focus;
          c.count += 1;
        }
      });
    });

    return categories.map((c) => ({
      name: c.label,
      "Avg Focus": c.count > 0 ? +(c.sum / c.count).toFixed(1) : 0,
    }));
  }, [state.logs]);

  // 2. Group mood ratings by screen duration
  const screenMoodData = useMemo(() => {
    const categories = [
      { label: "Low Screen (<3h)", min: 0, max: 3, sum: 0, count: 0 },
      { label: "Moderate Screen (3-5h)", min: 3, max: 5, sum: 0, count: 0 },
      { label: "High Screen (>5h)", min: 5, max: 24, sum: 0, count: 0 },
    ];

    state.logs.forEach((l) => {
      categories.forEach((c) => {
        if (l.screen >= c.min && l.screen < c.max) {
          c.sum += l.mood;
          c.count += 1;
        }
      });
    });

    return categories.map((c) => ({
      name: c.label,
      "Avg Mood": c.count > 0 ? +(c.sum / c.count).toFixed(1) : 0,
    }));
  }, [state.logs]);

  const week = state.logs.slice(-7);

  if (!ok) return null;

  const exportCsv = () => {
    const rows = [
      ["date", "sleep", "screen", "study", "exercise", "mood"],
      ...state.logs.map((l) => [l.date, l.sleep, l.screen, l.study, l.exercise, l.mood]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement("a");
    aEl.href = url;
    aEl.download = "twin-history.csv";
    aEl.click();
    URL.revokeObjectURL(url);
    toast.success("History exported");
  };

  return (
    <AppShell
      title="Analytics"
      subtitle={`${cfg.badge} · ${base.days} days of history`}
      actions={
        <>
          <Button size="sm" onClick={() => setDrawer(true)}>
            Log Daily Activities
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            Export History (CSV)
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost">
                Clear All Logs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your entire log history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes every logged day from this browser. It cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearLogs();
                    toast.success("Logs cleared");
                  }}
                >
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      }
    >
      {/* Dynamic AI Habit Overview panel */}
      <div className="panel p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="label-xs">Simplified habit overview</p>
            <h3 className="text-lg font-bold mt-1 text-foreground">AI VisualRisk Insights</h3>
          </div>
        </div>

        {/* Large Simplified Metric Cards */}
        <div className="grid gap-3 sm:grid-cols-5 mt-5">
          <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] text-center hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow)] transition-all">
            <span className="clay-badge-indigo inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
              <MoonStar className="h-3 w-3 shrink-0" /> Sleep
            </span>
            <p className="text-xl font-bold mt-1 font-display">{avgStats.sleep}h</p>
            <span className="text-[10px] text-muted-foreground">Avg / night</span>
          </div>
          <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] text-center hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow)] transition-all">
            <span className="clay-badge-amber inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
              <Smartphone className="h-3 w-3 shrink-0" /> Screen
            </span>
            <p className="text-xl font-bold mt-1 font-display">{avgStats.screen}h</p>
            <span className="text-[10px] text-muted-foreground">Avg / day</span>
          </div>
          <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] text-center hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow)] transition-all">
            <span className="clay-badge-purple inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
              <BookOpen className="h-3 w-3 shrink-0" /> {cfg.studyLabel}
            </span>
            <p className="text-xl font-bold mt-1 font-display">{avgStats.study}h</p>
            <span className="text-[10px] text-muted-foreground">Avg / day</span>
          </div>
          <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] text-center hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow)] transition-all">
            <span className="clay-badge-emerald inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
              <Dumbbell className="h-3 w-3 shrink-0" /> Exercise
            </span>
            <p className="text-xl font-bold mt-1 font-display">{avgStats.exercise}m</p>
            <span className="text-[10px] text-muted-foreground">Avg / day</span>
          </div>
          <div className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] text-center hover:-translate-y-0.5 hover:shadow-[var(--clay-shadow)] transition-all">
            <span className="clay-badge-rose inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
              <Smile className="h-3 w-3 shrink-0" /> Mood
            </span>
            <p className="text-xl font-bold mt-1 font-display">{avgStats.mood}/10</p>
            <span className="text-[10px] text-muted-foreground">Avg rating</span>
          </div>
        </div>

        {/* AI Explanatory Narrative */}
        {summaryLoading ? (
          <div className="mt-5 rounded-2xl bg-input p-5 border border-border/30 shadow-[var(--clay-inset)] text-sm text-muted-foreground animate-pulse">
            Twin is synthesizing habit logs and computing focus-vitality correlations...
          </div>
        ) : summary ? (
          <div className="mt-5">
            <AIIntelligenceCard
              title="Habit Dynamics & Vitality Narrative"
              badge="Twin Analytics"
              content={summary}
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="How sleep affects your focus">
          <BarChart data={sleepFocusData}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 10]} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={26} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
            <Bar dataKey="Avg Focus" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={36} />
          </BarChart>
        </ChartCard>

        <ChartCard title="How screen time affects your mood">
          <BarChart data={screenMoodData}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 10]} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={26} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
            <Bar dataKey="Avg Mood" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={36} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="panel mt-5 p-6">
        <p className="label-xs">Weekly streak</p>
        <div className="mt-4 grid grid-cols-7 gap-2.5">
          {week.map((l) => {
            const hit = l.sleep >= 7 && l.study >= 1;
            return (
              <div
                key={l.id}
                className={`flex aspect-square flex-col items-center justify-center rounded-2xl border text-xs transition-all duration-150 ${
                  hit
                    ? "clay-badge-emerald font-bold"
                    : "border-border/40 bg-input shadow-[var(--clay-inset)] text-muted-foreground"
                }`}
              >
                {hit ? <Check className="h-4 w-4 stroke-[3]" /> : <span>—</span>}
                <span className="mt-1 font-mono text-[10px]">{l.date.slice(5)}</span>
              </div>
            );
          })}
          {week.length === 0 && (
            <p className="col-span-7 py-6 text-center text-sm text-muted-foreground">No logs yet.</p>
          )}
        </div>
      </div>

      <div className="panel mt-5 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Sleep</TableHead>
              <TableHead>Screen</TableHead>
              <TableHead>Study</TableHead>
              <TableHead>Exercise</TableHead>
              <TableHead>Mood</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.logs
              .slice()
              .reverse()
              .slice(0, 15)
              .map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.date}</TableCell>
                  <TableCell>{l.sleep}h</TableCell>
                  <TableCell>{l.screen}h</TableCell>
                  <TableCell>{l.study}h</TableCell>
                  <TableCell>{l.exercise}m</TableCell>
                  <TableCell>{l.mood}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <HabitDrawer open={drawer} onOpenChange={setDrawer} onSave={addLog} />
    </AppShell>
  );
}

/** Reusable container card for analytical charts */
function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="panel p-6">
      <p className="label-xs">{title}</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
