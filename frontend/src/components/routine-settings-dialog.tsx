import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lock,
  Plus,
  Trash2,
  Sparkles,
  Heart,
  Clock,
  Activity,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useTwin } from "@/lib/twin-store";
import type { FixedCommitment, HabitGoal, RoutineConfig } from "@/lib/types";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function calcDurationMinutes(start: string, end: string): number {
  try {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 60;
    const diff = eh * 60 + em - (sh * 60 + sm);
    return diff > 0 ? diff : diff + 1440;
  } catch {
    return 60;
  }
}

export function RoutineSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, updateProfile } = useTwin();
  const profile = state.profile;

  // Active routine configuration draft
  const [fixedCommitments, setFixedCommitments] = useState<FixedCommitment[]>(
    []
  );
  const [hobbies, setHobbies] = useState<HabitGoal[]>([]);
  const [customContext, setCustomContext] = useState("");

  // New fixed commitment form state
  const [newFcName, setNewFcName] = useState("");
  const [newFcCategory, setNewFcCategory] = useState("College");
  const [newFcStart, setNewFcStart] = useState("09:00");
  const [newFcEnd, setNewFcEnd] = useState("15:30");
  const [newFcDays, setNewFcDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ]);

  // New habit form state
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState("Hobby");
  const [newHabitMinutes, setNewHabitMinutes] = useState(30);
  const [newHabitTime, setNewHabitTime] = useState<
    "morning" | "afternoon" | "evening" | "any"
  >("evening");

  // Sync state when dialog opens or profile updates
  useEffect(() => {
    if (open) {
      const cfg = profile.routineConfig;
      if (cfg) {
        setFixedCommitments(cfg.fixed_commitments || []);
        setHobbies(cfg.hobbies || []);
        setCustomContext(cfg.custom_context || "");
      } else {
        // Sensible initial defaults based on persona
        if (profile.role === "student") {
          setFixedCommitments([
            {
              id: "fc-college-demo",
              name: "College Lectures & Labs",
              category: "College",
              start: "09:00",
              end: "15:30",
              minutes: 390,
              days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            },
          ]);
          setHobbies([
            {
              id: "hb-guitar-demo",
              name: "Guitar Practice",
              category: "Hobby",
              minutes: 30,
              preferred_time: "evening",
            },
            {
              id: "hb-gym-demo",
              name: "Gym Workout",
              category: "Health",
              minutes: 45,
              preferred_time: "evening",
            },
          ]);
          setCustomContext(
            "College from 9:00 AM to 3:30 PM with a 40-minute bus commute. Prefer deep study after 5:00 PM and winding down before 10:30 PM."
          );
        } else {
          setFixedCommitments([
            {
              id: "fc-work-demo",
              name: "Core Office Standup & Sprints",
              category: "Work",
              start: "09:30",
              end: "17:30",
              minutes: 480,
              days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            },
          ]);
          setHobbies([
            {
              id: "hb-reading-demo",
              name: "Book Reading",
              category: "Growth",
              minutes: 30,
              preferred_time: "evening",
            },
          ]);
          setCustomContext(
            "Work hours 9:30 AM to 5:30 PM. Prefer cognitive deep work in early morning or quiet evening."
          );
        }
      }
    }
  }, [open, profile.routineConfig, profile.role]);

  const toggleDay = (day: string) => {
    setNewFcDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddCommitment = () => {
    if (!newFcName.trim()) {
      toast.error("Please provide a commitment name");
      return;
    }
    const duration = calcDurationMinutes(newFcStart, newFcEnd);
    const newItem: FixedCommitment = {
      id: `fc-${Date.now()}`,
      name: newFcName.trim(),
      category: newFcCategory,
      start: newFcStart,
      end: newFcEnd,
      minutes: duration,
      days: newFcDays.length > 0 ? newFcDays : ["Mon", "Tue", "Wed", "Thu", "Fri"],
    };
    setFixedCommitments((prev) => [...prev, newItem]);
    setNewFcName("");
    toast.success(`Added "${newItem.name}" as fixed anchor`);
  };

  const handleRemoveCommitment = (id: string) => {
    setFixedCommitments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) {
      toast.error("Please provide a habit or hobby name");
      return;
    }
    const newHobby: HabitGoal = {
      id: `hb-${Date.now()}`,
      name: newHabitName.trim(),
      category: newHabitCategory,
      minutes: newHabitMinutes,
      preferred_time: newHabitTime,
    };
    setHobbies((prev) => [...prev, newHobby]);
    setNewHabitName("");
    toast.success(`Added "${newHobby.name}" to habit targets`);
  };

  const handleRemoveHabit = (id: string) => {
    setHobbies((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSave = async () => {
    const updatedConfig: RoutineConfig = {
      fixed_commitments: fixedCommitments,
      hobbies,
      custom_context: customContext.trim(),
    };

    try {
      await updateProfile({ routineConfig: updatedConfig });
      toast.success("Routine & habit settings saved successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save routine settings");
    }
  };

  // Telemetry metrics
  const sleepTarget = profile.sleepHours || 8.0;
  const recentSleep =
    state.logs.length > 0
      ? state.logs.slice(-7).reduce((acc, l) => acc + l.sleep, 0) /
        Math.min(7, state.logs.length)
      : sleepTarget;
  const sleepDebt = Math.max(0, sleepTarget - recentSleep);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Routine, Habit & Anchor Settings
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure your fixed college/work timings, target hobbies, and
                routine context. The AI Twin locks anchors and auto-plans open
                circadian slots around them.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="fixed" className="w-full mt-2">
          <TabsList className="grid grid-cols-3 w-full h-9">
            <TabsTrigger value="fixed" className="text-xs font-semibold">
              <Lock className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Fixed Anchors ({fixedCommitments.length})
            </TabsTrigger>
            <TabsTrigger value="habits" className="text-xs font-semibold">
              <Heart className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
              Hobbies & Habits ({hobbies.length})
            </TabsTrigger>
            <TabsTrigger value="context" className="text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
              Custom Info & Telemetry
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: FIXED COMMITMENTS */}
          <TabsContent value="fixed" className="space-y-4 pt-3">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Non-Negotiable Locked Anchors:</strong> Fixed commitments
                (e.g., college classes from 09:00 to 15:30) are preserved on
                your task board. The AI Auto-Planner will never schedule
                overlapping tasks during these hours.
              </p>
            </div>

            {/* Existing List */}
            <div className="space-y-2">
              <Label className="label-xs">Active Fixed Commitments</Label>
              {fixedCommitments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No fixed commitments configured yet. Add your college or work
                  hours below.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {fixedCommitments.map((fc) => (
                    <div
                      key={fc.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {fc.name}
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {fc.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {fc.start} {fc.end ? `- ${fc.end}` : ""} (
                            {Math.round((fc.minutes / 60) * 10) / 10}h)
                          </span>
                          <span>•</span>
                          <span>
                            {fc.days && fc.days.length === 7
                              ? "Daily"
                              : fc.days?.join(", ") || "Mon-Fri"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveCommitment(fc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Fixed Commitment */}
            <div className="rounded-xl border border-border p-3.5 bg-card/60 space-y-3">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-primary" />
                Add Fixed Anchor
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Commitment Name</Label>
                  <Input
                    placeholder="e.g. College Lectures & Labs"
                    value={newFcName}
                    onChange={(e) => setNewFcName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Category</Label>
                  <Select
                    value={newFcCategory}
                    onValueChange={setNewFcCategory}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="College">College</SelectItem>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Classes">Classes</SelectItem>
                      <SelectItem value="Commute">Commute</SelectItem>
                      <SelectItem value="Fixed">Fixed Routine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Start Time</Label>
                  <Input
                    type="time"
                    value={newFcStart}
                    onChange={(e) => setNewFcStart(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">End Time</Label>
                  <Input
                    type="time"
                    value={newFcEnd}
                    onChange={(e) => setNewFcEnd(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Day selection */}
              <div className="space-y-1.5">
                <Label className="text-[11px]">Active Days</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const active = newFcDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground font-mono">
                  Duration: {calcDurationMinutes(newFcStart, newFcEnd)}m (
                  {Math.round(
                    (calcDurationMinutes(newFcStart, newFcEnd) / 60) * 10
                  ) / 10}
                  h)
                </span>
                <Button
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  onClick={handleAddCommitment}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Anchor
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: HOBBIES & HABITS */}
          <TabsContent value="habits" className="space-y-4 pt-3">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Target Habits & Hobbies:</strong> Hobbies you want to
                maintain regularly (e.g., guitar practice, gym workouts, reading).
                The AI auto-planner will schedule these into your preferred open
                circadian slots without conflicting with your fixed anchors.
              </p>
            </div>

            {/* Existing Hobbies */}
            <div className="space-y-2">
              <Label className="label-xs">Configured Target Habits</Label>
              {hobbies.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No habits configured yet. Add your hobbies and wellness goals
                  below.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {hobbies.map((hb) => (
                    <div
                      key={hb.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {hb.name}
                          </span>
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            {hb.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {hb.minutes} min
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            Preferred: {hb.preferred_time}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveHabit(hb.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Habit Form */}
            <div className="rounded-xl border border-border p-3.5 bg-card/60 space-y-3">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-primary" />
                Add Target Habit / Hobby
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Habit / Hobby Name</Label>
                  <Input
                    placeholder="e.g. Guitar Practice, Gym, Reading"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Category</Label>
                  <Select
                    value={newHabitCategory}
                    onValueChange={setNewHabitCategory}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hobby">Hobby</SelectItem>
                      <SelectItem value="Health">Health & Gym</SelectItem>
                      <SelectItem value="Growth">Personal Growth</SelectItem>
                      <SelectItem value="Wellness">Wellness</SelectItem>
                      <SelectItem value="Creative">Creative Arts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Duration (Minutes)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={180}
                    value={newHabitMinutes}
                    onChange={(e) =>
                      setNewHabitMinutes(Number(e.target.value) || 30)
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Preferred Time Window</Label>
                  <Select
                    value={newHabitTime}
                    onValueChange={(val: any) => setNewHabitTime(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (Early)</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening (After Work/College)</SelectItem>
                      <SelectItem value="any">Flexible (Any Free Window)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  className="h-8 text-xs font-semibold"
                  onClick={handleAddHabit}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Habit Goal
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: CUSTOM INFO & TELEMETRY */}
          <TabsContent value="context" className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="label-xs">
                Custom Routine Information & Personal Instructions
              </Label>
              <Textarea
                rows={4}
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="e.g. I attend college Mon-Fri 09:00 to 15:30 with 40-minute bus commutes each way. I like studying after 5 PM and playing guitar in the evening. Keep cognitive blocks shorter when I have high fatigue."
                className="text-xs resize-none leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                The AI Auto-Planner ingests these instructions directly into its
                circadian reasoning model on every plan synthesis.
              </p>
            </div>

            {/* Live Analytics Ingestion Diagnostic Card */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold text-foreground">
                  AI Telemetry & Analytics Diagnostic
                </h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                The AI Auto-Planner correlates your historical telemetry before
                generating tasks:
              </p>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg border border-border/50 bg-background/60 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Sleep Debt
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                    {sleepDebt.toFixed(1)}h
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {sleepDebt >= 1.0 ? "Pacing adjusted" : "Optimal rest"}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/50 bg-background/60 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Screen Time
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                    {profile.screenTime || 3.5}h/day
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Wind-down preserved
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/50 bg-background/60 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Study Pace
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                    {profile.studyHours || 15.0}h/wk
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    Cognitive sprint target
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-3 border-t border-border/40 mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
            onClick={handleSave}
          >
            Save Routine Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
