import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Clock,
  Flame,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  Maximize2,
  Minimize2,
  Music,
  Image as ImageIcon,
  Calendar,
  Plus,
  Trash2,
  ArrowUpRight,
  GraduationCap,
  Check,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Gauge } from "@/components/gauge";
import { AppShell } from "@/components/app-shell";
import { useTwin, today } from "@/lib/twin-store";
import { useGuard } from "@/lib/use-guard";
import {
  getStudyAnalytics,
  getStudyForecast,
  getSavedStudyPlan,
  generateStudyPlan,
  logStudySession,
  getStudyOnboardingStatus,
  getStudyExams,
  addStudyExam,
  deleteStudyExam,
} from "@/lib/api";
import { StudyOnboardingModal } from "@/components/study-onboarding-modal";
import {
  SOUNDSCAPES,
  type SoundscapeType,
  soundscapeEngine,
} from "@/components/pomodoro-soundscapes";
import { tooltipStyle } from "@/routes/dashboard";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study & Academic Intelligence — Visual Risk AI" },
      {
        name: "description",
        content: "Interactive Pomodoro focus, ambient soundscapes, exam countdowns, and adaptive AI schedules.",
      },
    ],
  }),
  component: StudyIntelligencePage,
});

interface WallpaperOption {
  id: string;
  name: string;
  url: string;
  thumb: string;
  accent: string;
}

const WALLPAPERS: WallpaperOption[] = [
  {
    id: "cyberpunk",
    name: "Cyberpunk Glow",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop",
    accent: "#a855f7",
  },
  {
    id: "library",
    name: "Midnight Library",
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1920&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=200&auto=format&fit=crop",
    accent: "#38bdf8",
  },
  {
    id: "lofi-cafe",
    name: "Cozy Lo-Fi Cafe",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1920&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=200&auto=format&fit=crop",
    accent: "#f59e0b",
  },
  {
    id: "rainy-tokyo",
    name: "Rainy Tokyo Alley",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1920&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=200&auto=format&fit=crop",
    accent: "#06b6d4",
  },
  {
    id: "space",
    name: "Nebula Observatory",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop",
    accent: "#8b5cf6",
  },
  {
    id: "minimal-dusk",
    name: "Minimalist Dusk",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=200&auto=format&fit=crop",
    accent: "#10b981",
  },
];

