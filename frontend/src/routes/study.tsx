import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  BrainCircuit,
  Flame,
  Clock,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Gauge } from "@/components/gauge";
import { useGuard } from "@/lib/use-guard";
import { useTwin, getRoleConfig } from "@/lib/twin-store";
import {
  getStudyAnalytics,
  getStudyForecast,
  generateStudyPlan,
  logStudySession,
} from "@/lib/api";
import { tooltipStyle } from "@/routes/dashboard";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study & Productivity Intelligence — Digital Twin" },
      {
        name: "description",
        content: "Analyze study schedules, predict academic performance, and generate AI study plans.",
      },
    ],
  }),
  component: StudyIntelligencePage,
});

function StudyIntelligencePage() {
  const ok = useGuard();
  const { state, addTask } = useTwin();
  const p = state.profile;
  const cfg = getRoleConfig(p.role);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"analytics" | "forecast" | "plan">("analytics");
  
  // Analytics data
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Forecast data
  const [targetScore, setTargetScore] = useState<number>(88);
  const [forecast, setForecast] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // AI Plan data
  const [plan, setPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [targetMilestone, setTargetMilestone] = useState<string>("Upcoming Midterms & Finals");

  // Log session modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logSubject, setLogSubject] = useState("Computer Science");
  const [logDuration, setLogDuration] = useState(60);
  const [logFocus, setLogFocus] = useState(8);
  const [logScore, setLogScore] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logging, setLogging] = useState(false);

  // Fetch analytics and forecast on mount
  useEffect(() => {
    if (!p.id) return;
    
    setAnalyticsLoading(true);
    getStudyAnalytics(p.id)
      .then((data) => setAnalytics(data))
      .catch((err) => console.warn("Failed to load study analytics:", err))
      .finally(() => setAnalyticsLoading(false));

    setForecastLoading(true);
    getStudyForecast(p.id, targetScore)
      .then((data) => setForecast(data))
      .catch((err) => console.warn("Failed to load study forecast:", err))
      .finally(() => setForecastLoading(false));
  }, [p.id, targetScore]);

  // Load or generate initial study plan
  const handleGeneratePlan = async (force = false) => {
    if (!p.id) return;
    setPlanLoading(true);
    try {
      const result = await generateStudyPlan(p.id, {
        target_milestone: targetMilestone,
        force_refresh: force,
      });
      setPlan(result);
      toast.success(force ? "Fresh study plan generated" : "Study plan loaded");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate study plan");
    } finally {
      setPlanLoading(false);
    }
  };

  // Submit study session log
  const handleLogSession = async () => {
    if (!p.id || !logSubject) {
      toast.error("Please enter a subject");
      return;
    }
    setLogging(true);
    try {
      await logStudySession(p.id, {
        subject: logSubject,
        duration_minutes: logDuration,
        focus_score: logFocus,
        exam_score: logScore ? Number(logScore) : null,
        notes: logNotes || null,
      });
      toast.success("Study session logged!");
      setLogModalOpen(false);
      
      // Refresh analytics & forecast
      const [newAnalytics, newForecast] = await Promise.all([
        getStudyAnalytics(p.id),
        getStudyForecast(p.id, targetScore),
      ]);
      setAnalytics(newAnalytics);
      setForecast(newForecast);
    } catch (e: any) {
      toast.error(e.message || "Failed to log study session");
    } finally {
      setLogging(false);
    }
  };

  // Adopt a study block into Today's Planner
  const handleAdoptBlock = (block: any) => {
    addTask({
      title: block.task_title || `${block.subject} Study Sprint`,
      start: block.start_time || "08:30",
      minutes: block.duration_minutes || 60,
      category: "Study",
      done: false,
    });
    toast.success(`"${block.task_title}" added to Today's Plan!`);
  };

  if (!ok) return null;

  // Role Gate check: Only roles requiring study intelligence can access
  if (!cfg.hasStudyIntelligence) {
    return (
      <AppShell title="Study & Productivity Intelligence">
        <div className="panel p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground opacity-60" />
          <h3 className="font-display text-lg font-semibold">Coursework Intelligence Scoped to Students</h3>
          <p className="text-sm text-muted-foreground">
            Your active role is <strong>{cfg.name}</strong>. The Study & Academic Intelligence module is specifically tailored for Students tracking coursework, exams, and lecture revision.
          </p>
          <div className="pt-2">
            <Button onClick={() => navigate({ to: "/dashboard" })}>Return to Overview</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const weeklyChartData = analytics?.weekly_distribution || [
    { day: "Mon", hours: 3.5, focus: 8.2 },
    { day: "Tue", hours: 4.0, focus: 8.5 },
    { day: "Wed", hours: 3.0, focus: 7.9 },
    { day: "Thu", hours: 4.5, focus: 8.6 },
    { day: "Fri", hours: 3.0, focus: 7.8 },
    { day: "Sat", hours: 2.0, focus: 8.0 },
    { day: "Sun", hours: 2.5, focus: 8.1 },
  ];

  const trendData = forecast?.trend_analysis || {
    trend: "improving",
    current_average: 84.5,
    projected_scores: [85.5, 87.0, 88.5, 90.0],
    confidence: 0.85,
  };

  const trajectoryChartData = [
    { period: "Week -3", score: Math.round(trendData.current_average - 6) },
    { period: "Week -2", score: Math.round(trendData.current_average - 3) },
    { period: "Week -1", score: Math.round(trendData.current_average - 1) },
    { period: "Current", score: Math.round(trendData.current_average) },
    ...(trendData.projected_scores || []).map((score: number, idx: number) => ({
      period: `Week +${idx + 1}`,
      projected: score,
    })),
  ];

  const readinessProb = forecast?.readiness_analysis?.readiness_probability ?? 0.84;
  const readinessPercent = Math.round(readinessProb * 100);
  const projectedScore = forecast?.readiness_analysis?.projected_score ?? 89.2;
  const retentionScore = forecast?.retention_health_score ?? 84;

  return (
    <AppShell
      title="Study & Productivity Intelligence"
      subtitle="Analyze learning schedules, predict exam readiness, and generate AI study plans."
      actions={
        <Button onClick={() => setLogModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Log Study Session</span>
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="analytics" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Schedule & Habits</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Exam & Trends</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span>AI Study Optimizer</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SCHEDULE & HABITS */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="label-xs">Total Study (30d)</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 font-display text-2xl font-semibold">
                {analytics?.total_study_hours ?? "36.0"} hrs
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                ~{analytics?.avg_weekly_hours ?? "18.0"}h weekly average
              </p>
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="label-xs">Average Focus</span>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 font-display text-2xl font-semibold">
                {analytics?.avg_focus_score ?? "8.2"} / 10
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Optimal peak: {analytics?.peak_focus_time ?? "08:30 - 11:30"}
              </p>
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="label-xs">Retention Health</span>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 font-display text-2xl font-semibold">
                {retentionScore}%
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                High spaced-repetition consistency
              </p>
            </div>

            <div className="panel p-5">
              <div className="flex items-center justify-between">
                <span className="label-xs">Sleep-Focus Boost</span>
                <Award className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 font-display text-2xl font-semibold">
                +1.2 pts
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                When sleep exceeds 7.5 hours
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Weekly Study Distribution Chart */}
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-sm font-semibold">Weekly Study Distribution</h3>
                  <p className="text-xs text-muted-foreground">Daily hours logged across the week</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} hours`, "Study Duration"]} />
                    <Bar dataKey="hours" fill="var(--color-foreground)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="panel p-6">
              <h3 className="font-display text-sm font-semibold mb-1">Subject Time Investment</h3>
              <p className="text-xs text-muted-foreground mb-4">Tracked hours and focus ratings</p>
              
              <div className="space-y-3">
                {(analytics?.subjects || [
                  { subject: "Computer Science", total_hours: 12.5, avg_focus: 8.4, sessions_count: 8 },
                  { subject: "Algorithms", total_hours: 10.0, avg_focus: 7.8, sessions_count: 6 },
                  { subject: "Database Systems", total_hours: 7.5, avg_focus: 8.1, sessions_count: 5 },
                  { subject: "Web Engineering", total_hours: 6.0, avg_focus: 8.5, sessions_count: 4 },
                ]).map((subj: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/60 pb-2.5 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{subj.subject}</p>
                      <p className="text-xs text-muted-foreground">{subj.sessions_count} sessions · {subj.avg_focus}/10 focus</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-semibold">{subj.total_hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PERFORMANCE & EXAM FORECASTING */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {/* Performance Trajectory Line Chart */}
              <div className="panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-sm font-semibold">Academic Performance Trajectory</h3>
                    <p className="text-xs text-muted-foreground">Historical test/focus scores & 4-week forecast</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-accent font-medium capitalize">
                      Trend: {trendData.trend}
                    </span>
                  </div>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryChartData}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="period" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[50, 100]} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "Performance Score"]} />
                      <Line type="monotone" dataKey="score" stroke="var(--color-foreground)" strokeWidth={2} dot={{ r: 4 }} name="Historical Score" />
                      <Line type="monotone" dataKey="projected" stroke="var(--color-muted-foreground)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Projected Trajectory" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Exam & Milestone Prep Analysis */}
              <div className="panel p-6 space-y-4">
                <h3 className="font-display text-sm font-semibold">Coursework & Exam Readiness Diagnosis</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-3.5 rounded-lg bg-accent/40 border border-border/60">
                    <p className="label-xs">Target Exam Score</p>
                    <p className="text-xl font-bold font-display mt-1">{targetScore}%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Milestone target</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-accent/40 border border-border/60">
                    <p className="label-xs">Projected Exam Score</p>
                    <p className="text-xl font-bold font-display mt-1">{projectedScore}%</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Based on study pace</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-accent/40 border border-border/60">
                    <p className="label-xs">Recommended Daily Pace</p>
                    <p className="text-xl font-bold font-display mt-1">{forecast?.readiness_analysis?.recommended_daily_minutes ?? 120} min</p>
                    <p className="text-xs text-muted-foreground mt-0.5">High-focus sprints</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gauge & Target Settings */}
            <div className="space-y-6">
              <div className="panel flex flex-col items-center p-6 text-center">
                <Gauge
                  size={190}
                  value={readinessProb * 10}
                  display={`${readinessPercent}%`}
                  label="Exam Readiness"
                  sublabel="Probability of hitting target"
                  warning={readinessPercent < 70}
                  animating={forecastLoading}
                />
              </div>

              <div className="panel p-6 space-y-4">
                <h4 className="font-display text-sm font-semibold">Milestone Target</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="label-xs">Target Exam / Coursework Score (%)</Label>
                    <Input
                      type="number"
                      min={50}
                      max={100}
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="label-xs">Upcoming Milestone Name</Label>
                    <Input
                      value={targetMilestone}
                      onChange={(e) => setTargetMilestone(e.target.value)}
                      placeholder="e.g. Midterm Exams"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: AI STUDY PLANNER & OPTIMIZER */}
        <TabsContent value="plan" className="space-y-6">
          <div className="panel p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-foreground" />
                  <h3 className="font-display text-base font-semibold">AI Optimized 7-Day Study Schedule</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Structured Pomodoro sprints, active recall intervals, and priority subject allocation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleGeneratePlan(true)}
                  disabled={planLoading}
                  className="gap-2 shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{planLoading ? "Generating Schedule..." : "Generate Fresh Plan"}</span>
                </Button>
              </div>
            </div>

            {!plan && !planLoading && (
              <div className="py-12 text-center space-y-3">
                <BrainCircuit className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                <p className="text-sm font-medium">No study plan generated yet.</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click "Generate Fresh Plan" to craft an intelligent 7-day coursework roadmap tailored to your exams.
                </p>
                <Button onClick={() => handleGeneratePlan(false)} variant="outline" className="mt-2">
                  Generate Study Plan
                </Button>
              </div>
            )}

            {plan && (
              <div className="mt-6 space-y-6">
                {/* Goal & Focus Strategy */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-accent/40 border border-border/60">
                    <p className="label-xs">Weekly Objective</p>
                    <p className="text-sm font-medium mt-1">{plan.weekly_goal}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/40 border border-border/60">
                    <p className="label-xs">Cognitive Focus Strategy</p>
                    <p className="text-sm font-medium mt-1">{plan.focus_strategy}</p>
                  </div>
                </div>

                {/* 7-Day Day Cards */}
                <div className="space-y-4">
                  <h4 className="font-display text-sm font-semibold">7-Day Study Blocks</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plan.daily_plans?.map((dayPlan: any, i: number) => (
                      <div key={i} className="panel p-4 space-y-3 bg-card/60">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="font-semibold text-sm">{dayPlan.day}</span>
                          <span className="text-xs text-muted-foreground">
                            {dayPlan.blocks?.reduce((acc: number, b: any) => acc + (b.duration_minutes || 0), 0)} min total
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {dayPlan.blocks?.map((block: any, j: number) => (
                            <div key={j} className="p-2.5 rounded-md bg-accent/30 border border-border/40 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">{block.subject}</span>
                                <span className="font-mono text-muted-foreground">{block.start_time} ({block.duration_minutes}m)</span>
                              </div>
                              <p className="text-muted-foreground text-xs">{block.task_title}</p>
                              <div className="pt-1 flex items-center justify-between">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-foreground font-medium">
                                  {block.focus_type}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleAdoptBlock(block)}
                                >
                                  <span>+ Add to Tasks</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {plan.recommendations && plan.recommendations.length > 0 && (
                  <div className="pt-4 border-t border-border/60 space-y-3">
                    <h4 className="font-display text-sm font-semibold">AI Productivity Recommendations</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {plan.recommendations.map((rec: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-lg border border-border bg-sidebar/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{rec.title}</span>
                            <span className="text-[10px] font-mono font-medium text-foreground bg-accent px-1.5 py-0.5 rounded">
                              {rec.impact}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* LOG STUDY SESSION DIALOG */}
      <Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Study Session</DialogTitle>
            <DialogDescription>
              Record a completed coursework block or exam score to update your academic twin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
              <Label className="label-xs">Subject / Course</Label>
              <Input
                value={logSubject}
                onChange={(e) => setLogSubject(e.target.value)}
                placeholder="e.g. Algorithms & Data Structures"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex justify-between">
                <Label className="label-xs">Duration (Minutes)</Label>
                <span className="text-xs font-mono">{logDuration} mins ({roundHours(logDuration)}h)</span>
              </div>
              <Slider
                min={15}
                max={180}
                step={15}
                value={[logDuration]}
                onValueChange={([val]) => setLogDuration(val)}
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex justify-between">
                <Label className="label-xs">Focus Rating (1 - 10)</Label>
                <span className="text-xs font-mono">{logFocus} / 10</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[logFocus]}
                onValueChange={([val]) => setLogFocus(val)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="label-xs">Test / Quiz Score % (Optional)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={logScore}
                onChange={(e) => setLogScore(e.target.value)}
                placeholder="e.g. 88 (leave blank if normal study)"
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="label-xs">Notes / Topic (Optional)</Label>
              <Input
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="e.g. Dynamic Programming problem set 4"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLogModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogSession} disabled={logging}>
              {logging ? "Logging..." : "Save Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function roundHours(mins: number) {
  return (mins / 60.0).toFixed(1);
}
