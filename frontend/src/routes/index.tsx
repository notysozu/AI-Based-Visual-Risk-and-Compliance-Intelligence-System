import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import gsap from "gsap";
import {
  GaugeCircle,
  Moon,
  Sun,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  GraduationCap,
  Briefcase,
  Laptop,
  Rocket,
  HeartHandshake,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  ChevronRight,
  Github,
  Linkedin,
  Instagram,
  Compass,
  Sliders,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTwin, type UserRole, money } from "@/lib/twin-store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Twin AI — Model Your Life 5 Years Ahead" },
      {
        name: "description",
        content:
          "Autonomous digital twin intelligence that models your wealth, habits, study momentum, and life decisions 5 years ahead with Monte Carlo simulations.",
      },
    ],
  }),
  component: LandingPage,
});

/** Apple macOS Subtle Hover Card */
function MacCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`macos-card p-6 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

function LandingPage() {
  const { state, setTheme, loadDemo } = useTwin();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Horizon Raycaster Scrubber State (Year 0 to Year 5)
  const [horizonYear, setHorizonYear] = useState(3);
  const [activePath, setActivePath] = useState<"proactive" | "drift">("proactive");

  // Sandbox sliders
  const [simSavings, setSimSavings] = useState(1200);
  const [simSleep, setSimSleep] = useState(7.5);
  const [simStudy, setSimStudy] = useState(12);

  // Dynamic calculations for Horizon Raycaster
  const baseWealth = 15000;
  const isProactive = activePath === "proactive";
  const yearlyRate = isProactive ? 0.09 : 0.02;
  const annualSavings = isProactive ? 14400 : 1800;

  // Compound formula across selected year
  const projectedMedian = Math.round(
    baseWealth * Math.pow(1 + yearlyRate, horizonYear) +
      annualSavings * ((Math.pow(1 + yearlyRate, horizonYear) - 1) / (yearlyRate || 1))
  );
  const p90Bull = Math.round(projectedMedian * (1 + 0.12 * horizonYear));
  const p10Bear = Math.round(projectedMedian * (1 - 0.08 * horizonYear));
  const focusScore = isProactive ? Math.min(99, 82 + horizonYear * 3) : Math.max(45, 75 - horizonYear * 6);
  const deepWorkHours = isProactive ? Math.round(14 * 52 * horizonYear) : Math.round(3 * 52 * horizonYear);

  // Sandbox calculations
  const sim5YearWealth = Math.round(simSavings * 12 * 5 * 1.28 + 25000);
  const simFocusScore = Math.min(100, Math.round((simSleep / 8) * 45 + (simStudy / 15) * 55));

  // GSAP subtle mounting animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".mac-fade-in", {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.8,
        ease: "power2.out",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleLaunchDemo = async (role: UserRole) => {
    setLoadingRole(role);
    try {
      await loadDemo(role, false);
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} demo loaded!`);
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message || "Failed to launch demo");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div ref={heroRef} className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-500/20 font-sans">
      {/* Apple Minimal Floating Header */}
      <header className="sticky top-4 z-50 mx-auto w-[92%] max-w-6xl">
        <div className="macos-window px-4 py-2.5 flex items-center justify-between shadow-sm">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0071E3] text-white shadow-sm">
              <GaugeCircle className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Digital Twin <span className="text-xs font-mono text-muted-foreground ml-1 font-normal">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
              onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")}
            >
              {state.theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </Button>

            <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-medium rounded-full px-3">
              <Link to="/login">Log In</Link>
            </Button>

            <Button size="sm" asChild className="h-8 text-xs font-medium rounded-full px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs">
              <Link to="/signup">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 text-center">
          <h1 className="mac-fade-in text-4xl font-semibold tracking-tight sm:text-6xl md:text-7xl leading-[1.08]">
            Model your life <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent">5 years ahead</span> with AI.
          </h1>

          <p className="mac-fade-in mx-auto mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Autonomous predictive intelligence running 500-iteration Monte Carlo algorithms to stress-test your wealth, learning velocity, and life decisions.
          </p>

          <div className="mac-fade-in mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="h-11 px-7 rounded-full text-sm font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm">
              <Link to="/signup">
                Calibrate Your Twin <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 px-7 rounded-full text-sm font-medium border-border/80 hover:bg-black/5 dark:hover:bg-white/5">
              <Link to="/login">
                Explore Demo Personas
              </Link>
            </Button>
          </div>

          {/* Apple macOS App Window: 5-Year Life Horizon Instrument */}
          <div className="mac-fade-in mt-14 mx-auto max-w-4xl text-left">
            <div className="macos-window overflow-hidden border border-black/10 dark:border-white/12 shadow-xl">
              {/* macOS Window Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="macos-traffic-dot-close" />
                  <div className="macos-traffic-dot-min" />
                  <div className="macos-traffic-dot-max" />
                  <span className="text-xs text-muted-foreground font-mono ml-2">DigitalTwin — HorizonRaycaster.sim</span>
                </div>

                {/* macOS Segmented Control */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setActivePath("proactive")}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                      isProactive
                        ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Proactive Path
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePath("drift")}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                      !isProactive
                        ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Drift Path
                  </button>
                </div>
              </div>

              {/* Scrubber & Content Pane */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Timeline Scrubber */}
                <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-muted-foreground">Projection Horizon</span>
                    <span className="font-semibold text-[#0071E3] dark:text-blue-400">
                      {horizonYear === 0 ? "Year 0 (Today)" : `+${horizonYear} Year${horizonYear > 1 ? "s" : ""} Horizon`}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={5}
                    step={1}
                    value={[horizonYear]}
                    onValueChange={([v]) => setHorizonYear(v)}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-2">
                    <span>Today</span>
                    <span>Year 1</span>
                    <span>Year 2</span>
                    <span>Year 3</span>
                    <span>Year 4</span>
                    <span>Year 5</span>
                  </div>
                </div>

                {/* Metric Readouts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Projected Net Worth (P50)</span>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {money(projectedMedian)}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>P10: {money(p10Bear)}</span>
                      <span>P90: {money(p90Bull)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Cognitive Momentum</span>
                      <Activity className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
                      {focusScore}/100
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {isProactive ? "+18.4% above baseline" : "-22.5% below baseline"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Deep Work Volume</span>
                      <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {deepWorkHours.toLocaleString()} hrs
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {isProactive ? "Mastery trajectory" : "Low retention pace"}
                    </p>
                  </div>
                </div>

                {/* Embedded 3D Visualization */}
                <div className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/20">
                  <img
                    src="/images/hero-3d-dashboard.png"
                    alt="3D Spatial Life Simulation Dashboard"
                    className="w-full h-44 sm:h-56 object-cover object-center opacity-90 hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex items-end p-4">
                    <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      500 Monte Carlo stochastic trajectories processed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Systematic Pillars */}
      <section id="pillars" className="py-16 border-t border-border/40 bg-sidebar/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold text-[#0071E3] tracking-wider uppercase font-mono">System Architecture</span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight">
              Designed for life's high-stakes decisions.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              A unified predictive loop connecting your finances, daily habits, deep work, and learning goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MacCard>
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold">Monte Carlo Wealth Engine</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                500 stochastic runs modeling median, P10 bear, and P90 bull horizons to forecast financial independence.
              </p>
            </MacCard>

            <MacCard>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <GraduationCap className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold">Study & Academic Intel</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Generate full syllabus schedules, multi-day exam prep sprints, and spaced repetition tracking.
              </p>
            </MacCard>

            <MacCard>
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <BrainCircuit className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold">What-If Butterfly Simulator</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Stress-test long-term life adjustments before committing. See compound impact over 5 years.
              </p>
            </MacCard>

            <MacCard>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold">Calibrated Recommendations</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                AI recommendations monitoring sleep debt, deep work volume, and savings velocity with 1-click plan adoption.
              </p>
            </MacCard>

            <MacCard>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold">Live & Offline Sync</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Work uninterrupted with instant browser offline detection and automatic cloud state synchronization.
              </p>
            </MacCard>

            <MacCard>
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold">Local-First Privacy</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Zero data monetization. Encrypted parameters backed by high-speed SQLite and local-first architecture.
              </p>
            </MacCard>
          </div>
        </div>
      </section>

      {/* Pre-Calibrated Persona Archetypes */}
      <section id="personas" className="py-16 border-t border-border/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold text-purple-500 tracking-wider uppercase font-mono">Role Archetypes</span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight">
              Tailored to your current stage.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Select a pre-calibrated twin or build your custom profile in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Student */}
            <MacCard className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    Student
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">Age 18-25</span>
                </div>
                <h3 className="text-base font-semibold">Coursework & Pocket Money</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Exam readiness, syllabus study sprints, focus heatmaps, and pocket money savings velocity.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "student"}
                onClick={() => handleLaunchDemo("student")}
                className="mt-5 w-full rounded-full text-xs font-medium border-border/80 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Launch Student Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </MacCard>

            {/* Professional */}
            <MacCard className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Professional
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">Age 25-55</span>
                </div>
                <h3 className="text-base font-semibold">Salary & Compounding</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Salary allocations, retirement velocity, work-life balance, and continuous skill acquisition.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "professional"}
                onClick={() => handleLaunchDemo("professional")}
                className="mt-5 w-full rounded-full text-xs font-medium border-border/80 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Launch Professional Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </MacCard>

            {/* Freelancer */}
            <MacCard className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    Freelancer
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">Creator</span>
                </div>
                <h3 className="text-base font-semibold">Cashflow & Runway</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Smooth fluctuating invoices, protect emergency runway, and track portfolio compounding.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "freelancer"}
                onClick={() => handleLoadDemoRole("freelancer")}
                className="mt-5 w-full rounded-full text-xs font-medium border-border/80 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Launch Freelancer Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </MacCard>

            {/* Founder */}
            <MacCard className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    Founder
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">Venture</span>
                </div>
                <h3 className="text-base font-semibold">Runway & Milestones</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Venture runway, personal founder draw, sprint targets, and valuation equity outcomes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "entrepreneur"}
                onClick={() => handleLaunchDemo("entrepreneur")}
                className="mt-5 w-full rounded-full text-xs font-medium border-border/80 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Launch Founder Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </MacCard>

            {/* Retiree */}
            <MacCard className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Retiree
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">Longevity</span>
                </div>
                <h3 className="text-base font-semibold">Preservation & Peace</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Nest egg sustainability, drawdown rates, health routines, and lifelong vitality.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "retiree"}
                onClick={() => handleLaunchDemo("retiree")}
                className="mt-5 w-full rounded-full text-xs font-medium border-border/80 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Launch Retiree Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </MacCard>

            {/* Custom Twin */}
            <MacCard className="flex flex-col justify-between border-dashed border-2">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    Custom
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">Personalized</span>
                </div>
                <h3 className="text-base font-semibold">Build Custom Twin</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Answer 5 setup questions to calibrate a twin completely tailored to your life goals.
                </p>
              </div>
              <Button
                size="sm"
                asChild
                className="mt-5 w-full rounded-full text-xs font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white"
              >
                <Link to="/signup">
                  Build Custom Twin <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </MacCard>
          </div>
        </div>
      </section>

      {/* Live Projection Sandbox */}
      <section id="sandbox" className="py-16 border-t border-border/40 bg-sidebar/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-semibold text-emerald-500 tracking-wider uppercase font-mono">Interactive Calibration</span>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight">
                Test habits in real time.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Adjust baseline variables to observe direct 5-year compounding divergence.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-2">
                    <span>Monthly Savings & Investment</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{money(simSavings)}/mo</span>
                  </div>
                  <Slider
                    min={200}
                    max={5000}
                    step={100}
                    value={[simSavings]}
                    onValueChange={([v]) => setSimSavings(v)}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-2">
                    <span>Daily Sleep Duration</span>
                    <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">{simSleep} hrs/night</span>
                  </div>
                  <Slider
                    min={5}
                    max={9.5}
                    step={0.5}
                    value={[simSleep]}
                    onValueChange={([v]) => setSimSleep(v)}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-2">
                    <span>Weekly Deep Work & Study</span>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{simStudy} hrs/week</span>
                  </div>
                  <Slider
                    min={4}
                    max={30}
                    step={1}
                    value={[simStudy]}
                    onValueChange={([v]) => setSimStudy(v)}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="macos-window p-6 border border-border/70 shadow-lg">
                <span className="text-xs text-muted-foreground font-mono">5-Year Output</span>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-card border border-border/60">
                    <span className="text-[11px] text-muted-foreground font-medium">Net Worth</span>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {money(sim5YearWealth)}
                    </div>
                    <p className="text-[10px] text-muted-foreground">+28% market compounding</p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border/60">
                    <span className="text-[11px] text-muted-foreground font-medium">Momentum</span>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {simFocusScore}/100
                    </div>
                    <p className="text-[10px] text-muted-foreground">Cognitive recovery</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border/50">
                  <Button asChild className="w-full h-10 rounded-full text-xs font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white">
                    <Link to="/signup">
                      Save Scenario in Your Twin <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Builders / Engineering Team */}
      <section id="team" className="py-16 border-t border-border/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold text-indigo-500 tracking-wider uppercase font-mono">Engineering</span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight">
              Meet the Builders
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              The engineers and researchers building autonomous life modeling and predictive simulations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sonu Kumar Suman */}
            <MacCard className="flex flex-col items-center text-center">
              <div className="relative mb-4 w-20 h-20 rounded-full overflow-hidden border-2 border-black/10 dark:border-white/10 shadow-xs">
                <img
                  src="/avatars/sonu-kumar_suman.png"
                  alt="Sonu Kumar Suman"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-sm font-semibold">Sonu Kumar Suman</h3>
              <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Lead Full-Stack Developer
              </span>
              <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed font-normal">
                Core system architecture, predictive life engines, and interactive experience.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 pt-3 border-t border-border/50 w-full">
                <a
                  href="https://github.com/notysozu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sonu Kumar Suman GitHub"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sonu Kumar Suman LinkedIn"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0A66C2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sonu Kumar Suman Instagram"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#E4405F] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              </div>
            </MacCard>

            {/* Hasini Pericharla */}
            <MacCard className="flex flex-col items-center text-center">
              <div className="relative mb-4 w-20 h-20 rounded-full overflow-hidden border-2 border-black/10 dark:border-white/10 shadow-xs">
                <img
                  src="/avatars/hasini-pericharla.png"
                  alt="Hasini Pericharla"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-sm font-semibold">Hasini Pericharla</h3>
              <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                AI, ML & Simulation
              </span>
              <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed font-normal">
                Monte Carlo algorithms, probabilistic forecasting, and recommendation modeling.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 pt-3 border-t border-border/50 w-full">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hasini Pericharla GitHub"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hasini Pericharla LinkedIn"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0A66C2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hasini Pericharla Instagram"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#E4405F] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              </div>
            </MacCard>

            {/* Piyush Srivastava */}
            <MacCard className="flex flex-col items-center text-center">
              <div className="relative mb-4 w-20 h-20 rounded-full overflow-hidden border-2 border-black/10 dark:border-white/10 shadow-xs">
                <img
                  src="/avatars/piyush-srivastava.png"
                  alt="Piyush Srivastava"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-sm font-semibold">Piyush Srivastava</h3>
              <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Backend Architecture
              </span>
              <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed font-normal">
                High-throughput endpoints, SQLite engine, study persistence, and math pipelines.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 pt-3 border-t border-border/50 w-full">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Piyush Srivastava GitHub"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Piyush Srivastava LinkedIn"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0A66C2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Piyush Srivastava Instagram"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#E4405F] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              </div>
            </MacCard>

            {/* Krishna Prasad Kurmi */}
            <MacCard className="flex flex-col items-center text-center">
              <div className="relative mb-4 w-20 h-20 rounded-full overflow-hidden border-2 border-black/10 dark:border-white/10 shadow-xs">
                <img
                  src="/avatars/krishna-prasad-kurmi.png"
                  alt="Krishna Prasad Kurmi"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-sm font-semibold">Krishna Prasad Kurmi</h3>
              <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                Frontend Dashboard
              </span>
              <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed font-normal">
                UI components, interactive charts, tactile aesthetics, and planner widgets.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 pt-3 border-t border-border/50 w-full">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Krishna Prasad Kurmi GitHub"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Krishna Prasad Kurmi LinkedIn"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0A66C2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Krishna Prasad Kurmi Instagram"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-[#E4405F] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Instagram className="h-3.5 w-3.5" />
                </a>
              </div>
            </MacCard>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 border-t border-border/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 text-center">
          <div className="macos-window p-8 sm:p-12 border border-border/70 shadow-lg">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Ready to meet your digital future?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
              Create your profile in under 60 seconds. Test scenarios, calibrate habits, and stay years ahead.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="h-11 px-7 rounded-full text-sm font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm">
                <Link to="/signup">
                  Get Started Free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 px-7 rounded-full text-sm font-medium border-border/80 hover:bg-black/5 dark:hover:bg-white/5">
                <Link to="/login">
                  Log In to Existing Twin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 bg-sidebar/20 py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0071E3] text-white">
              <GaugeCircle className="h-3 w-3" />
            </div>
            <span className="font-semibold text-foreground">Digital Twin AI</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/pages/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/pages/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            <a href="https://github.com/notysozu/Digital-Twin-AI" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>

          <div>
            © {new Date().getFullYear()} Digital Twin AI.
          </div>
        </div>
      </footer>
    </div>
  );
}
