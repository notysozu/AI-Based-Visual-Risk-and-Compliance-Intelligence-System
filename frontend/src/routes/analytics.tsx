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
import { Badge } from "@/components/ui/badge";
import { BookOpen, Check, Dumbbell, MoonStar, Smartphone, Smile, GraduationCap, Clock, Flame, Award } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { AIIntelligenceCard } from "@/components/ai-intelligence-card";
import { HabitDrawer, tooltipStyle } from "@/routes/dashboard";
import { useGuard } from "@/lib/use-guard";
import { baseline, focusIndex, useTwin, getRoleConfig } from "@/lib/twin-store";
import { getAnalyticsSummary } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudyAnalytics, useStudyRecords } from "@/lib/queries";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Visual Risk AI (VRCI)" },
      { name: "description", content: "Correlations, streaks and the full history of your logs." },
      { property: "og:title", content: "Analytics — Visual Risk AI (VRCI)" },
      {
        property: "og:description",
        content: "Correlations, streaks and the full history of your logs.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const ok = useGuard();
  const { state, addLog, clearLogs, updateProfile } = useTwin();
  const p = state.profile;
  const [drawer, setDrawer] = useState(false);
  const [summary, setSummary] = useState<string>(p.lastAnalyticsSummary ?? "");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // — Cached queries (no repeated DB hits on re-visit) —
  const { data: studyAnalytics = null } = useStudyAnalytics(p.id);
  const { data: studyRecordsData = [] } = useStudyRecords(p.id);
  const studyRecords: any[] = Array.isArray(studyRecordsData) ? studyRecordsData : [];

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

  if (!ok) return (
    <AppShell title="Analytics" subtitle="Loading...">
      {/* AI Overview panel skeleton */}
      <div className="panel p-6 mb-5 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-6 w-48" /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-5 mt-5">
          {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-20 w-full rounded-2xl mt-5" />
      </div>
      {/* Charts skeleton */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel p-6 space-y-3"><Skeleton className="h-3 w-40" /><Skeleton className="h-64 w-full rounded-xl" /></div>
        <div className="panel p-6 space-y-3"><Skeleton className="h-3 w-40" /><Skeleton className="h-64 w-full rounded-xl" /></div>
      </div>
      {/* Streak skeleton */}
      <div className="panel mt-5 p-6">
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="grid grid-cols-7 gap-2.5">
          {[0,1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      </div>
      {/* Table skeleton */}
      <div className="panel mt-5 p-4 space-y-2">
        <div className="grid grid-cols-6 gap-4 px-2 py-2">
          {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-3 w-full" />)}
        </div>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="grid grid-cols-6 gap-4 px-2 py-2.5 border-t border-border/30">
            {[0,1,2,3,4,5].map(j => <Skeleton key={j} className="h-3 w-full" />)}
          </div>
        ))}
      </div>
    </AppShell>
  );

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
            <h3 className="text-lg font-bold mt-1 text-foreground">AI Visual Risk Insights</h3>
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
          <div className="mt-5 rounded-2xl bg-input p-5 border border-border/30 shadow-[var(--clay-inset)] space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
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

      {/* Academic & Study Analytics (MongoDB Synced) */}
      <div className="panel mt-6 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-400" />
              <h3 className="font-bold text-base text-foreground">Academic Intelligence & Study Records</h3>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                MongoDB Synced
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Synchronized telemetry from Pomodoro focus sessions, curriculum subjects, and cognitive depth ratings.
            </p>
          </div>
        </div>

        {/* 4 Study KPI Badges */}
        {studyAnalytics === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-16" /></div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Study Hours</p>
              <p className="text-lg font-bold text-foreground">
                {(studyAnalytics?.total_study_hours ?? 0).toFixed(1)} hrs
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Weekly Study Pace</p>
              <p className="text-lg font-bold text-foreground">
                {(studyAnalytics?.avg_weekly_hours ?? 0).toFixed(1)} hrs/wk
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Focus Rating</p>
              <p className="text-lg font-bold text-foreground">
                {studyAnalytics?.avg_focus_score ? `${studyAnalytics.avg_focus_score.toFixed(1)} / 10` : "N/A"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Logged Sessions</p>
              <p className="text-lg font-bold text-foreground">{studyRecords.length} Sessions</p>
            </div>
          </div>
        </div>
        )} {/* end studyAnalytics conditional */}

        {/* Two Visual Panels: Chart + Subject Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Subject Allocation Chart */}
          <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-foreground">Subject Study Volume</h4>
                <p className="text-xs text-muted-foreground">Hours dedicated across subjects</p>
              </div>
            </div>
            <div className="h-56 w-full">
              {studyAnalytics?.subjects && studyAnalytics.subjects.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={studyAnalytics.subjects.map((s: any) => ({
                      subject: s.subject,
                      hours: s.total_hours,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="subject" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} unit="h" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Study Hours" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground space-y-1">
                  <BookOpen className="h-6 w-6 opacity-40" />
                  <p>No subject telemetry recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Subject Mastery Breakdown */}
          <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-foreground">Curriculum Domain Breakdown</h4>
                <p className="text-xs text-muted-foreground">Session count and cognitive focus ratings</p>
              </div>
            </div>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {studyAnalytics?.subjects && studyAnalytics.subjects.length > 0 ? (
                studyAnalytics.subjects.map((s: any) => (
                  <div
                    key={s.subject}
                    className="p-3 rounded-lg bg-card/60 border border-border/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.sessions_count} sessions · {s.total_hours.toFixed(1)} hrs total
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-500/15 text-purple-300 border-purple-500/20 text-xs font-semibold">
                      {s.avg_focus > 0 ? `${s.avg_focus.toFixed(1)} / 10 Focus` : "Fresh"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                  <p>No curriculum subjects registered yet.</p>
                  <p className="text-[11px] text-muted-foreground/80">Complete onboarding in Study & Academic to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MongoDB Study Records Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-foreground">Recent Academic Focus Sessions (MongoDB)</h4>
            <span className="text-xs text-muted-foreground">{studyRecords.length} records</span>
          </div>

          {studyRecords.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Focus Depth</TableHead>
                    <TableHead>Exam / Quiz Score</TableHead>
                    <TableHead>Session Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studyRecords.slice(0, 10).map((rec: any, idx: number) => (
                    <TableRow key={rec.id || idx}>
                      <TableCell className="font-mono text-xs">
                        {rec.timestamp ? new Date(rec.timestamp).toLocaleDateString() : "Today"}
                      </TableCell>
                      <TableCell className="font-semibold text-purple-300">
                        {rec.subject}
                      </TableCell>
                      <TableCell>{rec.duration_minutes} mins</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs bg-cyan-500/10 text-cyan-300">
                          {rec.focus_score} / 10
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rec.exam_score !== null && rec.exam_score !== undefined ? (
                          <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-300">
                            {rec.exam_score}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {rec.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No individual study session records found in MongoDB yet. Complete a Pomodoro session in the Study tab to log your first session.
            </div>
          )}
        </div>
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
