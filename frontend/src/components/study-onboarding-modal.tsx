import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Clock,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { submitStudyOnboarding } from "@/lib/api";

interface StudyOnboardingModalProps {
  open: boolean;
  userId: string | number;
  onCompleted: (profileData: any) => void;
}

const PRESET_SUBJECTS = [
  "Computer Science",
  "Mathematics",
  "Data Science",
  "Economics",
  "Physics",
  "Psychology",
  "Web Engineering",
  "Business & Finance",
];

const TOUR_SLIDES = [
  {
    icon: Clock,
    title: "1. Study Session & Pomodoro",
    tagline: "Distraction-free focus with ambient soundscapes",
    description:
      "Run calibrated Pomodoro intervals (25/5, 50/10, or custom) while listening to built-in Lo-Fi Beats, Rain & Storm, or Alpha Waves. Select aesthetic studio wallpapers to set your focus mood, and save completed sessions directly to your database.",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: BookOpen,
    title: "2. Schedule & Biometric Habits",
    tagline: "Real data synced with your Analytics tab",
    description:
      "Track your true study pace with zero fake mock numbers. See your weekly distribution, circadian peak focus hours, and study duration correlated directly with your sleep and mood analytics.",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: TrendingUp,
    title: "3. Exams & Academic Trends",
    tagline: "Exam countdowns and stochastic readiness",
    description:
      "Register upcoming midterms, finals, and certification exams. Track countdown days and view statistical readiness projections calculated from your historical focus and practice scores.",
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: BrainCircuit,
    title: "4. AI Study Optimizer & Copilot",
    tagline: "Autonomous 7-day spaced repetition schedules",
    description:
      "Generate AI-optimized study schedules tailored to your course load. Adopt study blocks directly into Today's Planner with one click, or ask the Visual Risk Copilot chat to log your study sessions and schedule revision tasks.",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
];

export function StudyOnboardingModal({ open, userId, onCompleted }: StudyOnboardingModalProps) {
  // Step flow: 'welcome' -> 'tour' -> 'survey'
  const [step, setStep] = useState<"welcome" | "tour" | "survey">("welcome");
  const [tourIndex, setTourIndex] = useState(0);

  // Questionnaire state
  const [subjects, setSubjects] = useState<string[]>(["Computer Science", "Mathematics"]);
  const [customSubject, setCustomSubject] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(15);
  const [targetScore, setTargetScore] = useState(85);
  const [preferredTime, setPreferredTime] = useState("Morning (08:00 - 11:30)");
  
  // Optional exam
  const [hasExam, setHasExam] = useState(false);
  const [examSubject, setExamSubject] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTargetScore, setExamTargetScore] = useState(88);

  const [saving, setSaving] = useState(false);

  const handleAddSubject = (sub: string) => {
    const trimmed = sub.trim();
    if (!trimmed) return;
    if (!subjects.includes(trimmed)) {
      setSubjects((prev) => [...prev, trimmed]);
    }
    setCustomSubject("");
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjects((prev) => prev.filter((s) => s !== sub));
  };

  const handleFinishOnboarding = async () => {
    if (subjects.length === 0) {
      toast.error("Please add at least one subject or course");
      return;
    }

    setSaving(true);
    try {
      const examsList: any[] = [];
      if (hasExam && examTitle.trim()) {
        examsList.push({
          subject: examSubject || subjects[0] || "General",
          title: examTitle.trim(),
          exam_date: examDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          target_score: examTargetScore,
          notes: "Initial target exam registered during onboarding",
        });
      }

      const payload = {
        subjects,
        weekly_target: weeklyHours,
        target_score: targetScore,
        preferred_time: preferredTime,
        exams: examsList,
      };

      await submitStudyOnboarding(userId, payload);
      toast.success("Academic curriculum saved! Welcome to Study Intelligence.");
      onCompleted(payload);
    } catch (e: any) {
      toast.error(e.message || "Failed to save study onboarding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden border border-border shadow-2xl bg-card">
        {/* STEP 1: WELCOME */}
        {step === "welcome" && (
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shadow-inner">
              <GraduationCap className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Welcome to Study & Academic Intelligence
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your academic cockpit for deep Pomodoro focus sessions, ambient study soundscapes, exam readiness forecasting, and synced biometrics.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border text-left space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" /> Clean Zero-Baseline Guarantee
              </p>
              <p>
                We do not inject fake historical hours. Your account begins with a clean baseline populated exclusively with your chosen subjects.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("survey")}
                className="w-full sm:w-auto gap-2 text-sm order-2 sm:order-1"
              >
                <span>Skip Tour (Go to Setup)</span>
              </Button>
              <Button
                onClick={() => setStep("tour")}
                className="w-full sm:w-auto gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-600/20 order-1 sm:order-2"
              >
                <Compass className="h-4 w-4" />
                <span>Take 60-Second Tour</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: FEATURE TOUR (4 SLIDES) */}
        {step === "tour" && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Feature Walkthrough ({tourIndex + 1} of {TOUR_SLIDES.length})
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStep("survey")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip to Setup
              </Button>
            </div>

            {(() => {
              const currentSlide = TOUR_SLIDES[tourIndex];
              const Icon = currentSlide.icon;
              return (
                <div className="space-y-4 py-2">
                  <div className={`h-14 w-14 rounded-xl border flex items-center justify-center ${currentSlide.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{currentSlide.title}</h3>
                    <p className="text-sm font-medium text-purple-400 mt-0.5">{currentSlide.tagline}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentSlide.description}
                  </p>
                </div>
              );
            })()}

            {/* Slide indicators & navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-1.5">
                {TOUR_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTourIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === tourIndex ? "w-6 bg-purple-500" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {tourIndex > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTourIndex((prev) => prev - 1)}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </Button>
                )}

                {tourIndex < TOUR_SLIDES.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setTourIndex((prev) => prev + 1)}
                    className="gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setStep("survey")}
                    className="gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                  >
                    <span>Proceed to Setup</span>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: MANDATORY SETUP QUESTIONNAIRE */}
        {step === "survey" && (
          <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                <GraduationCap className="h-4 w-4" />
                <span>Mandatory Academic Setup</span>
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Calibrate Your Academic Curriculum
              </h2>
              <p className="text-xs text-muted-foreground">
                Provide your real courses and goals so the AI can calibrate your study schedules, circadian energy blocks, and exam forecasts.
              </p>
            </div>

            <div className="space-y-5">
              {/* Question 1: Subjects */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center justify-between">
                  <span>1. Enrolled Subjects / Courses</span>
                  <span className="text-xs text-muted-foreground font-normal">{subjects.length} selected</span>
                </Label>
                
                {/* Active subjects tags */}
                <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-lg bg-muted/30 border border-border">
                  {subjects.map((sub) => (
                    <Badge
                      key={sub}
                      variant="secondary"
                      className="gap-1.5 py-1 px-2.5 bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25"
                    >
                      <span>{sub}</span>
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-400"
                        onClick={() => handleRemoveSubject(sub)}
                      />
                    </Badge>
                  ))}
                  {subjects.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">Select presets below or type custom subjects</span>
                  )}
                </div>

                {/* Preset subject buttons */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {PRESET_SUBJECTS.map((ps) => {
                    const selected = subjects.includes(ps);
                    return (
                      <button
                        key={ps}
                        type="button"
                        onClick={() => (selected ? handleRemoveSubject(ps) : handleAddSubject(ps))}
                        className={`text-xs px-2 py-0.5 rounded-md border transition-all ${
                          selected
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-300 font-medium"
                            : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {selected ? "✓ " : "+ "}{ps}
                      </button>
                    );
                  })}
                </div>

                {/* Custom subject input */}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add custom course or topic (e.g. Organic Chemistry)..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubject(customSubject);
                      }
                    }}
                    className="h-9 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddSubject(customSubject)}
                    disabled={!customSubject.trim()}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                </div>
              </div>

              {/* Question 2: Weekly Target Hours */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">2. Weekly Study Hours Target</Label>
                  <span className="text-sm font-bold text-purple-400">{weeklyHours} hrs / week</span>
                </div>
                <Slider
                  min={5}
                  max={40}
                  step={1}
                  value={[weeklyHours]}
                  onValueChange={(v) => setWeeklyHours(v[0])}
                  className="py-1"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>5h (Casual)</span>
                  <span>15h (Recommended)</span>
                  <span>40h (Intensive)</span>
                </div>
              </div>

              {/* Question 3: Target Grade / Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">3. Target Exam / Coursework Mastery</Label>
                  <span className="text-sm font-bold text-cyan-400">{targetScore}% Target</span>
                </div>
                <Slider
                  min={60}
                  max={100}
                  step={1}
                  value={[targetScore]}
                  onValueChange={(v) => setTargetScore(v[0])}
                  className="py-1"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>70% (Competency)</span>
                  <span>85% (High Honors)</span>
                  <span>95%+ (Mastery)</span>
                </div>
              </div>

              {/* Question 4: Preferred Focus Window */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">4. Peak Energy Focus Window</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Morning (08:00 - 11:30)",
                    "Afternoon (13:00 - 16:30)",
                    "Evening (18:00 - 21:30)",
                    "Late Night (22:00 - 01:00)",
                  ].map((timeOption) => (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => setPreferredTime(timeOption)}
                      className={`text-xs p-2.5 rounded-lg border text-left font-medium transition-all ${
                        preferredTime === timeOption
                          ? "border-purple-500 bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/50"
                          : "border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      {timeOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 5: Optional Upcoming Exam */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <span>5. Upcoming Exam or Milestone</span>
                    <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setHasExam(!hasExam)}
                    className="text-xs text-purple-400 h-7"
                  >
                    {hasExam ? "Remove Exam" : "+ Add Upcoming Exam"}
                  </Button>
                </div>

                {hasExam && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Subject</Label>
                        <select
                          value={examSubject}
                          onChange={(e) => setExamSubject(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          {subjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Exam Title</Label>
                        <Input
                          placeholder="e.g. Midterm Examination"
                          value={examTitle}
                          onChange={(e) => setExamTitle(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Exam Date</Label>
                        <Input
                          type="date"
                          value={examDate}
                          onChange={(e) => setExamDate(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Target Score ({examTargetScore}%)</Label>
                        <Slider
                          min={60}
                          max={100}
                          step={1}
                          value={[examTargetScore]}
                          onValueChange={(v) => setExamTargetScore(v[0])}
                          className="pt-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-3">
              <Button
                disabled={saving || subjects.length === 0}
                onClick={handleFinishOnboarding}
                className="w-full sm:w-auto gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-600/20"
              >
                {saving ? (
                  <span>Saving to Database...</span>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Complete Setup & Enter Cockpit</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
