import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  ListChecks,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize,
  Minimize,
  GraduationCap,
  Flame,
  HelpCircle,
  Move,
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
        content: "Full-screen Apple macOS style study cockpit with 4K animated video wallpapers, floating capsule timer, live Mac clock, movable & resizable workspace window, and tasks planner.",
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

  // Video element reference
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Apple Mac Style Clock & Timezone
  const [macTime, setMacTime] = useState("");
  const [macDate, setMacDate] = useState("");
  const [tzCode, setTzCode] = useState("");

  // Fullscreen state & Auto-hide Navbar on Fullscreen Hover
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);

  // Movable & Corner-Resizable Workspace Window
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("tasks");

  // Window position (movable via top header bar)
  const [windowPos, setWindowPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_window_pos");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            return {
              x: Math.max(8, Math.min(window.innerWidth - 320, parsed.x)),
              y: Math.max(52, Math.min(window.innerHeight - 150, parsed.y)),
            };
          }
        } catch {}
      }
    }
    return { x: 24, y: 68 }; // initial workspace sits comfortably below the navbar
  });

  // Window size (resizable small or huge from bottom-right corner)
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_window_size");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.width === "number" && typeof parsed.height === "number") {
            return {
              width: Math.max(290, Math.min(840, parsed.width)),
              height: Math.max(340, Math.min(window.innerHeight - 80, parsed.height)),
            };
          }
        } catch {}
      }
    }
    return { width: 400, height: 580 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const [isCornerResizing, setIsCornerResizing] = useState(false);
  const cornerResizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

  // Settings & Dialogs
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Restore wallpaper choice from localStorage (including custom wallpapers)
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperItem>(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("study_active_wallpaper_id");
      if (savedId) {
        const found = STUDY_WALLPAPERS.find((w) => w.id === savedId);
        if (found) return found;
        try {
          const custom = localStorage.getItem("study_custom_wallpapers");
          if (custom) {
            const list = JSON.parse(custom);
            const foundCustom = list.find((w: any) => w.id === savedId);
            if (foundCustom) return foundCustom;
          }
        } catch {}
      }
    }
    return STUDY_WALLPAPERS[0];
  });

  // Restore soundscape & volume choice from localStorage
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>(() => {
    if (typeof window !== "undefined") {
      const savedSound = localStorage.getItem("study_active_soundscape") as SoundscapeType;
      if (savedSound && SOUNDSCAPES.some((s) => s.id === savedSound)) {
        return savedSound;
      }
    }
    return "none";
  });

  const [soundVolume, setSoundVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const savedVol = localStorage.getItem("study_sound_volume");
      if (savedVol) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    }
    return 0.5;
  });

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [focusLengthMins, setFocusLengthMins] = useState(25);
  const [breakLengthMins, setBreakLengthMins] = useState(5);
  const [longBreakLengthMins, setLongBreakLengthMins] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSprints, setCompletedSprints] = useState(0);

  // Selected Subject (Displayed in Right Corner with the Timer)
  const [selectedSubject, setSelectedSubject] = useState("Computer Science");

  // Telemetry, AI Plan, and Analytics
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

  // 1. Live Apple Mac Style Clock (e.g. "Mon Sep 14  1:23:45 PM  IST")
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      setMacDate(dateStr);
      setMacTime(timeStr);

      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const parts = tz.split("/");
        const shortTz = parts[parts.length - 1].replace(/_/g, " ");
        setTzCode(shortTz);
      } catch {
        setTzCode("UTC");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Video Playback & Autoplay handling
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.load();
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    }
  }, [activeWallpaper.url]);

  // Cleanup on unmount (sound stops, wallpaper stops)
  useEffect(() => {
    return () => {
      soundscapeEngine.stop();
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, []);

  // Exit study mode handler
  const handleExitStudyMode = () => {
    soundscapeEngine.stop();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.load();
    }
    navigate({ to: "/dashboard" });
  };

  // 3. Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  // 4. Window Drag-to-Move Logic (from the top element space)
  const handleDragHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, textarea, [role='button']")) {
      return;
    }
    e.preventDefault();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: windowPos.x,
      posY: windowPos.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      const maxX = Math.max(8, window.innerWidth - windowSize.width - 8);
      const maxY = Math.max(52, window.innerHeight - 120);
      const nextX = Math.max(8, Math.min(maxX, dragStartRef.current.posX + deltaX));
      const nextY = Math.max(52, Math.min(maxY, dragStartRef.current.posY + deltaY));
      setWindowPos({ x: nextX, y: nextY });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setWindowPos((p) => {
        try {
          localStorage.setItem("study_window_pos", JSON.stringify(p));
        } catch {}
        return p;
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, windowSize.width]);

  // 5. Window Corner-Resize Logic (small and huge from right bottom corner)
  const handleCornerResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cornerResizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: windowSize.width,
      startH: windowSize.height,
    };
    setIsCornerResizing(true);
  };

  useEffect(() => {
    if (!isCornerResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - cornerResizeStartRef.current.mouseX;
      const deltaY = e.clientY - cornerResizeStartRef.current.mouseY;
      const maxW = Math.min(840, window.innerWidth - windowPos.x - 16);
      const maxH = Math.min(920, window.innerHeight - windowPos.y - 16);
      const nextW = Math.max(290, Math.min(maxW, cornerResizeStartRef.current.startW + deltaX));
      const nextH = Math.max(340, Math.min(maxH, cornerResizeStartRef.current.startH + deltaY));
      setWindowSize({ width: nextW, height: nextH });
    };

    const onMouseUp = () => {
      setIsCornerResizing(false);
      setWindowSize((s) => {
        try {
          localStorage.setItem("study_window_size", JSON.stringify(s));
        } catch {}
        return s;
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isCornerResizing, windowPos.x, windowPos.y]);

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

      // Auto switch to break
      if (nextCount % 4 === 0) {
        setTimerMode("longBreak");
        setSecondsLeft(longBreakLengthMins * 60);
      } else {
        setTimerMode("shortBreak");
        setSecondsLeft(breakLengthMins * 60);
      }
    } else {
      toast.info("Break is over! Ready for the next sprint.");
      setTimerMode("focus");
      setSecondsLeft(focusLengthMins * 60);
    }
  }, [timerMode, completedSprints, selectedSubject, focusLengthMins, longBreakLengthMins, breakLengthMins]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsLeft, handleTimerCompleted]);

  // Timer play/pause
  const handleTogglePlay = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      if (activeSoundscape !== "none") {
        soundscapeEngine.play(activeSoundscape, soundVolume);
      }
    } else {
      setIsTimerRunning(false);
      soundscapeEngine.stop();
    }
  };

  // Timer Reset
  const handleResetTimer = () => {
    setIsTimerRunning(false);
    soundscapeEngine.stop();
    if (timerMode === "focus") setSecondsLeft(focusLengthMins * 60);
    else if (timerMode === "shortBreak") setSecondsLeft(breakLengthMins * 60);
    else setSecondsLeft(longBreakLengthMins * 60);
  };

  // Quick +5 minutes
  const handleAddFiveMinutes = () => {
    setSecondsLeft((prev) => prev + 5 * 60);
    toast.success("Added 5 minutes to timer");
  };

  // Switch timer mode
  const handleSwitchMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setIsTimerRunning(false);
    soundscapeEngine.stop();
    setTimerMode(mode);
    if (mode === "focus") setSecondsLeft(focusLengthMins * 60);
    else if (mode === "shortBreak") setSecondsLeft(breakLengthMins * 60);
    else setSecondsLeft(longBreakLengthMins * 60);
  };

  // Soundscape selector
  const handleSelectSoundscape = (sound: SoundscapeType) => {
    setActiveSoundscape(sound);
    try {
      localStorage.setItem("study_active_soundscape", sound);
    } catch {}
    if (sound === "none") {
      soundscapeEngine.stop();
    } else if (isTimerRunning) {
      soundscapeEngine.play(sound, soundVolume);
    }
  };

  // Volume change
  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    soundscapeEngine.setVolume(vol);
    try {
      localStorage.setItem("study_sound_volume", String(vol));
    } catch {}
  };

  // Wallpaper change
  const handleSelectWallpaper = (wp: WallpaperItem) => {
    setActiveWallpaper(wp);
    try {
      localStorage.setItem("study_active_wallpaper_id", wp.id);
    } catch {}
  };

  // Save study session to backend
  const handleSaveSession = async () => {
    if (!p.id) return;
    try {
      const res = await logStudySession(p.id, {
        subject: logSubject || selectedSubject,
        duration_minutes: logMinutes,
        focus_score: logFocusScore,
        exam_score: logExamScore ? Number(logExamScore) : undefined,
        notes: logNotes.trim() || undefined,
        create_review_task: addReviewTask,
      });

      if (res && res.status === "ok") {
        toast.success(`Saved ${logMinutes}m focus session for ${logSubject || selectedSubject}!`);
        addLog(`Completed ${logMinutes}m focus session on ${logSubject || selectedSubject}`);

        if (addReviewTask) {
          addTask({
            title: `Review: ${logSubject || selectedSubject}`,
            start: "19:00",
            minutes: 15,
            category: "study",
            done: false,
            date: today(),
          });
        }

        setSaveModalOpen(false);
        setLogNotes("");
        setLogExamScore("");
        refreshAllData();
      }
    } catch (err) {
      toast.error("Failed to save study session");
    }
  };

  // Add exam target
  const handleAddExamSubmit = async () => {
    if (!p.id || !examTitle.trim() || !examDate) {
      toast.error("Please fill in Exam title and date");
      return;
    }
    try {
      const res = await addStudyExam(p.id, {
        title: examTitle.trim(),
        subject: examSubject || selectedSubject,
        date: examDate,
        target_score: examTargetScore,
      });
      if (res && res.status === "ok") {
        toast.success(`Target for "${examTitle}" registered!`);
        setAddExamOpen(false);
        setExamTitle("");
        setExamDate("");
        refreshAllData();
      }
    } catch {
      toast.error("Failed to register exam");
    }
  };

  // Delete exam target
  const handleDeleteExam = async (examId: string) => {
    if (!p.id) return;
    try {
      await deleteStudyExam(p.id, examId);
      toast.success("Exam target deleted");
      refreshAllData();
    } catch {
      toast.error("Failed to delete exam");
    }
  };

  // Generate AI study plan
  const handleGeneratePlan = async () => {
    if (!p.id) return;
    setIsGeneratingPlan(true);
    try {
      const plan = await generateStudyPlan(p.id);
      if (plan) {
        setStudyPlan(plan);
        toast.success("AI synthesized personalized study schedule!");
      }
    } catch {
      toast.error("Failed to generate AI study plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Adopt AI sprint into planner
  const handleAdoptSprint = (sprintKey: string, block: any) => {
    addTask({
      title: `${block.subject || "Study"}: ${block.activity || "Focus Session"}`,
      start: block.start_time || "10:00",
      minutes: block.duration_minutes || 45,
      category: "study",
      done: false,
      date: today(),
    });
    setAdoptedSprints((prev) => new Set(prev).add(sprintKey));
    toast.success(`Adopted "${block.subject}" into Today's Planner!`);
  };

  // Adopt entire day into planner
  const handleAdoptDay = (dayIndex: number, dayPlan: any) => {
    if (!dayPlan.blocks) return;
    dayPlan.blocks.forEach((b: any) => {
      addTask({
        title: `${b.subject || "Study"}: ${b.activity || "Focus Session"}`,
        start: b.start_time || "10:00",
        minutes: b.duration_minutes || 45,
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

  // Available subjects
  const availableSubjects = useMemo(() => {
    const list: string[] = [];
    if (userCurriculum?.subjects) list.push(...userCurriculum.subjects);
    if (analytics?.subjects) {
      analytics.subjects.forEach((s: any) => {
        if (!list.includes(s.subject)) list.push(s.subject);
      });
    }
    return list.length > 0 ? list : ["Computer Science", "Mathematics", "Physics", "Literature"];
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

  if (!ok) return null;

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none bg-black text-white flex flex-col font-sans">
      {/* 1. 100% ANIMATED 4K VIDEO WALLPAPER (Autoplay, Loop, Muted, 0ms Local / Verified CDN) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          key={activeWallpaper.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transform scale-110 transition-transform duration-700 pointer-events-none"
        >
          <source
            src={activeWallpaper.url}
            type={activeWallpaper.url.endsWith(".webm") ? "video/webm" : "video/mp4"}
          />
        </video>
        {/* Transparent dark glass vignette for pristine readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/60 pointer-events-none" />
      </div>

      {/* FULLSCREEN HOVER TRIGGER ZONE: Revealed when mouse moves to top of screen in fullscreen */}
      {isFullScreen && (
        <div
          className="fixed top-0 left-0 right-0 h-3 z-50 pointer-events-auto"
          onMouseEnter={() => setMenuHovered(true)}
        />
      )}

      {/* 2. APPLE MAC STYLE TOP MENU BAR */}
      <header
        onMouseEnter={() => setMenuHovered(true)}
        onMouseLeave={() => setMenuHovered(false)}
        className={`fixed top-0 left-0 right-0 z-40 h-10 px-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-2xl shadow-sm transition-transform duration-300 ease-in-out ${
          isFullScreen && !menuHovered ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Left: macOS Actions */}
        <div className="flex items-center gap-2 text-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExitStudyMode}
            className="h-6 px-2 text-[11px] text-white/80 hover:text-white hover:bg-white/10 rounded-md font-medium gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Exit Study Mode</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSettingsOpen(true)}
            className="h-6 px-2 text-[11px] text-white/80 hover:text-white hover:bg-white/10 rounded-md font-medium gap-1"
          >
            <Settings className="h-3 w-3 text-purple-300" />
            <span>Preferences</span>
          </Button>

          {(!userCurriculum || !userCurriculum.onboarded) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOnboardingOpen(true)}
              className="h-6 px-2 text-[11px] text-white/80 hover:text-white hover:bg-white/10 rounded-md font-medium hidden md:flex items-center gap-1"
            >
              <HelpCircle className="h-3 w-3 text-cyan-300" />
              <span>Curriculum</span>
            </Button>
          )}
        </div>

        {/* Center: Apple Mac Style Live Time & Date */}
        <div className="flex items-center gap-2 text-center select-none font-medium tracking-wide">
          <span className="text-[12px] text-white/85 hidden md:inline">{macDate}</span>
          <span className="text-[12px] font-semibold text-white tracking-wider font-mono">
            {macTime || "12:00:00 PM"}
          </span>
          <span className="text-[10px] text-white/60 bg-white/10 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
            {tzCode}
          </span>
        </div>

        {/* Right: Soundscape Pill + Fullscreen Toggle + Workspace Show/Hide Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick Soundscape control pill */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 px-2 py-0.5 rounded-full text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectSoundscape(activeSoundscape === "none" ? "lofi" : "none")}
              className="text-cyan-300 hover:text-cyan-200 transition-colors"
              title="Toggle Audio"
            >
              {activeSoundscape === "none" ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </button>
            <select
              value={activeSoundscape}
              onChange={(e) => handleSelectSoundscape(e.target.value as SoundscapeType)}
              className="bg-transparent border-0 text-[10px] text-white/90 focus:outline-none cursor-pointer pr-1"
            >
              {SOUNDSCAPES.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-zinc-950 text-white">
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Real Fullscreen toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullScreen}
            className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/10 rounded-md"
            title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullScreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </Button>

          {/* Workspace Show / Hide Toggle in Menu Bar */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`h-6 px-2.5 text-[11px] rounded-md font-semibold gap-1.5 transition-colors ${
              sidebarOpen
                ? "bg-white/15 text-white"
                : "bg-emerald-600/80 hover:bg-emerald-500 text-white shadow-sm"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{sidebarOpen ? "Hide Workspace" : "Show Workspace"}</span>
          </Button>
        </div>
      </header>

      {/* 3. CENTER AMBIENT ARENA (Completely Unobstructed 4K Wallpaper - Subject Name Removed from Middle) */}
      <section className="flex-1 pointer-events-none" />

      {/* 4. MOVABLE & CORNER-RESIZABLE TRANSPARENT WORKSPACE WINDOW (macOS Window Style) */}
      {sidebarOpen && (
        <aside
          style={{
            left: `${windowPos.x}px`,
            top: `${windowPos.y}px`,
            width: `${windowSize.width}px`,
            height: `${windowSize.height}px`,
          }}
          className="fixed z-30 rounded-2xl border border-white/15 bg-black/30 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden select-none transition-shadow"
        >
          {/* Top Header Bar / Space to Move Window + Green Dot Only */}
          <div
            onMouseDown={handleDragHeaderMouseDown}
            className="cursor-grab active:cursor-grabbing flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.04] select-none group"
            title="Click and drag to move workspace anywhere on screen"
          >
            {/* ONLY GREEN DOT (Red and Yellow removed as requested) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors shadow-sm flex items-center justify-center group"
                title="Hide Workspace (restore from top bar)"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-black font-bold">−</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
                <Move className="h-3 w-3 text-white/40 group-hover:text-white/80 transition-colors" />
                <span>Workspace</span>
              </div>
            </div>

            {/* Window Dimensions & Move Hint */}
            <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
              <span className="hidden sm:inline text-white/30 text-[9px]">Drag to move</span>
              <span>
                {Math.round(windowSize.width)}×{Math.round(windowSize.height)}
              </span>
            </div>
          </div>

          {/* Apple Segmented Control Pills for Tabs */}
          <div className="p-2 border-b border-white/10 bg-black/20">
            <div className="grid grid-cols-4 p-0.5 rounded-xl bg-black/50 border border-white/10 gap-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSidebarTab("tasks")}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  sidebarTab === "tasks"
                    ? "bg-white/20 text-white shadow-sm border border-white/15"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <ListChecks className="h-3 w-3" />
                <span>Planner</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("habits")}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  sidebarTab === "habits"
                    ? "bg-white/20 text-white shadow-sm border border-white/15"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <BookOpen className="h-3 w-3" />
                <span>Habits</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("exams")}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  sidebarTab === "exams"
                    ? "bg-white/20 text-white shadow-sm border border-white/15"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Calendar className="h-3 w-3" />
                <span>Exams</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("plan")}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  sidebarTab === "plan"
                    ? "bg-white/20 text-white shadow-sm border border-white/15"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>AI Plan</span>
              </button>
            </div>
          </div>

          {/* Sidebar Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar">
            {/* TAB 1: TASKS & PLANNER */}
            {sidebarTab === "tasks" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 text-purple-400" />
                      <span>Today's Study & Focus Tasks</span>
                    </h3>
                    <p className="text-[10px] text-white/60">
                      {tasksDoneCount} of {todaysTasks.length} completed
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
                    Planner
                  </Badge>
                </div>

                {/* Inline quick task creator */}
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New focus sprint or study target..."
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddQuickTask()}
                      className="h-8 bg-zinc-900/80 border-white/15 text-xs text-white"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddQuickTask}
                      className="h-8 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>Target duration: {quickTaskMinutes}m</span>
                    <div className="flex gap-1">
                      {[25, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setQuickTaskMinutes(mins)}
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            quickTaskMinutes === mins
                              ? "bg-purple-600 text-white font-bold"
                              : "bg-white/10 text-white/70 hover:bg-white/20"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-1.5">
                  {todaysTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-white/50 border border-dashed border-white/10 rounded-xl space-y-1">
                      <CheckCircle2 className="h-6 w-6 mx-auto opacity-30 text-purple-400" />
                      <p>No study tasks scheduled for today.</p>
                      <p className="text-[10px] text-white/40">Add one above or adopt from AI Plan.</p>
                    </div>
                  ) : (
                    todaysTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          t.done
                            ? "bg-emerald-950/20 border-emerald-500/20 opacity-60"
                            : "bg-black/40 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleTask(t.id)}
                            className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                              t.done
                                ? "bg-emerald-500 border-emerald-400 text-black"
                                : "border-white/30 hover:border-white"
                            }`}
                          >
                            {t.done && <Check className="h-3 w-3 stroke-[3]" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-medium truncate ${
                                t.done ? "line-through text-white/50" : "text-white"
                              }`}
                            >
                              {t.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-white/50">
                              <span>{t.start}</span>
                              <span>·</span>
                              <span>{t.minutes}m</span>
                              <span className="uppercase text-purple-400 font-bold text-[9px]">{t.category}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTask(t.id)}
                          className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-white/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: HABITS & ANALYTICS */}
            {sidebarTab === "habits" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Habits & Telemetry Analytics</span>
                    </h3>
                    <p className="text-[10px] text-white/60">Live synced to MongoDB analytics</p>
                  </div>
                </div>

                {/* Key Stats Pill Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Streak</span>
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {analytics?.streak_days ?? 0} <span className="text-xs font-normal text-white/60">days</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Total Hours</span>
                      <Clock className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {totalStudyHours.toFixed(1)} <span className="text-xs font-normal text-white/60">hrs</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Weekly Avg</span>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xl font-black text-white mt-1">
                      {avgWeeklyHours.toFixed(1)} <span className="text-xs font-normal text-white/60">hrs/wk</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Readiness</span>
                      <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                    <div className="text-xl font-black text-cyan-300 mt-1">
                      {readinessPercent}%
                    </div>
                  </div>
                </div>

                {/* Weekly Study Distribution Chart */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <h4 className="text-[11px] font-semibold text-white/80">Weekly Study Hours</h4>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="day" stroke="#ffffff50" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#ffffff50" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="hours" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Readiness Gauge */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Curriculum Readiness</h4>
                    <p className="text-[10px] text-white/60">Stochastic exam readiness index</p>
                    <p className="text-[10px] text-purple-300 font-mono mt-1">
                      Risk state: {readinessPercent >= 75 ? "Low Risk" : readinessPercent >= 50 ? "Moderate" : "High Alert"}
                    </p>
                  </div>
                  <div className="w-16 h-16 flex items-center justify-center">
                    <Gauge value={readinessPercent} max={100} size={64} label="" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EXAMS & TRENDS */}
            {sidebarTab === "exams" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Upcoming Exams & Milestones</span>
                    </h3>
                    <p className="text-[10px] text-white/60">Countdowns and readiness tracking</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAddExamOpen(true)}
                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Exam
                  </Button>
                </div>

                {/* Exams List */}
                <div className="space-y-2">
                  {exams.length === 0 ? (
                    <div className="p-6 text-center text-xs text-white/50 border border-dashed border-white/10 rounded-xl space-y-2">
                      <Calendar className="h-6 w-6 mx-auto opacity-30 text-emerald-400" />
                      <p>No exams registered yet.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddExamOpen(true)}
                        className="h-7 text-xs border-white/20 text-white"
                      >
                        Register Target Exam
                      </Button>
                    </div>
                  ) : (
                    exams.map((ex) => {
                      const daysLeft = Math.ceil(
                        (new Date(ex.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div
                          key={ex.id}
                          className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate">{ex.title}</h4>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                daysLeft <= 3
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : daysLeft <= 14
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {daysLeft < 0 ? "Past" : daysLeft === 0 ? "Today!" : `${daysLeft}d left`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-white/60">
                            <span>{ex.subject}</span>
                            <span>Target: {ex.target_score}%</span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/50">
                            <span>Date: {ex.date}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteExam(ex.id)}
                              className="h-5 w-5 text-white/40 hover:text-red-400 hover:bg-white/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: AI STUDY OPTIMIZER */}
            {sidebarTab === "plan" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      <span>AI Study Optimizer</span>
                    </h3>
                    <p className="text-[10px] text-white/60">Personalized schedule synthesis</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGeneratePlan}
                    disabled={isGeneratingPlan}
                    className="h-7 px-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold"
                  >
                    {isGeneratingPlan ? "Synthesizing..." : "Re-generate"}
                  </Button>
                </div>

                {studyPlan && studyPlan.schedule ? (
                  <div className="space-y-3">
                    {studyPlan.schedule.map((day: any, dIdx: number) => {
                      return (
                        <div key={dIdx} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between pb-1 border-b border-white/5">
                            <span className="text-xs font-bold text-purple-300">
                              {day.day_name || `Day ${dIdx + 1}`}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAdoptDay(dIdx, day)}
                              className="h-5 px-1.5 text-[10px] text-purple-300 hover:text-white"
                            >
                              + Adopt All
                            </Button>
                          </div>

                          <div className="space-y-1.5">
                            {(day.blocks || []).map((b: any, bIdx: number) => {
                              const sprintKey = `${dIdx}-${bIdx}`;
                              const isAdopted = adoptedSprints.has(sprintKey);
                              return (
                                <div
                                  key={bIdx}
                                  className="p-2 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between text-xs"
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
                                      isAdopted ? "text-emerald-400 font-bold" : "text-purple-300 hover:text-white"
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
                    <p>No active AI study schedule.</p>
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

          {/* DRAGGABLE CORNER RESIZE HANDLE (Right Bottom Corner - Small to Huge) */}
          <div
            onMouseDown={handleCornerResizeMouseDown}
            className="absolute bottom-1 right-1 w-5 h-5 cursor-nwse-resize z-50 flex items-end justify-end p-0.5 text-white/40 hover:text-purple-400 transition-colors group"
            title="Drag corner to resize small or huge"
          >
            <svg
              className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="21" y1="9" x2="9" y2="21" />
              <line x1="21" y1="15" x2="15" y2="21" />
            </svg>
          </div>
        </aside>
      )}

      {/* 5. FLOATING APPLE-STYLED DYNAMIC ISLAND TIMER CAPSULE (Bottom Right Corner with Subject Name) */}
      <div className="fixed bottom-5 right-5 z-40 w-84 sm:w-92 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/15 shadow-2xl p-4 space-y-3 text-white transition-all select-none">
        {/* Top Row: Mode Pills & Subject Selector (Subject prominently in Right Corner with Timer) */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          {/* Mode Pills */}
          <div className="flex items-center p-0.5 rounded-xl bg-black/50 border border-white/10 gap-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => handleSwitchMode("focus")}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                timerMode === "focus"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Focus ({focusLengthMins}m)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("shortBreak")}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                timerMode === "shortBreak"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Break ({breakLengthMins}m)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("longBreak")}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                timerMode === "longBreak"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Long ({longBreakLengthMins}m)
            </button>
          </div>

          {/* Subject Dropdown with Graduation Cap in Timer Widget */}
          <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-400/30 px-2 py-1 rounded-xl text-[11px] text-purple-200">
            <GraduationCap className="h-3.5 w-3.5 text-purple-300 shrink-0" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent border-0 text-[11px] font-bold text-white focus:outline-none cursor-pointer max-w-[110px] truncate"
            >
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub} className="bg-zinc-950 text-white">
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Middle Row: Digital Countdown Display & Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {formatTime(secondsLeft)}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 block">
                Sprint {completedSprints + 1} / 4
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                {Math.round(timerProgress * 100)}% Complete
              </span>
            </div>
          </div>

          {/* Active Subject & Sprint Subtitle */}
          <div className="flex items-center justify-between text-xs pt-0.5 text-white/70">
            <span className="font-semibold text-purple-300 flex items-center gap-1 truncate max-w-[180px]">
              <BookOpen className="h-3 w-3 text-purple-400 shrink-0" />
              <span className="truncate">{selectedSubject}</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono">
              {timerMode === "focus" ? "Deep Focus" : "Recovery"}
            </span>
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              style={{ width: `${timerProgress * 100}%` }}
              className={`h-full rounded-full transition-all duration-1000 ${
                timerMode === "focus"
                  ? "bg-purple-500"
                  : timerMode === "shortBreak"
                  ? "bg-cyan-400"
                  : "bg-emerald-400"
              }`}
            />
          </div>
        </div>

        {/* Bottom Row: Play Controls + "Save" Button */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {/* Play/Pause */}
          <Button
            size="sm"
            onClick={handleTogglePlay}
            className={`h-9 px-4 rounded-full font-bold text-xs gap-1.5 transition-all ${
              isTimerRunning
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-md"
            }`}
          >
            {isTimerRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start</span>
              </>
            )}
          </Button>

          {/* Reset */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleResetTimer}
            className="h-8 w-8 rounded-full border-white/20 bg-black/40 text-white hover:bg-white/20 text-xs"
            title="Reset Timer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          {/* +5m */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddFiveMinutes}
            className="h-8 w-8 rounded-full border-white/20 bg-black/40 text-white hover:bg-white/20 text-[10px] font-bold"
            title="+5 Minutes"
          >
            +5m
          </Button>

          {/* Skip */}
          <Button
            size="icon"
            variant="outline"
            onClick={handleTimerCompleted}
            className="h-8 w-8 rounded-full border-white/20 bg-black/40 text-white hover:bg-white/20 text-xs"
            title="Skip to next mode"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>

          {/* "Save" Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLogSubject(selectedSubject);
              setLogMinutes(Math.max(5, Math.round((totalModeSeconds - secondsLeft) / 60) || 25));
              setSaveModalOpen(true);
            }}
            className="h-8 px-3 rounded-full border-white/20 bg-black/40 text-purple-300 hover:bg-white/20 text-xs font-semibold gap-1"
          >
            <Check className="h-3 w-3" />
            <span>Save</span>
          </Button>
        </div>
      </div>

      {/* 6. SETTINGS & VIDEO WALLPAPERS DIALOG */}
      <StudySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activeWallpaper={activeWallpaper}
        onSelectWallpaper={handleSelectWallpaper}
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

      {/* 7. ONBOARDING TOUR MODAL */}
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

      {/* 8. SAVE FOCUS SESSION MODAL */}
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
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9. REGISTER EXAM MODAL */}
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