function StudyIntelligencePage() {
  const ok = useGuard();
  const { state, addTask, addLog } = useTwin();
  const p = state.profile;

  const [activeTab, setActiveTab] = useState<"session" | "analytics" | "forecast" | "plan">("session");

  // Onboarding state
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [userCurriculum, setUserCurriculum] = useState<any>(null);

  // Data states
  const [analytics, setAnalytics] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [adoptedSprints, setAdoptedSprints] = useState<Set<string>>(new Set());

  // Pomodoro timer states
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [focusLengthMins, setFocusLengthMins] = useState(25);
  const [breakLengthMins, setBreakLengthMins] = useState(5);
  const [longBreakLengthMins, setLongBreakLengthMins] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSprints, setCompletedSprints] = useState(0);

  // Subject selector
  const [selectedSubject, setSelectedSubject] = useState("Computer Science");

  // Soundscape
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>("none");
  const [soundVolume, setSoundVolume] = useState(0.5);

  // Wallpaper & Zen
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperOption>(WALLPAPERS[0]);
  const [zenMode, setZenMode] = useState(false);

  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [addExamOpen, setAddExamOpen] = useState(false);

  // Save/Log modal fields
  const [logSubject, setLogSubject] = useState("");
  const [logMinutes, setLogMinutes] = useState(25);
  const [logFocusScore, setLogFocusScore] = useState(8);
  const [logExamScore, setLogExamScore] = useState<string>("");
  const [logNotes, setLogNotes] = useState("");
  const [addReviewTask, setAddReviewTask] = useState(true);

  // Add exam modal fields
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTargetScore, setExamTargetScore] = useState(85);

  // Refresh all study data from MongoDB
  const refreshAllData = useCallback(() => {
    if (!p.id) return;
    getStudyAnalytics(p.id)
      .then((data) => setAnalytics(data))
      .catch((err) => console.error("Error loading study analytics:", err));

    getStudyForecast(p.id)
      .then((data) => setForecast(data))
      .catch((err) => console.error("Error loading study forecast:", err));

    getSavedStudyPlan(p.id)
      .then((data) => {
        if (data && data.plan) setStudyPlan(data.plan);
      })
      .catch(() => {});

    getStudyExams(p.id)
      .then((data) => {
        if (Array.isArray(data)) setExams(data);
      })
      .catch(() => {});
  }, [p.id]);

  // Check onboarding on mount
  useEffect(() => {
    if (!p.id) return;
    getStudyOnboardingStatus(p.id)
      .then((res: any) => {
        if (res && !res.onboarded) {
          setOnboardingOpen(true);
        } else if (res && res.profile) {
          setUserCurriculum(res.profile);
          if (res.profile.subjects && res.profile.subjects.length > 0) {
            setSelectedSubject(res.profile.subjects[0]);
            setLogSubject(res.profile.subjects[0]);
            setExamSubject(res.profile.subjects[0]);
          }
        }
      })
      .catch(() => {});
    refreshAllData();
  }, [p.id, refreshAllData]);

  // Handle timer completion
  const handleTimerCompleted = useCallback(() => {
    setIsTimerRunning(false);
    soundscapeEngine.stop();
    soundscapeEngine.playChime();

    if (timerMode === "focus") {
      const nextCount = completedSprints + 1;
      setCompletedSprints(nextCount);
      toast.success("Focus sprint completed! Great job.");
      setLogSubject(selectedSubject);
      setLogMinutes(focusLengthMins);
      setSaveModalOpen(true);

      if (nextCount % 4 === 0) {
        setTimerMode("longBreak");
        setSecondsLeft(longBreakLengthMins * 60);
      } else {
        setTimerMode("shortBreak");
        setSecondsLeft(breakLengthMins * 60);
      }
    } else {
      toast.info("Break finished! Ready for next sprint?");
      setTimerMode("focus");
      setSecondsLeft(focusLengthMins * 60);
    }
  }, [completedSprints, timerMode, selectedSubject, focusLengthMins, breakLengthMins, longBreakLengthMins]);

  // Timer interval
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleTimerCompleted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, handleTimerCompleted]);

  // Soundscape handlers
  const handleSelectSoundscape = (type: SoundscapeType) => {
    setActiveSoundscape(type);
    if (isTimerRunning && type !== "none") {
      soundscapeEngine.play(type, soundVolume);
    } else {
      soundscapeEngine.stop();
    }
  };

  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    soundscapeEngine.setVolume(vol);
  };

  const handleTogglePlay = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      soundscapeEngine.stop();
    } else {
      setIsTimerRunning(true);
      if (activeSoundscape !== "none") {
        soundscapeEngine.play(activeSoundscape, soundVolume);
      }
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    soundscapeEngine.stop();
    if (timerMode === "focus") setSecondsLeft(focusLengthMins * 60);
    else if (timerMode === "shortBreak") setSecondsLeft(breakLengthMins * 60);
    else setSecondsLeft(longBreakLengthMins * 60);
  };

  const handleAddFiveMinutes = () => {
    setSecondsLeft((prev) => prev + 300);
    toast.info("Added +5 minutes to current sprint.");
  };

  const handleSwitchMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setIsTimerRunning(false);
    soundscapeEngine.stop();
    setTimerMode(mode);
    if (mode === "focus") setSecondsLeft(focusLengthMins * 60);
    else if (mode === "shortBreak") setSecondsLeft(breakLengthMins * 60);
    else setSecondsLeft(longBreakLengthMins * 60);
  };

  // Save session to MongoDB & twin-store
  const handleSaveSession = async () => {
    if (!p.id) return;
    try {
      const payload: Record<string, unknown> = {
        subject: logSubject || selectedSubject,
        duration_minutes: logMinutes,
        focus_score: logFocusScore,
        notes: logNotes || "Pomodoro sprint completed in Focus Studio",
      };
      if (logExamScore && !isNaN(Number(logExamScore))) {
        payload.exam_score = Number(logExamScore);
      }

      await logStudySession(p.id, payload);

      addLog({
        date: today(),
        sleep: 7.5,
        screen: 3.5,
        study: +(logMinutes / 60).toFixed(1),
        exercise: 0,
        mood: logFocusScore,
      });

      if (addReviewTask) {
        addTask({
          title: `Review notes for ${logSubject || selectedSubject}`,
          start: "18:00",
          minutes: 15,
          category: "study",
          done: false,
          date: today(),
        });
        toast.info("Added 15-minute review task to today's Planner!");
      }

      toast.success("Study session saved and synced to database & analytics!");
      setSaveModalOpen(false);
      setLogNotes("");
      setLogExamScore("");
      refreshAllData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save study session");
    }
  };

  // Manual session log
  const handleManualLog = async () => {
    if (!p.id) return;
    try {
      const payload: Record<string, unknown> = {
        subject: logSubject || selectedSubject,
        duration_minutes: logMinutes,
        focus_score: logFocusScore,
        notes: logNotes || "Manual session log",
      };
      if (logExamScore && !isNaN(Number(logExamScore))) {
        payload.exam_score = Number(logExamScore);
      }

      await logStudySession(p.id, payload);

      addLog({
        date: today(),
        sleep: 7.5,
        screen: 3.5,
        study: +(logMinutes / 60).toFixed(1),
        exercise: 0,
        mood: logFocusScore,
      });

      toast.success("Past session recorded successfully!");
      setLogModalOpen(false);
      setLogNotes("");
      setLogExamScore("");
      refreshAllData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to log session");
    }
  };

  // Exam handlers
  const handleAddExamSubmit = async () => {
    if (!p.id || !examTitle.trim() || !examDate) {
      toast.error("Please provide exam title and date");
      return;
    }
    try {
      await addStudyExam(p.id, {
        title: examTitle.trim(),
        subject: examSubject || selectedSubject,
        exam_date: examDate,
        target_score: examTargetScore,
      });
      toast.success(`Exam "${examTitle}" registered!`);
      setAddExamOpen(false);
      setExamTitle("");
      refreshAllData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to register exam");
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!p.id) return;
    try {
      await deleteStudyExam(p.id, examId);
      toast.success("Exam milestone removed");
      refreshAllData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete exam");
    }
  };

  // AI Plan Generation & Adoption
  const handleGeneratePlan = async () => {
    if (!p.id) return;
    setIsGeneratingPlan(true);
    try {
      const res = await generateStudyPlan(p.id, { force_refresh: true });
      if (res && res.plan) {
        setStudyPlan(res.plan);
        toast.success("AI Twin generated a fresh 7-day adaptive study plan!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate study plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleAdoptSprint = (sprintKey: string, block: any) => {
    addTask({
      title: `Study: ${block.subject || block.topic || "Focus Block"}`,
      start: block.start_time || "14:00",
      minutes: block.duration_minutes || 45,
      category: "study",
      done: false,
      date: today(),
    });
    setAdoptedSprints((prev) => new Set(prev).add(sprintKey));
    toast.success(`Added ${block.subject || "sprint"} to Today's Planner!`);
  };

  const handleAdoptDayPlan = (dayIndex: number, dayPlan: any) => {
    if (!dayPlan.blocks || !Array.isArray(dayPlan.blocks)) return;
    dayPlan.blocks.forEach((block: any, idx: number) => {
      addTask({
        title: `Study: ${block.subject || block.topic || `Session ${idx + 1}`}`,
        start: block.start_time || `${10 + idx * 2}:00`,
        minutes: block.duration_minutes || 45,
        category: "study",
        done: false,
        date: today(),
      });
    });
    setAdoptedSprints((prev) => {
      const next = new Set(prev);
      dayPlan.blocks.forEach((_: any, idx: number) => {
        next.add(`${dayIndex}-${idx}`);
      });
      return next;
    });
    toast.success(`All sprints for ${dayPlan.day_name || `Day ${dayIndex + 1}`} adopted into Planner!`);
  };

  if (!ok) return null;

  const availableSubjects = useMemo(() => {
    const list: string[] = [];
    if (userCurriculum?.subjects) list.push(...userCurriculum.subjects);
    if (analytics?.subjects) {
      analytics.subjects.forEach((s: any) => {
        if (!list.includes(s.subject)) list.push(s.subject);
      });
    }
    return list.length > 0 ? list : ["Computer Science", "Mathematics"];
  }, [userCurriculum, analytics]);

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalModeSeconds =
    timerMode === "focus"
      ? focusLengthMins * 60
      : timerMode === "shortBreak"
      ? breakLengthMins * 60
      : longBreakLengthMins * 60;

  const timerProgress = Math.max(0, Math.min(1, (totalModeSeconds - secondsLeft) / totalModeSeconds));
  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - timerProgress);

  const weeklyChartData = analytics?.weekly_distribution || [
    { day: "Mon", hours: 0.0, focus: 0.0 },
    { day: "Tue", hours: 0.0, focus: 0.0 },
    { day: "Wed", hours: 0.0, focus: 0.0 },
    { day: "Thu", hours: 0.0, focus: 0.0 },
    { day: "Fri", hours: 0.0, focus: 0.0 },
    { day: "Sat", hours: 0.0, focus: 0.0 },
    { day: "Sun", hours: 0.0, focus: 0.0 },
  ];

  const trendData = forecast?.trend_analysis || {
    trend: "no records",
    current_average: 0.0,
    projected_scores: [],
    confidence: 0.0,
  };

  const readinessProb = forecast?.readiness_analysis?.readiness_probability ?? 0.0;
  const readinessPercent = Math.round(readinessProb * 100);
  const projectedScore = forecast?.readiness_analysis?.projected_score ?? 0.0;
  const retentionScore = forecast?.retention_health_score ?? 100;
  const totalStudyHours = analytics?.total_study_hours ?? 0.0;
  const avgWeeklyHours = analytics?.avg_weekly_hours ?? 0.0;

  return (
    <AppShell
      title="Study & Academic Intelligence"
      subtitle="Interactive Pomodoro focus, ambient soundscapes, exam countdowns, and adaptive AI schedules."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOnboardingOpen(true)}
            className="gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Tour & Curriculum</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setLogModalOpen(true)}
            className="gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Study</span>
          </Button>
        </div>
      }
    >
      <StudyOnboardingModal
        open={onboardingOpen}
        userId={p.id}
        onCompleted={(curriculum) => {
          setUserCurriculum(curriculum);
          setOnboardingOpen(false);
          if (curriculum.subjects && curriculum.subjects.length > 0) {
            setSelectedSubject(curriculum.subjects[0]);
            setLogSubject(curriculum.subjects[0]);
            setExamSubject(curriculum.subjects[0]);
          }
          refreshAllData();
        }}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/60 p-1 border border-border">
          <TabsTrigger value="session" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Study Session</span>
            <span className="sm:hidden">Session</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule & Habits</span>
            <span className="sm:hidden">Habits</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Exams & Trends</span>
            <span className="sm:hidden">Exams</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Study Optimizer</span>
            <span className="sm:hidden">AI Plan</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: STUDY SESSION WORKSPACE */}
        <TabsContent value="session" className="space-y-6">
          <div
            className="relative rounded-2xl overflow-hidden border border-border transition-all duration-700 shadow-2xl bg-zinc-950"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 15, 0.75), rgba(10, 10, 15, 0.95)), url('${activeWallpaper.url}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Top Toolbar */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md bg-black/30">
              <div className="flex items-center gap-2 min-w-[220px]">
                <GraduationCap className="h-5 w-5 text-purple-400" />
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-purple-300 block uppercase tracking-wider">
                    Active Study Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-md px-2.5 py-1 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub} className="bg-zinc-900 text-white">
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Soundscape controls */}
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-cyan-400" />
                <select
                  value={activeSoundscape}
                  onChange={(e) => handleSelectSoundscape(e.target.value as SoundscapeType)}
                  className="bg-black/40 border border-white/20 rounded-md px-2.5 py-1 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  {SOUNDSCAPES.map((sc) => (
                    <option key={sc.id} value={sc.id} className="bg-zinc-900 text-white">
                      {sc.name}
                    </option>
                  ))}
                </select>

                {activeSoundscape !== "none" && (
                  <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                    <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[soundVolume]}
                      onValueChange={(v) => handleVolumeChange(v[0])}
                      className="w-16"
                    />
                  </div>
                )}
              </div>

              {/* Wallpaper & Zen Mode */}
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-amber-400" />
                <select
                  value={activeWallpaper.id}
                  onChange={(e) => {
                    const found = WALLPAPERS.find((w) => w.id === e.target.value);
                    if (found) setActiveWallpaper(found);
                  }}
                  className="bg-black/40 border border-white/20 rounded-md px-2.5 py-1 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  {WALLPAPERS.map((wp) => (
                    <option key={wp.id} value={wp.id} className="bg-zinc-900 text-white">
                      Theme: {wp.name}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setZenMode(!zenMode)}
                  className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-2"
                  title={zenMode ? "Exit Zen Mode" : "Zen Mode"}
                >
                  {zenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Focus Ring & Controls */}
            <div className={`p-6 sm:p-12 flex flex-col items-center justify-center text-center space-y-8 backdrop-blur-sm ${zenMode ? "py-16 sm:py-24" : ""}`}>
              {/* Mode Selectors */}
              <div className="inline-flex items-center p-1 rounded-xl bg-black/50 border border-white/15 backdrop-blur-md gap-1">
                <button
                  type="button"
                  onClick={() => handleSwitchMode("focus")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timerMode === "focus"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Deep Work ({focusLengthMins}m)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode("shortBreak")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timerMode === "shortBreak"
                      ? "bg-cyan-600 text-white shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Short Break ({breakLengthMins}m)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode("longBreak")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timerMode === "longBreak"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Long Break ({longBreakLengthMins}m)
                </button>
              </div>

              {/* Glowing circular timer */}
              <div className="relative flex items-center justify-center">
                <svg className="w-72 h-72 transform -rotate-90" viewBox="0 0 240 240">
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white/10"
                    fill="transparent"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ${
                      timerMode === "focus"
                        ? "text-purple-500"
                        : timerMode === "shortBreak"
                        ? "text-cyan-400"
                        : "text-emerald-400"
                    }`}
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 text-white">
                  <Badge
                    variant="secondary"
                    className="text-[11px] uppercase tracking-wider font-bold bg-white/10 border-white/20 text-white mb-1"
                  >
                    {timerMode === "focus" ? "Focus Sprint" : "Recovery Window"}
                  </Badge>
                  <div className="font-mono text-6xl font-black tracking-tight drop-shadow-lg">
                    {formatTime(secondsLeft)}
                  </div>
                  <div className="text-xs text-white/70 font-medium">
                    {selectedSubject || "Select Subject"}
                  </div>
                  <div className="text-[11px] text-white/50 pt-1">
                    Sprint {completedSprints + 1} of 4 · {Math.round(timerProgress * 100)}%
                  </div>
                </div>
              </div>

              {/* Interactive buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleTogglePlay}
                  className={`h-14 px-8 rounded-full font-bold text-base shadow-xl gap-2 transition-all ${
                    isTimerRunning
                      ? "bg-amber-600 hover:bg-amber-500 text-white ring-4 ring-amber-500/20"
                      : "bg-purple-600 hover:bg-purple-500 text-white ring-4 ring-purple-500/20"
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="h-5 w-5" />
                      <span>Pause Session</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 fill-current" />
                      <span>Start Focus Sprint</span>
                    </>
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleResetTimer}
                  className="h-12 w-12 rounded-full border-white/20 bg-black/40 text-white hover:bg-white/20"
                  title="Reset Sprint"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleAddFiveMinutes}
                  className="h-12 w-12 rounded-full border-white/20 bg-black/40 text-white hover:bg-white/20 text-xs font-bold"
                  title="+5 Minutes"
                >
                  +5m
                </Button>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleTimerCompleted}
                  className="h-12 w-12 rounded-full border-white/20 bg-black/40 text-white hover:bg-white/20"
                  title="Complete / Skip to Break"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setLogSubject(selectedSubject);
                    setLogMinutes(Math.max(5, Math.round((totalModeSeconds - secondsLeft) / 60) || 25));
                    setSaveModalOpen(true);
                  }}
                  className="h-12 px-4 rounded-full border-white/20 bg-black/40 text-purple-300 hover:bg-white/20 text-xs font-semibold gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Finish & Save to Database</span>
                </Button>
              </div>

              {/* Wallpaper Gallery Thumbnails (if not zen) */}
              {!zenMode && (
                <div className="w-full max-w-xl pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span className="font-semibold flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-amber-400" /> Focus Studio Wallpaper Gallery
                    </span>
                    <span className="text-[11px] text-white/50">Click to change backdrop</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {WALLPAPERS.map((wp) => (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => setActiveWallpaper(wp)}
                        className={`group relative rounded-lg overflow-hidden border transition-all h-14 ${
                          activeWallpaper.id === wp.id
                            ? "border-purple-400 ring-2 ring-purple-400/40 scale-105"
                            : "border-white/15 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={wp.thumb} alt={wp.name} className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-white font-medium truncate px-1 py-0.5 text-center">
                          {wp.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="panel p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Study Hours</p>
                <p className="text-lg font-bold text-foreground">{totalStudyHours.toFixed(1)}h</p>
              </div>
            </div>

            <div className="panel p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sprints Completed</p>
                <p className="text-lg font-bold text-foreground">{completedSprints}</p>
              </div>
            </div>

            <div className="panel p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weekly Target</p>
                <p className="text-lg font-bold text-foreground">
                  {avgWeeklyHours.toFixed(1)}h / {userCurriculum?.weekly_target ?? 15}h
                </p>
              </div>
            </div>

            <div className="panel p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upcoming Exams</p>
                <p className="text-lg font-bold text-foreground">{exams.length} Registered</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: SCHEDULE & HABITS */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="panel p-5 space-y-1">
              <p className="label-xs">Total Academic Study</p>
              <div className="text-2xl font-bold font-display text-foreground">
                {totalStudyHours.toFixed(1)} hrs
              </div>
              <p className="text-xs text-muted-foreground">
                {totalStudyHours === 0
                  ? "No sessions logged yet. Complete a Pomodoro sprint to start!"
                  : "Logged in MongoDB study records"}
              </p>
            </div>

            <div className="panel p-5 space-y-1">
              <p className="label-xs">Weekly Pace vs Target</p>
              <div className="text-2xl font-bold font-display text-purple-400">
                {avgWeeklyHours.toFixed(1)}h / {userCurriculum?.weekly_target ?? 15}h
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((avgWeeklyHours / Math.max(1, userCurriculum?.weekly_target ?? 15)) * 100)}% of goal
              </p>
            </div>

            <div className="panel p-5 space-y-1">
              <p className="label-xs">Average Focus Rating</p>
              <div className="text-2xl font-bold font-display text-cyan-400">
                {analytics?.avg_focus_score ? `${analytics.avg_focus_score.toFixed(1)} / 10` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Self-rated cognitive depth</p>
            </div>

            <div className="panel p-5 space-y-1">
              <p className="label-xs">Retention Health Index</p>
              <div className="text-2xl font-bold font-display text-emerald-400">
                {retentionScore}%
              </div>
              <p className="text-xs text-muted-foreground">Spaced repetition freshness</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Pace Chart */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Weekly Study Pace by Day</h3>
                  <p className="text-xs text-muted-foreground">Hours dedicated across the week</p>
                </div>
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                  Real Activity
                </Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} unit="h" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Study Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Subject Allocation & Mastery</h3>
                  <p className="text-xs text-muted-foreground">Hours spent per curriculum domain</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setLogModalOpen(true)} className="text-xs text-purple-400 h-7">
                  + Log Session
                </Button>
              </div>

              <div className="space-y-3">
                {analytics?.subjects && analytics.subjects.length > 0 ? (
                  analytics.subjects.map((sub: any) => (
                    <div key={sub.subject} className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{sub.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.sessions_count} sessions · {sub.total_hours.toFixed(1)} hrs total
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs font-semibold">
                          {sub.avg_focus > 0 ? `${sub.avg_focus.toFixed(1)} Focus` : "Fresh Subject"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg space-y-2">
                    <BookOpen className="h-8 w-8 mx-auto opacity-40" />
                    <p className="font-medium text-foreground">No subject records logged yet</p>
                    <p>Start your first sprint in the Study Session tab or click "Log Study" above.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: EXAMS & TRENDS */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registered Exams List */}
            <div className="lg:col-span-2 panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <span>Registered Upcoming Exams & Milestones</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time countdown tracking and milestone readiness
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAddExamOpen(true)}
                  className="gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Exam</span>
                </Button>
              </div>

              <div className="space-y-3">
                {exams.length > 0 ? (
                  exams.map((ex: any) => {
                    const daysLeft = ex.days_left;
                    const isUrgent = daysLeft !== null && daysLeft <= 7;
                    const isPast = daysLeft !== null && daysLeft < 0;

                    return (
                      <div
                        key={ex.id}
                        className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{ex.title}</span>
                            <Badge variant="outline" className="text-[11px] border-purple-500/30 text-purple-400">
                              {ex.subject}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Date: <strong>{ex.exam_date}</strong> · Target Score: <strong>{ex.target_score}%</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {isPast ? (
                            <Badge variant="secondary" className="text-xs bg-zinc-700/50 text-zinc-300">
                              Completed
                            </Badge>
                          ) : (
                            <Badge
                              className={`text-xs font-bold ${
                                isUrgent
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                  : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              }`}
                            >
                              {daysLeft === 0 ? "Today!" : `${daysLeft} days left`}
                            </Badge>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteExam(ex.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg space-y-2">
                    <Calendar className="h-8 w-8 mx-auto opacity-40" />
                    <p className="font-medium text-foreground">No upcoming exams scheduled</p>
                    <p>Click "Add Exam" to set up exam date countdowns and readiness forecasts.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Target Exam Readiness Gauge */}
            <div className="panel p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">Target Exam Readiness</h3>
                <p className="text-xs text-muted-foreground">
                  Stochastic readiness score modeled from study volume and focus
                </p>
              </div>

              <div className="py-4 flex flex-col items-center justify-center space-y-2">
                <Gauge
                  size={170}
                  value={readinessProb * 10}
                  display={`${readinessPercent}%`}
                  label="Readiness Odds"
                  sublabel="Target Score Mastery"
                  colorScheme="purple"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {readinessPercent >= 75
                    ? "Pacing on track to achieve target scores."
                    : "Increase weekly Pomodoro blocks to reach optimal readiness."}
                </p>
              </div>

              <div className="pt-3 border-t border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projected Score:</span>
                  <span className="font-bold text-foreground">{projectedScore > 0 ? `${projectedScore.toFixed(1)}%` : "Awaiting Data"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Focus Target:</span>
                  <span className="font-bold text-purple-400">
                    {forecast?.readiness_analysis?.recommended_daily_minutes ?? 90} mins/day
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Trajectory Chart */}
          <div className="panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Academic Performance Trajectory</h3>
                <p className="text-xs text-muted-foreground">Historical scores and 4-week forward projection</p>
              </div>
              <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-300">
                Trend: {trendData.trend.toUpperCase()}
              </Badge>
            </div>

            <div className="h-64 w-full">
              {trendData.projected_scores && trendData.projected_scores.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { period: "Week -2", score: Math.max(50, Math.round(trendData.current_average - 4)) },
                      { period: "Week -1", score: Math.max(50, Math.round(trendData.current_average - 2)) },
                      { period: "Current", score: Math.round(trendData.current_average) },
                      ...trendData.projected_scores.map((sc: number, idx: number) => ({
                        period: `Week +${idx + 1}`,
                        projected: sc,
                      })),
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="period" stroke="#888888" fontSize={12} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} domain={[40, 100]} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} name="Past Score" />
                    <Line type="monotone" dataKey="projected" stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 5" name="AI Projected" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground space-y-2">
                  <TrendingUp className="h-8 w-8 opacity-40" />
                  <p>Log 2 or more study sessions with exam scores to generate forward statistical score trajectories.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: AI STUDY OPTIMIZER */}
        <TabsContent value="plan" className="space-y-6">
          <div className="panel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <span>AI Twin 7-Day Adaptive Curriculum & Spaced Repetition Plan</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Synthesizes exam milestones, retention health degradation curves, and your peak cognitive energy windows.
                </p>
              </div>

              <Button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan}
                className="bg-purple-600 hover:bg-purple-500 text-white gap-2 text-xs font-semibold shadow-lg shadow-purple-600/20"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isGeneratingPlan ? "Synthesizing Schedule..." : "Generate AI Plan"}</span>
              </Button>
            </div>

            {studyPlan?.schedule && studyPlan.schedule.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {studyPlan.schedule.map((dayItem: any, dIdx: number) => {
                  const dayName = dayItem.day_name || `Day ${dIdx + 1}`;
                  const blocks = dayItem.blocks || [];
                  const peakEnergy = dayItem.peak_energy || userCurriculum?.peak_energy || "Morning (09:00 - 12:00)";

                  return (
                    <div
                      key={dayName}
                      className="panel p-4 border border-border/80 bg-card/60 flex flex-col justify-between space-y-4 rounded-xl shadow-sm hover:border-purple-500/40 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                          <div>
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                              <span>{dayName}</span>
                            </h4>
                            <p className="text-[11px] text-purple-400 font-medium">
                              ⚡ Peak Window: {peakEnergy}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
                            {blocks.length} Sprints
                          </Badge>
                        </div>

                        <div className="space-y-2.5">
                          {blocks.map((b: any, bIdx: number) => {
                            const sprintKey = `${dIdx}-${bIdx}`;
                            const isAdopted = adoptedSprints.has(sprintKey);

                            return (
                              <div
                                key={bIdx}
                                className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex items-start justify-between gap-2 hover:bg-muted/70 transition-all"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-500/15 text-purple-300">
                                      {b.subject || "Subject"}
                                    </Badge>
                                    <span className="text-[11px] font-mono text-muted-foreground">
                                      {b.start_time || "10:00"} ({b.duration_minutes || 45}m)
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-foreground line-clamp-1">
                                    {b.topic || b.objective || "Curriculum deep work"}
                                  </p>
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAdoptSprint(sprintKey, b)}
                                  disabled={isAdopted}
                                  className={`h-7 px-2 text-[11px] gap-1 font-semibold ${
                                    isAdopted
                                      ? "text-emerald-400 bg-emerald-500/10"
                                      : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                  }`}
                                >
                                  {isAdopted ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3" />
                                      <span>Planner</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdoptDayPlan(dIdx, dayItem)}
                          className="w-full text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10 gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Adopt All into Planner</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-border rounded-xl space-y-3">
                <Sparkles className="h-10 w-10 mx-auto text-purple-400 opacity-60" />
                <h4 className="font-bold text-foreground text-sm">No Adaptive Plan Active</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Click "Generate AI Plan" above. Your AI twin will cross-reference upcoming exam dates, weekly study targets, and cognitive energy peaks to formulate a customized 7-day schedule.
                </p>
                <Button
                  onClick={handleGeneratePlan}
                  disabled={isGeneratingPlan}
                  className="bg-purple-600 hover:bg-purple-500 text-white gap-2 text-xs font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Synthesize 7-Day Plan</span>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL 1: SAVE COMPLETED SESSION */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-zinc-950 border border-purple-500/30 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Record Completed Study Sprint</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sync this focus block directly into MongoDB study records, habit streaks, and analytics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <select
                value={logSubject}
                onChange={(e) => setLogSubject(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (Minutes)</Label>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(Number(e.target.value))}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exam Score (Optional %)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 92"
                  min={0}
                  max={100}
                  value={logExamScore}
                  onChange={(e) => setLogExamScore(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label>Focus & Cognitive Depth</Label>
                <span className="font-bold text-purple-400">{logFocusScore} / 10</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[logFocusScore]}
                onValueChange={(v) => setLogFocusScore(v[0])}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Session Notes / Topics Covered</Label>
              <Textarea
                placeholder="What did you accomplish during this focus block?"
                rows={2}
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="bg-muted/50 text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="review-task"
                checked={addReviewTask}
                onCheckedChange={(checked) => setAddReviewTask(Boolean(checked))}
              />
              <label
                htmlFor="review-task"
                className="text-xs text-muted-foreground font-medium cursor-pointer"
              >
                Schedule 15m review sprint in Planner this evening
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSaveModalOpen(false)}>
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSession}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
            >
              Save to Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: MANUAL LOG PAST SESSION */}
      <Dialog open={logModalOpen} onOpenChange={setLogModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-zinc-950 border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              <span>Log Study Session</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Manually add past library time, lecture review, or study sessions to your MongoDB records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <select
                value={logSubject}
                onChange={(e) => setLogSubject(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (Minutes)</Label>
                <Input
                  type="number"
                  min={5}
                  max={360}
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(Number(e.target.value))}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quiz / Exam Score (%)</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  min={0}
                  max={100}
                  value={logExamScore}
                  onChange={(e) => setLogExamScore(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label>Focus Rating</Label>
                <span className="font-bold text-purple-400">{logFocusScore} / 10</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[logFocusScore]}
                onValueChange={(v) => setLogFocusScore(v[0])}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Chapter References</Label>
              <Textarea
                placeholder="e.g. Completed problem set #3 on linear algebra"
                rows={2}
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="bg-muted/50 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLogModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleManualLog}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
            >
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: REGISTER UPCOMING EXAM */}
      <Dialog open={addExamOpen} onOpenChange={setAddExamOpen}>
        <DialogContent className="sm:max-w-[420px] bg-zinc-950 border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span>Register Upcoming Exam Target</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set an exam date to activate countdown timers, readiness gauges, and adaptive pacing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Exam Title</Label>
              <Input
                placeholder="e.g. Midterm Examination / Final Exam"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <select
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Exam Date</Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Target Score (%)</Label>
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={examTargetScore}
                  onChange={(e) => setExamTargetScore(Number(e.target.value))}
                  className="bg-muted/50"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAddExamOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddExamSubmit}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
            >
              Add Exam Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
