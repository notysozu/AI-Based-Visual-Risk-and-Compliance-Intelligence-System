import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Moon, Monitor, Brain, Smile, CheckCircle2, Sparkles, Clock } from "lucide-react";
import { useTwin, today } from "@/lib/twin-store";
import { queryClient, queryKeys } from "@/lib/query-client";
import { postHabitRecord, postStudyRecord, updateUser } from "@/lib/api";
import { toast } from "sonner";

export function DailyCheckinModal() {
  const { state, logHabitActivity, logStudyActivity } = useTwin();
  const [open, setOpen] = useState(false);

  const p = state.profile;
  const todayDate = today();

  const [sleepHours, setSleepHours] = useState<number>(p.sleepHours || 7.5);
  const [screenHours, setScreenHours] = useState<number>(p.screenTime || 3.5);
  const [studyHours, setStudyHours] = useState<number>(1.5);
  const [mood, setMood] = useState<number>(8);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only prompt if user is authenticated and onboarded
    if (!state.authed || !p.id || !p.onboarded) {
      setOpen(false);
      return;
    }

    // Check if today's log is already filled with realistic entries
    const existingTodayLog = state.logs.find((l) => l.date === todayDate);
    const hasTodayEntry = Boolean(
      existingTodayLog &&
      existingTodayLog.sleep > 0 &&
      existingTodayLog.screen > 0
    );

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem(`daily_checkin_dismissed_${todayDate}`);

    if (!hasTodayEntry && !isDismissed) {
      // Small timeout to allow page layout to settle without jank
      const timer = setTimeout(() => {
        setOpen(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [state.authed, p.id, p.onboarded, todayDate, state.logs]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(`daily_checkin_dismissed_${todayDate}`, "true");
    } catch {}
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!p.id) return;
    setIsSubmitting(true);

    try {
      // 1. Update biometric activity logs in Twin state
      logHabitActivity("Sleep", sleepHours);
      if (studyHours > 0) {
        logStudyActivity("Daily Focus Session", studyHours);
      }

      // 2. Persist Sleep to MongoDB
      await postHabitRecord(p.id, {
        habit_name: "Sleep",
        duration_minutes: Math.round(sleepHours * 60),
        impact_score: mood,
      }).catch((e) => console.warn("Failed to persist sleep checkin:", e));

      // 3. Persist Screen Time & Exercise metadata
      await postHabitRecord(p.id, {
        habit_name: "Screen Time",
        duration_minutes: Math.round(screenHours * 60),
        impact_score: Math.max(1, 10 - Math.round(screenHours)),
      }).catch((e) => console.warn("Failed to persist screen checkin:", e));

      // 4. Mark dismissed for the day
      try {
        sessionStorage.setItem(`daily_checkin_dismissed_${todayDate}`, "true");
        localStorage.setItem(`daily_checkin_completed_${todayDate}`, "true");
      } catch {}

      // 5. Invalidate query caches so Analytics, Study & Overview update immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.studyAnalytics(p.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.habitRecords(p.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.studyRecords(p.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analyticsSummary(p.id) });

      toast.success("Daily check-in logged! Analytics & circadian rhythms updated.");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save daily check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sleepPresets = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
  const screenPresets = [1.5, 2.5, 3.5, 4.5, 6.0, 8.0];
  const studyPresets = [0, 1.0, 2.0, 3.0, 4.5, 6.0];

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleDismiss() : setOpen(true))}>
      <DialogContent className="max-w-md p-6 rounded-3xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Daily Telemetry Check-In
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Calibrate today's analytics and circadian recovery curves ({todayDate}).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* 1. Sleep Hours */}
          <div className="rounded-2xl bg-card/60 p-4 border border-border/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Moon className="h-4 w-4 text-indigo-400" />
                <span>Sleep Last Night</span>
              </div>
              <span className="text-sm font-bold font-mono text-indigo-400">
                {sleepHours.toFixed(1)} hrs
              </span>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {sleepPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSleepHours(val)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    sleepHours === val
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {val}h
                </button>
              ))}
            </div>

            <Slider
              value={[sleepHours]}
              onValueChange={([v]) => setSleepHours(v)}
              min={4.0}
              max={12.0}
              step={0.5}
              className="py-1"
            />
          </div>

          {/* 2. Screen Time */}
          <div className="rounded-2xl bg-card/60 p-4 border border-border/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Monitor className="h-4 w-4 text-amber-400" />
                <span>Estimated Screen Time</span>
              </div>
              <span className="text-sm font-bold font-mono text-amber-400">
                {screenHours.toFixed(1)} hrs
              </span>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {screenPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setScreenHours(val)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    screenHours === val
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {val}h
                </button>
              ))}
            </div>

            <Slider
              value={[screenHours]}
              onValueChange={([v]) => setScreenHours(v)}
              min={1.0}
              max={12.0}
              step={0.5}
              className="py-1"
            />
          </div>

          {/* 3. Study / Focus Hours */}
          <div className="rounded-2xl bg-card/60 p-4 border border-border/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Brain className="h-4 w-4 text-purple-400" />
                <span>Deep Work / Study Target</span>
              </div>
              <span className="text-sm font-bold font-mono text-purple-400">
                {studyHours.toFixed(1)} hrs
              </span>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {studyPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStudyHours(val)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    studyHours === val
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {val === 0 ? "None" : `${val}h`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Mood & Energy Rating */}
          <div className="rounded-2xl bg-card/60 p-4 border border-border/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Smile className="h-4 w-4 text-emerald-400" />
                <span>Mood & Readiness</span>
              </div>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {mood} / 10
              </span>
            </div>

            <div className="grid grid-cols-10 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setMood(rating)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all ${
                    mood === rating
                      ? "bg-emerald-500 text-white shadow-md scale-105"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:bg-accent"
          >
            Remind Later
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs font-semibold bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">Saving...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Save & Calibrate
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
