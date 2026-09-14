import { useEffect, useState, useMemo, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  BookOpen,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Settings,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Check,
  Plus,
  Trash2,
  Calendar,
  Music,
  ListChecks,
  CheckCircle2,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  GraduationCap,
  Flame,
  HelpCircle,
  Video,
  Image as ImageIcon,
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
import {
  STUDY_WALLPAPERS,
  type WallpaperItem,
  StudySettingsDialog,
} from "@/components/study-settings-dialog";
import { tooltipStyle } from "@/routes/dashboard";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study Cockpit — Visual Risk AI" },
      {
        name: "description",
        content: "Full-screen study mode cockpit with 4K wallpapers, ambient video loops, Pomodoro focus, live clock, and tasks planner.",
      },
    ],
  }),
  component: StudyCockpitPage,
});

type SidebarTab = "tasks" | "habits" | "exams" | "plan";

function StudyCockpitPage() {
  const ok = useGuard();
  const navigate = useNavigate();
  const { state, addTask, toggleTask, removeTask, addLog } = useTwin();
  const p = state.profile;

  // Clock & Timezone state
  const [currentTime, setCurrentTime] = useState("");
  const [timeZoneName, setTimeZoneName] = useState("");

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("tasks");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Wallpaper state
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperItem>(STUDY_WALLPAPERS[0]);

  // Pomodoro timer state
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

  // Telemetry & Academic Data
  const [userCurriculum, setUserCurriculum] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [adoptedSprints, setAdoptedSprints] = useState<Set<string>>(new Set());

  // Inline quick task form
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskMinutes, setQuickTaskMinutes] = useState(45);

  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [addExamOpen, setAddExamOpen] = useState(false);

  // Save session fields
  const [logSubject, setLogSubject] = useState("");
  const [logMinutes, setLogMinutes] = useState(25);
  const [logFocusScore, setLogFocusScore] = useState(8);
  const [logExamScore, setLogExamScore] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [addReviewTask, setAddReviewTask] = useState(true);

  // Add exam fields
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTargetScore, setExamTargetScore] = useState(85);

  // Live Digital Clock & Timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offsetMins = -now.getTimezoneOffset();
        const sign = offsetMins >= 0 ? "+" : "-";
        const hrs = String(Math.floor(Math.abs(offsetMins) / 60)).padStart(2, "0");
        const mins = String(Math.abs(offsetMins) % 60).padStart(2, "0");
        setTimeZoneName(`${tz} (UTC${sign}${hrs}:${mins})`);
      } catch {
        setTimeZoneName("Local Time");
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh study records, analytics, and exams
  const refreshAllData = useCallback(() => {
    if (!p.id) return;
    getStudyAnalytics(p.id)
      .then((data) => setAnalytics(data))
      .catch(() => {});

    getStudyForecast(p.id)
      .then((data) => setForecast(data))
      .catch(() => {});

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
        } else if (res && res.subjects && res.subjects.length > 0) {
          setUserCurriculum(res);
          setSelectedSubject(res.subjects[0]);
          setLogSubject(res.subjects[0]);
          setExamSubject(res.subjects[0]);
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

  // Audio controls
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
    toast.info("Added +5 minutes to sprint.");
  };

  const handleSwitchMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setIsTimerRunning(false);
    soundscapeEngine.stop();
    setTimerMode(mode);
    if (mode === "focus") setSecondsLeft(focusLengthMins * 60);
    else if (mode === "shortBreak") setSecondsLeft(breakLengthMins * 60);
    else setSecondsLeft(longBreakLengthMins * 60);
  };

  // Save session to MongoDB
  const handleSaveSession = async () => {
    if (!p.id) return;
    try {
      const payload: Record<string, unknown> = {
        subject: logSubject || selectedSubject,
        duration_minutes: logMinutes,
        focus_score: logFocusScore,
        notes: logNotes || "Study session completed in Focus Studio",
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

  // Add exam
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

  // AI Plan
  const handleGeneratePlan = async () => {
    if (!p.id) return;
    setIsGeneratingPlan(true);
    try {
      const res = await generateStudyPlan(p.id, { force_refresh: true });
      if (res && res.plan) {
        setStudyPlan(res.plan);
        toast.success("AI Twin generated a fresh 7-day adaptive plan!");
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

  // Quick Task form submit
  const handleAddQuickTask = () => {
    if (!quickTaskTitle.trim()) {
      toast.error("Please enter a task name");
      return;
    }
    addTask({
      title: quickTaskTitle.trim(),
      start: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      minutes: quickTaskMinutes,
      category: "study",
      done: false,
      date: today(),
    });
    setQuickTaskTitle("");
    toast.success("Task added to Today's Planner!");
  };

  if (!ok) return null;

  // Available subjects
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

  // Today's tasks from Planner
  const todaysTasks = useMemo(() => {
    return state.tasks
      .filter((t) => t.date === today())
      .slice()
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [state.tasks]);

  const tasksDoneCount = todaysTasks.filter((t) => t.done).length;

  // Timer math
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

  const readinessProb = forecast?.readiness_analysis?.readiness_probability ?? 0.0;
  const readinessPercent = Math.round(readinessProb * 100);
  const totalStudyHours = analytics?.total_study_hours ?? 0.0;
  const avgWeeklyHours = analytics?.avg_weekly_hours ?? 0.0;

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

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none bg-black text-white flex flex-col font-sans">
      {/* 1. FULL-SCREEN 4K WALLPAPER / LOOPING VIDEO BACKGROUND */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {activeWallpaper.type === "video" ? (
          <video
            key={activeWallpaper.url}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={activeWallpaper.url} type="video/mp4" />
          </video>
        ) : (
          <img
            key={activeWallpaper.url}
            src={activeWallpaper.url}
            alt={activeWallpaper.name}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          />
        )}
        {/* Subtle dark vignette overlay for high UI readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/75" />
      </div>

      {/* 2. TOP IMMERSIVE APP BAR */}
      <header className="relative z-30 h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
        {/* Left: Exit Study Mode + Settings */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/dashboard" })}
            className="gap-2 bg-black/50 border-white/20 hover:bg-white/15 text-white shadow-lg text-xs font-semibold h-9"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Exit Study Mode</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSettingsOpen(true)}
            className="gap-1.5 bg-black/50 border-white/20 hover:bg-white/15 text-white shadow-lg text-xs font-medium h-9"
          >
            <Settings className="h-4 w-4 text-purple-400" />
            <span>Settings</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOnboardingOpen(true)}
            className="text-xs text-white/70 hover:text-white hover:bg-white/10 h-9 hidden md:flex items-center gap-1.5"
          >
            <HelpCircle className="h-3.5 w-3.5 text-purple-400" />
            <span>Curriculum</span>
          </Button>
        </div>

        {/* Center: Live Animated Clock + Timezone */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base sm:text-lg font-black tracking-widest text-white drop-shadow-md">
              {currentTime || "00:00:00"}
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="text-[10px] text-white/60 font-medium tracking-wide">
            {timeZoneName || "Coordinated Universal Time"}
          </div>
        </div>

        {/* Right: Sidebar Toggle & Zen Mode */}
        <div className="flex items-center gap-2">
          {/* Quick Soundscape volume pill */}
          <div className="hidden lg:flex items-center gap-2 bg-black/50 border border-white/15 px-3 py-1 rounded-full text-xs">
            <button
              type="button"
              onClick={() => handleSelectSoundscape(activeSoundscape === "none" ? "lofi" : "none")}
              className="text-cyan-400 hover:text-cyan-300"
              title="Toggle Audio"
            >
              {activeSoundscape === "none" ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <select
              value={activeSoundscape}
              onChange={(e) => handleSelectSoundscape(e.target.value as SoundscapeType)}
              className="bg-transparent border-0 text-[11px] text-white/90 focus:outline-none cursor-pointer"
            >
              {SOUNDSCAPES.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-zinc-900 text-white">
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setZenMode(!zenMode)}
            className="h-9 px-2.5 bg-black/50 border-white/20 hover:bg-white/15 text-white/80 hover:text-white"
            title={zenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
          >
            {zenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`gap-1.5 border-white/20 text-xs font-semibold h-9 ${
              sidebarOpen
                ? "bg-purple-600/80 text-white border-purple-500/50"
                : "bg-black/50 text-white hover:bg-white/15"
            }`}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            <span className="hidden sm:inline">{sidebarOpen ? "Hide Panel" : "Study Panel"}</span>
          </Button>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE WITH COLLAPSIBLE SIDEBAR & CENTER FOCUS ARENA */}
      <main className="relative z-20 flex-1 flex overflow-hidden p-4 sm:p-6 gap-6">
        {/* COLLAPSIBLE ANIMATED STUDY SIDEBAR */}
        <aside
          className={`shrink-0 z-30 w-full sm:w-[380px] lg:w-[420px] rounded-2xl border border-white/15 bg-zinc-950/80 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
            sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0 pointer-events-none hidden"
          }`}
        >
          {/* Sidebar Nav Tabs */}
          <div className="grid grid-cols-4 p-1.5 bg-black/50 border-b border-white/10 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setSidebarTab("tasks")}
              className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === "tasks"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span>Planner</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("habits")}
              className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === "habits"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Habits</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("exams")}
              className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === "exams"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Exams</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("plan")}
              className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === "plan"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Plan</span>
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: TASKS & PLANNER */}
            {sidebarTab === "tasks" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <ListChecks className="h-4 w-4 text-purple-400" />
                      <span>Today's Study & Planner Tasks</span>
                    </h3>
                    <p className="text-[11px] text-white/60">
                      {tasksDoneCount} of {todaysTasks.length} completed
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                    Synced
                  </Badge>
                </div>

                {/* Inline Add Quick Task Form */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add sprint or review task..."
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddQuickTask();
                        }
                      }}
                      className="bg-black/50 border-white/20 text-xs h-8 text-white"
                    />
                    <select
                      value={quickTaskMinutes}
                      onChange={(e) => setQuickTaskMinutes(Number(e.target.value))}
                      className="bg-black/50 border border-white/20 rounded-md px-2 text-xs text-white focus:outline-none"
                    >
                      <option value={15}>15m</option>
                      <option value={25}>25m</option>
                      <option value={45}>45m</option>
                      <option value={60}>60m</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={handleAddQuickTask}
                      className="bg-purple-600 hover:bg-purple-500 text-white h-8 px-2.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-2">
                  {todaysTasks.length > 0 ? (
                    todaysTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                          t.done
                            ? "bg-emerald-500/10 border-emerald-500/20 text-white/50"
                            : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <Checkbox
                            checked={t.done}
                            onCheckedChange={() => toggleTask(t.id)}
                            className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-semibold truncate ${
                                t.done ? "line-through text-white/50" : "text-white"
                              }`}
                            >
                              {t.title}
                            </p>
                            <p className="text-[10px] text-white/50 font-mono">
                              {t.start} · {t.minutes}m · {t.category}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTask(t.id)}
                          className="h-7 w-7 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-white/50 border border-dashed border-white/10 rounded-xl space-y-1">
                      <ListChecks className="h-6 w-6 mx-auto opacity-40" />
                      <p>No tasks scheduled for today yet.</p>
                      <p className="text-[10px]">Type above to add a study sprint.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SCHEDULE & HABITS */}
            {sidebarTab === "habits" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-purple-400" />
                    <span>Academic Telemetry & Habits</span>
                  </h3>
                  <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                    MongoDB
                  </Badge>
                </div>

                {/* 3 Quick KPI Badges */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-white/60">Total Hours</p>
                    <p className="text-sm font-black text-purple-400">{totalStudyHours.toFixed(1)}h</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-white/60">Weekly Pace</p>
                    <p className="text-sm font-black text-cyan-400">{avgWeeklyHours.toFixed(1)}h</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-white/60">Avg Focus</p>
                    <p className="text-sm font-black text-emerald-400">
                      {analytics?.avg_focus_score ? `${analytics.avg_focus_score.toFixed(1)}/10` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Weekly Chart */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-xs font-semibold text-white/80">Weekly Distribution</p>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" stroke="#888888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} unit="h" />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="hours" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Study Hours" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subjects breakdown */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/80">Curriculum Subjects</p>
                  {analytics?.subjects && analytics.subjects.length > 0 ? (
                    analytics.subjects.map((s: any) => (
                      <div
                        key={s.subject}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{s.subject}</p>
                          <p className="text-[10px] text-white/50">
                            {s.sessions_count} sessions · {s.total_hours.toFixed(1)}h
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-[10px]">
                          {s.avg_focus > 0 ? `${s.avg_focus.toFixed(1)} Focus` : "Fresh"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-white/50 border border-dashed border-white/10 rounded-xl">
                      No subjects logged yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: EXAMS & TRENDS */}
            {sidebarTab === "exams" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span>Exams & Milestones</span>
                    </h3>
                    <p className="text-[11px] text-white/60">Live date countdowns</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAddExamOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-7 px-2.5 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Exam</span>
                  </Button>
                </div>

                {/* Target Exam Readiness Gauge */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-1">
                  <Gauge
                    size={140}
                    value={readinessProb * 10}
                    display={`${readinessPercent}%`}
                    label="Readiness Odds"
                    sublabel="Target Score Probability"
                    colorScheme="purple"
                  />
                  <p className="text-[10px] text-white/60">
                    {readinessPercent >= 75
                      ? "Pacing on track to achieve target score."
                      : "Complete daily Pomodoro blocks to reach optimal readiness."}
                  </p>
                </div>

                {/* Exams List */}
                <div className="space-y-2">
                  {exams.length > 0 ? (
                    exams.map((ex: any) => {
                      const daysLeft = ex.days_left;
                      const isUrgent = daysLeft !== null && daysLeft <= 7;
                      return (
                        <div
                          key={ex.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{ex.title}</p>
                            <p className="text-[10px] text-white/60 font-mono">
                              {ex.subject} · {ex.exam_date} · Target {ex.target_score}%
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`text-[10px] font-bold ${
                                isUrgent
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                  : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              }`}
                            >
                              {daysLeft === 0 ? "Today!" : `${daysLeft}d left`}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteExam(ex.id)}
                              className="h-6 w-6 text-white/40 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-white/50 border border-dashed border-white/10 rounded-xl space-y-1">
                      <p>No upcoming exams scheduled.</p>
                      <p className="text-[10px]">Click "+ Add Exam" to activate countdowns.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: AI STUDY OPTIMIZER */}
            {sidebarTab === "plan" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span>7-Day Adaptive Plan</span>
                    </h3>
                    <p className="text-[11px] text-white/60">Spaced repetition schedule</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGeneratePlan}
                    disabled={isGeneratingPlan}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-7 px-2.5"
                  >
                    {isGeneratingPlan ? "..." : "Regenerate"}
                  </Button>
                </div>

                {studyPlan?.schedule && studyPlan.schedule.length > 0 ? (
                  <div className="space-y-3">
                    {studyPlan.schedule.map((dayItem: any, dIdx: number) => {
                      const dayName = dayItem.day_name || `Day ${dIdx + 1}`;
                      const blocks = dayItem.blocks || [];
                      return (
                        <div key={dIdx} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{dayName}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAdoptDayPlan(dIdx, dayItem)}
                              className="text-[10px] text-purple-300 hover:text-white h-6 px-1.5 gap-1"
                            >
                              <Plus className="h-2.5 w-2.5" />
                              <span>Adopt All</span>
                            </Button>
                          </div>

                          <div className="space-y-1.5">
                            {blocks.map((b: any, bIdx: number) => {
                              const sprintKey = `${dIdx}-${bIdx}`;
                              const isAdopted = adoptedSprints.has(sprintKey);
                              return (
                                <div
                                  key={bIdx}
                                  className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <p className="font-semibold text-white/90 truncate">{b.subject || "Study"}</p>
                                    <p className="text-[10px] text-white/50">
                                      {b.start_time || "14:00"} · {b.duration_minutes || 45}m
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleAdoptSprint(sprintKey, b)}
                                    disabled={isAdopted}
                                    className={`h-6 px-2 text-[10px] ${
                                      isAdopted ? "text-emerald-400" : "text-purple-300 hover:text-white"
                                    }`}
                                  >
                                    {isAdopted ? "Added" : "+ Add"}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-white/50 border border-dashed border-white/10 rounded-xl space-y-2">
                    <Sparkles className="h-6 w-6 mx-auto opacity-40 text-purple-400" />
                    <p>No active AI schedule.</p>
                    <Button
                      size="sm"
                      onClick={handleGeneratePlan}
                      disabled={isGeneratingPlan}
                      className="bg-purple-600 text-white text-xs h-8 px-4"
                    >
                      Synthesize Schedule
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER STAGE: FOCUS POMODORO ARENA */}
        <section className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full max-w-xl flex flex-col items-center justify-center text-center space-y-6">
            {/* Subject selector */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-xl">
              <GraduationCap className="h-4 w-4 text-purple-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent text-xs font-bold text-white border-0 focus:outline-none cursor-pointer tracking-wide"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub} className="bg-zinc-950 text-white">
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode buttons */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md gap-1 shadow-2xl">
              <button
                type="button"
                onClick={() => handleSwitchMode("focus")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timerMode === "focus"
                    ? "bg-purple-600 text-white shadow-lg ring-1 ring-purple-400/50"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Deep Work ({focusLengthMins}m)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("shortBreak")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timerMode === "shortBreak"
                    ? "bg-cyan-600 text-white shadow-lg ring-1 ring-cyan-400/50"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Short Break ({breakLengthMins}m)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("longBreak")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timerMode === "longBreak"
                    ? "bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-400/50"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Long Break ({longBreakLengthMins}m)
              </button>
            </div>

            {/* Circular Timer Ring */}
            <div className="relative flex items-center justify-center my-2">
              <svg className="w-80 h-80 transform -rotate-90 filter drop-shadow-2xl" viewBox="0 0 240 240">
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

              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1.5 text-white">
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-widest font-black bg-white/15 border-white/20 text-white"
                >
                  {timerMode === "focus" ? "Focus Sprint" : "Recovery Window"}
                </Badge>
                <div className="font-mono text-6xl sm:text-7xl font-black tracking-tight drop-shadow-2xl">
                  {formatTime(secondsLeft)}
                </div>
                <div className="text-xs text-white/80 font-semibold tracking-wide">
                  {selectedSubject}
                </div>
                <div className="text-[11px] text-white/50 pt-0.5 font-mono">
                  Sprint {completedSprints + 1} of 4 · {Math.round(timerProgress * 100)}%
                </div>
              </div>
            </div>

            {/* Interactive Control Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={handleTogglePlay}
                className={`h-14 px-8 rounded-full font-bold text-base shadow-2xl gap-2.5 transition-all ${
                  isTimerRunning
                    ? "bg-amber-600 hover:bg-amber-500 text-white ring-4 ring-amber-500/20"
                    : "bg-purple-600 hover:bg-purple-500 text-white ring-4 ring-purple-500/20"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="h-5 w-5" />
                    <span>Pause Sprint</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-current" />
                    <span>Start Sprint</span>
                  </>
                )}
              </Button>

              <Button
                size="icon"
                variant="outline"
                onClick={handleResetTimer}
                className="h-12 w-12 rounded-full border-white/20 bg-black/60 text-white hover:bg-white/20 shadow-xl"
                title="Reset Sprint"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="outline"
                onClick={handleAddFiveMinutes}
                className="h-12 w-12 rounded-full border-white/20 bg-black/60 text-white hover:bg-white/20 shadow-xl text-xs font-bold"
                title="+5 Minutes"
              >
                +5m
              </Button>

              <Button
                size="icon"
                variant="outline"
                onClick={handleTimerCompleted}
                className="h-12 w-12 rounded-full border-white/20 bg-black/60 text-white hover:bg-white/20 shadow-xl"
                title="Skip to Break"
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
                className="h-12 px-5 rounded-full border-white/20 bg-black/60 text-purple-300 hover:bg-white/20 shadow-xl text-xs font-semibold gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Save to Database</span>
              </Button>
            </div>

            {/* Quick Wallpaper Picker Thumbnails Bar */}
            {!zenMode && (
              <div className="w-full pt-2 flex items-center justify-center gap-2 overflow-x-auto py-1">
                {STUDY_WALLPAPERS.slice(0, 7).map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setActiveWallpaper(wp)}
                    className={`relative h-12 w-20 rounded-lg overflow-hidden border transition-all shrink-0 ${
                      activeWallpaper.id === wp.id
                        ? "border-purple-400 ring-2 ring-purple-400/50 scale-105"
                        : "border-white/15 opacity-60 hover:opacity-100"
                    }`}
                    title={wp.name}
                  >
                    <img src={wp.thumb} alt={wp.name} className="h-full w-full object-cover" />
                    {wp.type === "video" && (
                      <span className="absolute top-1 left-1 bg-purple-600/90 rounded-full p-0.5 text-white">
                        <Video className="h-2 w-2" />
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="h-12 px-3 rounded-lg border border-dashed border-white/20 text-white/70 hover:text-white hover:border-white/40 text-[11px] font-semibold flex items-center gap-1 bg-black/40"
                >
                  <span>More</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 4. SETTINGS & WALLPAPER GALLERY DIALOG */}
      <StudySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activeWallpaper={activeWallpaper}
        onSelectWallpaper={setActiveWallpaper}
        focusMinutes={focusLengthMins}
        onFocusMinutesChange={(mins) => {
          setFocusLengthMins(mins);
          if (timerMode === "focus" && !isTimerRunning) setSecondsLeft(mins * 60);
        }}
        breakMinutes={breakLengthMins}
        onBreakMinutesChange={(mins) => {
          setBreakLengthMins(mins);
          if (timerMode === "shortBreak" && !isTimerRunning) setSecondsLeft(mins * 60);
        }}
        longBreakMinutes={longBreakLengthMins}
        onLongBreakMinutesChange={(mins) => {
          setLongBreakLengthMins(mins);
          if (timerMode === "longBreak" && !isTimerRunning) setSecondsLeft(mins * 60);
        }}
        activeSoundscape={activeSoundscape}
        onSoundscapeChange={handleSelectSoundscape}
        soundVolume={soundVolume}
        onVolumeChange={handleVolumeChange}
      />

      {/* 5. ONBOARDING MODAL */}
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

      {/* 6. SAVE SESSION MODAL */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-zinc-950/95 border border-purple-500/30 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Record Completed Study Sprint</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              Sync this focus block to MongoDB study records, habit telemetry, and analytics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-white/80">Subject</Label>
              <select
                value={logSubject}
                onChange={(e) => setLogSubject(e.target.value)}
                className="w-full bg-zinc-900 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/80">Duration (Minutes)</Label>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(Number(e.target.value))}
                  className="bg-zinc-900 border-white/20 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/80">Exam / Quiz Score (%)</Label>
                <Input
                  type="number"
                  placeholder="Optional %"
                  min={0}
                  max={100}
                  value={logExamScore}
                  onChange={(e) => setLogExamScore(e.target.value)}
                  className="bg-zinc-900 border-white/20 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <Label className="text-white/80">Cognitive Focus Depth</Label>
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

            <div className="space-y-1">
              <Label className="text-xs text-white/80">Session Notes</Label>
              <Textarea
                placeholder="What did you accomplish during this focus block?"
                rows={2}
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                className="bg-zinc-900 border-white/20 text-xs text-white"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="review-task-check"
                checked={addReviewTask}
                onCheckedChange={(checked) => setAddReviewTask(Boolean(checked))}
                className="border-white/30 data-[state=checked]:bg-purple-600"
              />
              <label htmlFor="review-task-check" className="text-xs text-white/70 cursor-pointer">
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

      {/* 7. ADD EXAM MODAL */}
      <Dialog open={addExamOpen} onOpenChange={setAddExamOpen}>
        <DialogContent className="sm:max-w-[400px] bg-zinc-950 border border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <Calendar className="h-5 w-5" />
              <span>Register Upcoming Exam Target</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              Set exam dates to calculate live countdowns and stochastic readiness.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-white/80">Exam Title</Label>
              <Input
                placeholder="e.g. Machine Learning Midterm"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="bg-zinc-900 border-white/20 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-white/80">Subject</Label>
              <select
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                className="w-full bg-zinc-900 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-white/80">Exam Date</Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="bg-zinc-900 border-white/20 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-white/80">Target Score (%)</Label>
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={examTargetScore}
                  onChange={(e) => setExamTargetScore(Number(e.target.value))}
                  className="bg-zinc-900 border-white/20 text-xs text-white"
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
              Add Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
