import { useState, useMemo } from "react";
import {
  Calendar,
  CalendarDays,
  TrendingUp,
  Moon,
  Monitor,
  Brain,
  Award,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Log, Profile } from "@/lib/types";
import { today } from "@/lib/twin-store";

interface Props {
  logs: Log[];
  profile: Profile;
}

interface DailyCadenceItem {
  dayName: string;
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  sleep: number;
  screen: number;
  study: number;
  mood: number;
  focusRatio: number;
  takeaway: string;
}

interface WeekSummaryItem {
  weekLabel: string;
  startDate: string;
  endDate: string;
  daysLogged: number;
  avgSleep: number;
  avgScreen: number;
  totalStudy: number;
  avgMood: number;
  grade: string;
  badgeClass: string;
  synthesis: string;
  highlight: string;
}

interface MonthSummaryItem {
  monthName: string;
  year: number;
  totalWeeks: number;
  totalFocusHours: number;
  avgSleep: number;
  avgScreen: number;
  consistencyScore: number;
  velocity: number;
  narrative: string;
  strategicGoals: string[];
}

export function AnalyticsPeriodSummaries({ logs, profile }: Props) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");

  const currentDateStr = today();

  // 1. Current Week Daily Cadence (Mon -> Sun)
  const dailyCadence = useMemo<DailyCadenceItem[]>(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const days: DailyCadenceItem[] = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);
      const isToday = dStr === currentDateStr;
      const isPast = d < now || isToday;

      const log = logs.find((l) => l.date === dStr);
      const sleep = log ? log.sleep : isPast ? profile.sleepHours || 7.5 : 0;
      const screen = log ? log.screen : isPast ? profile.screenTime || 3.5 : 0;
      const study = log ? log.study : 0;
      const mood = log ? log.mood : isPast ? 8 : 0;

      const focusRatio = screen > 0 ? +(study / screen).toFixed(2) : +(study / 1.0).toFixed(2);

      let takeaway = "Scheduled recovery & execution window.";
      if (sleep >= 8.0 && study >= 2.0) {
        takeaway = "Peak restorative sleep fueled strong deep-work focus block.";
      } else if (screen > 5.0) {
        takeaway = "Elevated screen time load — digital cutoff recommended tonight.";
      } else if (study >= 3.0) {
        takeaway = "High-leverage sprint milestone achieved.";
      } else if (sleep < 6.5 && isPast) {
        takeaway = "Sleep deficit detected — prioritize early circadian wind-down.";
      }

      days.push({
        dayName: dayNames[i],
        dateStr: dStr,
        isToday,
        isPast,
        sleep,
        screen,
        study,
        mood,
        focusRatio,
        takeaway,
      });
    }

    return days;
  }, [logs, currentDateStr, profile.sleepHours, profile.screenTime]);

  // 2. Weekly Synthesis (7-Day Performance Rollups)
  const weeklySummaries = useMemo<WeekSummaryItem[]>(() => {
    if (!logs || logs.length === 0) return [];

    const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    const weeks: WeekSummaryItem[] = [];
    const chunkSize = 7;

    for (let i = 0; i < sortedLogs.length && weeks.length < 6; i += chunkSize) {
      const chunk = sortedLogs.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;

      const daysLogged = chunk.length;
      const avgSleep = +(chunk.reduce((s, l) => s + (l.sleep || 0), 0) / daysLogged).toFixed(1);
      const avgScreen = +(chunk.reduce((s, l) => s + (l.screen || 0), 0) / daysLogged).toFixed(1);
      const totalStudy = +(chunk.reduce((s, l) => s + (l.study || 0), 0)).toFixed(1);
      const avgMood = +(chunk.reduce((s, l) => s + (l.mood || 0), 0) / daysLogged).toFixed(1);

      const targetWeeklyStudy = profile.studyHours || 14.0;
      const studyScore = Math.min(100, (totalStudy / targetWeeklyStudy) * 100);
      const sleepScore = Math.min(100, (avgSleep / (profile.sleepHours || 8.0)) * 100);
      const composite = studyScore * 0.5 + sleepScore * 0.3 + (avgMood * 10) * 0.2;

      let grade = "A";
      let badgeClass = "clay-badge-emerald";
      if (composite >= 92) {
        grade = "A+";
        badgeClass = "clay-badge-emerald";
      } else if (composite >= 80) {
        grade = "A";
        badgeClass = "clay-badge-indigo";
      } else if (composite >= 70) {
        grade = "B+";
        badgeClass = "clay-badge-purple";
      } else {
        grade = "B";
        badgeClass = "clay-badge-amber";
      }

      const startDate = chunk[chunk.length - 1].date;
      const endDate = chunk[0].date;
      const weekNum = Math.ceil((i + 7) / 7);

      weeks.push({
        weekLabel: i === 0 ? "Current Week" : `Week -${weekNum - 1}`,
        startDate,
        endDate,
        daysLogged,
        avgSleep,
        avgScreen,
        totalStudy,
        avgMood,
        grade,
        badgeClass,
        synthesis: `Delivered ${totalStudy}h of focus with ${avgSleep}h avg sleep. Screen time averaged ${avgScreen}h/day across ${daysLogged} recorded days.`,
        highlight: totalStudy >= targetWeeklyStudy
          ? "Goal Outperformed: Weekly study target exceeded."
          : `Pacing: ${Math.round(studyScore)}% of target study hours completed.`,
      });
    }

    return weeks;
  }, [logs, profile.studyHours, profile.sleepHours]);

  // 3. Multi-Week Monthly Retrospective (4-8 Weeks)
  const monthlyRetrospective = useMemo<MonthSummaryItem[]>(() => {
    if (!logs || logs.length === 0) return [];

    const now = new Date();
    const monthsMap: Record<string, Log[]> = {};

    logs.forEach((l) => {
      const monthKey = (l.date || "").slice(0, 7); // YYYY-MM
      if (monthKey) {
        if (!monthsMap[monthKey]) monthsMap[monthKey] = [];
        monthsMap[monthKey].push(l);
      }
    });

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const result: MonthSummaryItem[] = [];

    Object.keys(monthsMap)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 3)
      .forEach((mKey) => {
        const mLogs = monthsMap[mKey];
        const [yStr, mStr] = mKey.split("-");
        const monthIdx = parseInt(mStr, 10) - 1;
        const year = parseInt(yStr, 10);
        const monthName = monthNames[monthIdx] || mKey;

        const count = mLogs.length;
        const totalFocusHours = +(mLogs.reduce((s, l) => s + (l.study || 0), 0)).toFixed(1);
        const avgSleep = +(mLogs.reduce((s, l) => s + (l.sleep || 0), 0) / count).toFixed(1);
        const avgScreen = +(mLogs.reduce((s, l) => s + (l.screen || 0), 0) / count).toFixed(1);

        // Sleep consistency: calculate variance
        const sleepDeviations = mLogs.map((l) => Math.abs((l.sleep || 7.5) - avgSleep));
        const avgDev = sleepDeviations.reduce((a, b) => a + b, 0) / count;
        const consistencyScore = Math.max(70, Math.min(99, Math.round(100 - avgDev * 15)));

        const velocity = Math.round((totalFocusHours / Math.max(1, count * 2)) * 100);

        result.push({
          monthName,
          year,
          totalWeeks: Math.ceil(count / 7),
          totalFocusHours,
          avgSleep,
          avgScreen,
          consistencyScore,
          velocity,
          narrative: `Throughout ${monthName}, your digital twin registered ${totalFocusHours} focus hours across ${count} days of active telemetry. Circadian sleep stability scored ${consistencyScore}%, demonstrating strong cognitive resilience.`,
          strategicGoals: [
            `Maintain sleep baseline >= ${Math.max(7.5, avgSleep)}h before major study/work sprints.`,
            `Cap non-essential digital screen load under ${(avgScreen * 0.9).toFixed(1)}h/day.`,
            `Protect 90-minute circadian peak focus anchors in the morning planner.`,
          ],
        });
      });

    return result;
  }, [logs]);

  return (
    <div className="panel p-6 border border-border/50 shadow-[var(--clay-shadow)] space-y-5">
      {/* Header with Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Multi-Tier Intelligence & Period Summaries
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Structured daily telemetry, 7-day weekly rollups, and multi-week longitudinal retrospectives.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v: any) => setActiveTab(v)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-[360px] h-9 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="daily" className="text-xs font-semibold rounded-lg">
              Daily (Mon-Sun)
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs font-semibold rounded-lg">
              Weekly Digest
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs font-semibold rounded-lg">
              Monthly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 1. Daily Cadence Tab (Mon -> Sun) */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold">Current Week Schedule & Telemetry Cadence</span>
            <span className="text-[11px]">Updated dynamically from daily check-ins</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {dailyCadence.map((day) => (
              <div
                key={day.dateStr}
                className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
                  day.isToday
                    ? "bg-primary/5 border-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-primary/30"
                    : day.isPast
                    ? "bg-card/70 border-border/50 hover:border-border"
                    : "bg-muted/30 border-border/30 opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-display text-foreground">
                      {day.dayName}
                    </span>
                    {day.isToday && (
                      <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
                        Today
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono block mb-3">
                    {day.dateStr.slice(5)}
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Moon className="h-3 w-3 text-indigo-400" /> Sleep
                      </span>
                      <span className="font-semibold font-mono text-foreground">
                        {day.sleep > 0 ? `${day.sleep}h` : "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Monitor className="h-3 w-3 text-amber-400" /> Screen
                      </span>
                      <span className="font-semibold font-mono text-foreground">
                        {day.screen > 0 ? `${day.screen}h` : "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Brain className="h-3 w-3 text-purple-400" /> Focus
                      </span>
                      <span className="font-semibold font-mono text-purple-500">
                        {day.study > 0 ? `${day.study}h` : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/30">
                  <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                    {day.takeaway}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-muted/40 p-3 border border-border/30 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Full 7-day Sunday synthesis compiles automatically at week close.</span>
            </span>
            <span className="font-mono text-[11px] text-foreground font-semibold">
              Weekly Target: {profile.studyHours || 14}h Focus
            </span>
          </div>
        </div>
      )}

      {/* 2. Weekly Digest Tab */}
      {activeTab === "weekly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold">7-Day Aggregated Performance Digest</span>
            <span>Historical week-by-week synthesis</span>
          </div>

          <div className="space-y-3">
            {weeklySummaries.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-muted/20 border border-border/30">
                Log daily check-ins to generate your first 7-day weekly performance digest.
              </div>
            ) : (
              weeklySummaries.map((wk, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-card p-4 border border-border/50 shadow-[var(--clay-shadow-sm)] hover:border-primary/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-foreground">
                        {wk.weekLabel}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({wk.startDate} → {wk.endDate})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Grade:
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${wk.badgeClass}`}>
                        {wk.grade}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-xl bg-input/50 border border-border/20">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Total Focus
                      </span>
                      <p className="text-base font-bold text-purple-500 mt-0.5 font-mono">
                        {wk.totalStudy} hrs
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-input/50 border border-border/20">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Avg Sleep
                      </span>
                      <p className="text-base font-bold text-indigo-400 mt-0.5 font-mono">
                        {wk.avgSleep} hrs
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-input/50 border border-border/20">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Avg Screen
                      </span>
                      <p className="text-base font-bold text-amber-400 mt-0.5 font-mono">
                        {wk.avgScreen} hrs
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-input/50 border border-border/20">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Avg Mood
                      </span>
                      <p className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                        {wk.avgMood} / 10
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {wk.synthesis}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{wk.highlight}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Monthly Retrospective Tab */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold">Multi-Week Longitudinal Retrospective</span>
            <span>4-8 Week Synthesis & Month-Ahead Trajectory</span>
          </div>

          <div className="space-y-4">
            {monthlyRetrospective.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-muted/20 border border-border/30">
                Log daily check-ins to build your monthly longitudinal retrospective.
              </div>
            ) : (
              monthlyRetrospective.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 p-5 border border-border/60 shadow-[var(--clay-shadow)] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {m.monthName} {m.year} Retrospective
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Synthesis of {m.totalWeeks} active weeks of behavioral data
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary font-mono">
                        {m.consistencyScore}% Circadian Stability
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {m.narrative}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-input/40 border border-border/20">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Monthly Total Focus
                      </span>
                      <p className="text-lg font-bold text-purple-500 mt-0.5 font-mono">
                        {m.totalFocusHours} hrs
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-input/40 border border-border/20">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Sleep Equilibrium
                      </span>
                      <p className="text-lg font-bold text-indigo-400 mt-0.5 font-mono">
                        {m.avgSleep}h / night
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-input/40 border border-border/20">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Screen Load Average
                      </span>
                      <p className="text-lg font-bold text-amber-400 mt-0.5 font-mono">
                        {m.avgScreen}h / day
                      </p>
                    </div>
                  </div>

                  {/* Strategic Month-Ahead Calibrations */}
                  <div className="rounded-xl bg-muted/40 p-3.5 border border-border/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span>Calibrated Strategy for the Upcoming Month:</span>
                    </div>
                    <ul className="space-y-1.5 pl-5 list-disc text-xs text-muted-foreground">
                      {m.strategicGoals.map((goal, gIdx) => (
                        <li key={gIdx}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
