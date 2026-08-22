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
  Flame,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTwin, type UserRole, money } from "@/lib/twin-store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Twin AI — Spatial Life Modeling & Monte Carlo Forecasting" },
      {
        name: "description",
        content:
          "Autonomous digital twin intelligence that models your wealth, habits, study momentum, and life decisions 5 years ahead with Monte Carlo simulations.",
      },
      { property: "og:title", content: "Digital Twin AI — Spatial Life Modeling" },
      {
        property: "og:description",
        content:
          "Autonomous digital twin intelligence that models your wealth, habits, study momentum, and life decisions 5 years ahead.",
      },
    ],
  }),
  component: LandingPage,
});

/** Interactive 3D Spatial Tilt Card following cursor physics */
function TiltCard({
  children,
  className = "",
  maxTilt = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg)");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.2,
    });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transformStyle: "preserve-3d",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-3xl"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle 260px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.35), transparent 80%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

function LandingPage() {
  const { state, setTheme, loadDemo } = useTwin();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Interactive Live Simulator Sandbox state on Landing Page
  const [simSavings, setSimSavings] = useState(1200);
  const [simSleep, setSimSleep] = useState(7.5);
  const [simStudy, setSimStudy] = useState(12);

  // Computed 5-year interactive projection
  const sim5YearWealth = Math.round(simSavings * 12 * 5 * 1.28 + 25000);
  const simFocusScore = Math.min(100, Math.round((simSleep / 8) * 45 + (simStudy / 15) * 55));

  // GSAP Staggered Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".gsap-hero-item", {
        opacity: 0,
        y: 28,
        stagger: 0.1,
        duration: 0.9,
        ease: "power3.out",
      });
      gsap.from(".gsap-card-stagger", {
        opacity: 0,
        y: 35,
        stagger: 0.08,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.2,
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
    <div ref={heroRef} className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20 overflow-x-hidden">
      {/* Floating Spatial Antigravity Header */}
      <header className="sticky top-4 z-50 mx-auto w-[94%] max-w-7xl">
        <div className="antigravity-glass rounded-2xl px-5 py-3 flex items-center justify-between border border-border/60 shadow-[var(--clay-shadow-sm)]">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
              <GaugeCircle className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Digital Twin <span className="text-indigo-500 font-mono text-xs px-1.5 py-0.5 rounded-md bg-indigo-500/10">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Toggle theme"
              onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")}
            >
              {state.theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </Button>

            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex rounded-xl font-semibold">
              <Link to="/login">Log In</Link>
            </Button>

            <Button size="sm" asChild className="rounded-xl shadow-[var(--clay-shadow-sm)] font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/signup">
                Get Started Free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Spatial Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Levitation Floating Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[650px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-emerald-500/15 blur-3xl pointer-events-none animate-glow-pulse" />
        <div className="absolute -top-12 -left-12 h-72 w-72 rounded-full bg-purple-500/10 blur-2xl pointer-events-none animate-float-slow" />
        <div className="absolute top-1/2 -right-12 h-80 w-80 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none animate-float-delayed" />

        <div className="mx-auto max-w-7xl px-4 sm:px-8 text-center relative z-10">
          <h1 className="gsap-hero-item mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-[1.1]">
            Model Your Life <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 bg-clip-text text-transparent">5 Years Ahead</span> with AI.
          </h1>

          <p className="gsap-hero-item mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Digital Twin AI runs 500-iteration Monte Carlo simulations, optimizes daily study sprints, predicts financial independence velocity, and stress-tests life choices before you make them.
          </p>

          <div className="gsap-hero-item mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="h-12 px-8 rounded-2xl font-bold shadow-[var(--clay-shadow)] text-base hover:scale-105 transition-transform">
              <Link to="/signup">
                Launch Your Twin Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 rounded-2xl font-bold shadow-[var(--clay-shadow-sm)] text-base hover:scale-105 transition-transform">
              <Link to="/login">
                Explore Demo Twins
              </Link>
            </Button>
          </div>

          {/* Spatial 3D Weightless Preview Card */}
          <div className="gsap-hero-item mt-16 mx-auto max-w-5xl spatial-container">
            <TiltCard className="antigravity-glass rounded-3xl p-6 sm:p-8 text-left border border-border/80 shadow-[var(--clay-shadow-lg)] animate-float-slow">
              <div className="flex flex-wrap items-center justify-between border-b border-border/60 pb-4 mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-display font-bold text-base sm:text-lg">Alex Rivera — Student Persona Simulation</span>
                  <span className="clay-badge-emerald px-2.5 py-0.5 rounded-full text-[11px] font-bold">Live Calibrated</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">500 Monte Carlo Iterations</span>
                  <span>•</span>
                  <span className="font-mono">99.4% Statistical Confidence</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="clay-card p-5 rounded-2xl spatial-card">
                  <div className="flex items-center justify-between">
                    <span className="label-xs">Focus & Momentum</span>
                    <Activity className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="mt-2 text-3xl font-display font-bold text-purple-600 dark:text-purple-400 tabular-nums">94.2%</div>
                  <p className="mt-1 text-xs text-muted-foreground">+6.8% above baseline target</p>
                </div>

                <div className="clay-card p-5 rounded-2xl spatial-card">
                  <div className="flex items-center justify-between">
                    <span className="label-xs">5-Year Projected Net Worth</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">$94,500</div>
                  <p className="mt-1 text-xs text-muted-foreground">P90 Bull Market: $132,000</p>
                </div>

                <div className="clay-card p-5 rounded-2xl spatial-card">
                  <div className="flex items-center justify-between">
                    <span className="label-xs">Academic Retention</span>
                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 text-3xl font-display font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">88.5%</div>
                  <p className="mt-1 text-xs text-muted-foreground">Pomodoro study sprint efficiency</p>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Core Intelligence Pillars Section */}
      <section id="features" ref={featuresRef} className="py-20 border-t border-border/50 bg-sidebar/20 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="label-xs text-indigo-500 font-bold tracking-widest">Built for Holistic Growth</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-5xl tracking-tight">
              A Complete Intelligence Operating System
            </h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              Every decision you make compounds. Digital Twin AI connects your finances, daily habits, deep work, and learning goals into a unified predictive feedback loop.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TiltCard className="antigravity-glass p-6 rounded-3xl spatial-card">
              <div className="clay-icon-indigo w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">Monte Carlo Wealth Forecaster</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Run 500 stochastic market runs modeling median, P10 bear, and P90 bull horizons. Track the exact age you hit financial freedom.
              </p>
            </TiltCard>

            <TiltCard className="antigravity-glass p-6 rounded-3xl spatial-card">
              <div className="clay-icon-purple w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">Study & Academic Intelligence</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Tailored for students and continuous learners. Generate full syllabus schedules, schedule multi-day sprints, and retain knowledge effortlessly.
              </p>
            </TiltCard>

            <TiltCard className="antigravity-glass p-6 rounded-3xl spatial-card">
              <div className="clay-icon-rose w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">What-If Butterfly Simulator</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Test the long-term impact of life adjustments. What if you save $300 more per month? What if you sleep 1 extra hour? See results across 5 years.
              </p>
            </TiltCard>

            <TiltCard className="antigravity-glass p-6 rounded-3xl spatial-card">
              <div className="clay-icon-amber w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">Smart Recommendation Engine</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Calibrated AI recommendations that monitor your sleep debt, study volume, and savings rates with instant 1-click plan adoption.
              </p>
            </TiltCard>

            <TiltCard className="antigravity-glass p-6 rounded-3xl spatial-card">
              <div className="clay-icon-emerald w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">Real-Time Live & Offline Sync</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Work uninterrupted with automatic browser offline detection and instant state recovery. Never lose a plan or tracked habit.
              </p>
            </TiltCard>

            <TiltCard className="antigravity-glass p-6 rounded-3xl spatial-card">
              <div className="clay-icon-cyan w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">Privacy-First Architecture</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Your life data is private and secure. Fully customizable parameters with lightweight, high-performance SQLite backing.
              </p>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Persona Showcase Section */}
      <section id="personas" className="py-20 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="label-xs text-purple-500 font-bold tracking-widest">Tailored to Every Life Stage</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-5xl tracking-tight">
              Pre-Calibrated Role Archetypes
            </h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              Whether you are balancing exams, growing salary equity, managing freelance invoices, scaling a startup, or enjoying retirement.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Student */}
            <TiltCard className="panel p-6 rounded-3xl flex flex-col justify-between hover:border-purple-500/40 transition-colors spatial-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="clay-badge-purple px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> Student
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Age 18-25</span>
                </div>
                <h3 className="font-display text-xl font-bold">Coursework & Pocket Money</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Track exam readiness, syllabus study sprints, focus heatmaps, and pocket money savings velocity.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "student"}
                onClick={() => handleLaunchDemo("student")}
                className="mt-6 w-full rounded-xl font-semibold shadow-[var(--clay-shadow-sm)] hover:bg-purple-500/10"
              >
                Launch Student Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </TiltCard>

            {/* Working Professional */}
            <TiltCard className="panel p-6 rounded-3xl flex flex-col justify-between hover:border-indigo-500/40 transition-colors spatial-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="clay-badge-indigo px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Professional
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Age 25-55</span>
                </div>
                <h3 className="font-display text-xl font-bold">Salary & Wealth Compounding</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Optimize salary allocations, retirement velocity, work-life balance, and continuous skill acquisition.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "professional"}
                onClick={() => handleLaunchDemo("professional")}
                className="mt-6 w-full rounded-xl font-semibold shadow-[var(--clay-shadow-sm)] hover:bg-indigo-500/10"
              >
                Launch Professional Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </TiltCard>

            {/* Freelancer */}
            <TiltCard className="panel p-6 rounded-3xl flex flex-col justify-between hover:border-cyan-500/40 transition-colors spatial-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="clay-badge-cyan px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5" /> Freelancer
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Creator</span>
                </div>
                <h3 className="font-display text-xl font-bold">Cashflow & Runway Buffer</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Smooth out fluctuating monthly invoices, protect emergency runway, and track portfolio compounding.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "freelancer"}
                onClick={() => handleLaunchDemo("freelancer")}
                className="mt-6 w-full rounded-xl font-semibold shadow-[var(--clay-shadow-sm)] hover:bg-cyan-500/10"
              >
                Launch Freelancer Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </TiltCard>

            {/* Founder */}
            <TiltCard className="panel p-6 rounded-3xl flex flex-col justify-between hover:border-rose-500/40 transition-colors spatial-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="clay-badge-rose px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Rocket className="h-3.5 w-3.5" /> Founder
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Venture</span>
                </div>
                <h3 className="font-display text-xl font-bold">Startup Runway & Milestones</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Model venture runway, personal founder draw, sprint targets, and valuation equity outcomes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "entrepreneur"}
                onClick={() => handleLaunchDemo("entrepreneur")}
                className="mt-6 w-full rounded-xl font-semibold shadow-[var(--clay-shadow-sm)] hover:bg-rose-500/10"
              >
                Launch Founder Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </TiltCard>

            {/* Retiree */}
            <TiltCard className="panel p-6 rounded-3xl flex flex-col justify-between hover:border-emerald-500/40 transition-colors spatial-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="clay-badge-emerald px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <HeartHandshake className="h-3.5 w-3.5" /> Retiree
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Longevity</span>
                </div>
                <h3 className="font-display text-xl font-bold">Preservation & Peace of Mind</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Model nest egg sustainability, drawdown rates, health routines, and lifelong vitality.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole === "retiree"}
                onClick={() => handleLaunchDemo("retiree")}
                className="mt-6 w-full rounded-xl font-semibold shadow-[var(--clay-shadow-sm)] hover:bg-emerald-500/10"
              >
                Launch Retiree Demo <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </TiltCard>

            {/* Custom Twin */}
            <TiltCard className="panel p-6 rounded-3xl flex flex-col justify-between border-dashed border-2 hover:border-primary/50 transition-colors spatial-card">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="clay-badge-indigo px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Custom
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Personalized</span>
                </div>
                <h3 className="font-display text-xl font-bold">Build Your Custom Twin</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Answer 5 simple setup questions to calibrate a twin completely tailored to your personal goals.
                </p>
              </div>
              <Button
                size="sm"
                asChild
                className="mt-6 w-full rounded-xl font-semibold shadow-[var(--clay-shadow-sm)]"
              >
                <Link to="/signup">
                  Build Custom Twin <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Interactive 3D Simulator Sandbox Section */}
      <section id="simulation" className="py-20 border-t border-border/50 bg-sidebar/20 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="label-xs text-emerald-500 font-bold tracking-widest">Test The Engine Live</span>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl tracking-tight">
                Try the Interactive Life Projection Sandbox
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Adjust the sliders to experience how minor weekly habits create staggering compound divergence over a 5-year horizon.
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span>Monthly Savings & Investment</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{money(simSavings)}/mo</span>
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
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span>Daily Sleep Quality</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{simSleep} hrs/night</span>
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
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span>Weekly Focused Study / Deep Work</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{simStudy} hrs/week</span>
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

            <div className="spatial-container">
              <TiltCard className="antigravity-glass p-8 rounded-3xl shadow-[var(--clay-shadow-lg)] border border-border">
                <span className="label-xs text-muted-foreground">Simulated 5-Year Trajectory</span>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="clay-card p-5 rounded-2xl">
                    <span className="text-xs text-muted-foreground font-medium">5-Year Net Worth</span>
                    <div className="mt-2 text-3xl font-display font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {money(sim5YearWealth)}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">+28% market compounding</p>
                  </div>

                  <div className="clay-card p-5 rounded-2xl">
                    <span className="text-xs text-muted-foreground font-medium">Momentum Index</span>
                    <div className="mt-2 text-3xl font-display font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {simFocusScore}/100
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">High cognitive recovery</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border/60">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Real-time Monte Carlo forecast with calibrated baseline distributions</span>
                  </div>
                  <Button asChild className="w-full h-11 rounded-xl font-bold shadow-[var(--clay-shadow-sm)]">
                    <Link to="/signup">
                      Save This Scenario in Your Twin <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section id="team" className="py-20 border-t border-border/50 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="label-xs text-indigo-500 font-bold tracking-widest">Engineering & Product</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-5xl tracking-tight">
              Meet the Team
            </h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              The engineers and architects building autonomous life modeling, Monte Carlo simulation engines, and intelligent dashboards.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sonu Kumar Suman */}
            <TiltCard className="antigravity-glass p-6 rounded-3xl flex flex-col items-center text-center hover:border-indigo-500/40 transition-all shadow-[var(--clay-shadow)] group spatial-card">
              {/* Picture Frame */}
              <div className="relative mb-5 w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-emerald-500/20 border-2 border-indigo-500/30 flex items-center justify-center shadow-[var(--clay-shadow-sm)] group-hover:border-indigo-500/60 transition-colors">
                <img
                  src="/avatars/sonu-kumar_suman.png"
                  alt="Sonu Kumar Suman"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              <h3 className="font-display text-lg font-bold">Sonu Kumar Suman</h3>
              <div className="clay-badge-indigo mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold">
                Lead Full-Stack Developer
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Core system architecture, predictive life engines, and interactive full-stack experience.
              </p>

              {/* Social Buttons */}
              <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-border/60 w-full">
                <a
                  href="https://github.com/notysozu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sonu Kumar Suman GitHub"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-indigo-500 transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sonu Kumar Suman LinkedIn"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-blue-500 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sonu Kumar Suman Instagram"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-rose-500 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </TiltCard>

            {/* Hasini Pericharla */}
            <TiltCard className="antigravity-glass p-6 rounded-3xl flex flex-col items-center text-center hover:border-purple-500/40 transition-all shadow-[var(--clay-shadow)] group spatial-card">
              {/* Picture Frame */}
              <div className="relative mb-5 w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-500/20 via-rose-500/20 to-amber-500/20 border-2 border-purple-500/30 flex items-center justify-center shadow-[var(--clay-shadow-sm)] group-hover:border-purple-500/60 transition-colors">
                <img
                  src="/avatars/hasini-pericharla.png"
                  alt="Hasini Pericharla"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              <h3 className="font-display text-lg font-bold">Hasini Pericharla</h3>
              <div className="clay-badge-purple mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold">
                AI, ML & Simulation
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Monte Carlo stochastic algorithms, probabilistic life forecasting, and recommendation modeling.
              </p>

              {/* Social Buttons */}
              <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-border/60 w-full">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hasini Pericharla GitHub"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-purple-500 transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hasini Pericharla LinkedIn"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-blue-500 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hasini Pericharla Instagram"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-rose-500 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </TiltCard>

            {/* Piyush Srivastava */}
            <TiltCard className="antigravity-glass p-6 rounded-3xl flex flex-col items-center text-center hover:border-emerald-500/40 transition-all shadow-[var(--clay-shadow)] group spatial-card">
              {/* Picture Frame */}
              <div className="relative mb-5 w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border-2 border-emerald-500/30 flex items-center justify-center shadow-[var(--clay-shadow-sm)] group-hover:border-emerald-500/60 transition-colors">
                <img
                  src="/avatars/piyush-srivastava.png"
                  alt="Piyush Srivastava"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              <h3 className="font-display text-lg font-bold">Piyush Srivastava</h3>
              <div className="clay-badge-emerald mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold">
                Backend Architecture
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                FastAPI high-throughput endpoints, SQLite engine, study persistence, and financial math pipelines.
              </p>

              {/* Social Buttons */}
              <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-border/60 w-full">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Piyush Srivastava GitHub"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-emerald-500 transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Piyush Srivastava LinkedIn"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-blue-500 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Piyush Srivastava Instagram"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-rose-500 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </TiltCard>

            {/* Krishna Prasad Kurmi */}
            <TiltCard className="antigravity-glass p-6 rounded-3xl flex flex-col items-center text-center hover:border-cyan-500/40 transition-all shadow-[var(--clay-shadow)] group spatial-card">
              {/* Picture Frame */}
              <div className="relative mb-5 w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border-2 border-cyan-500/30 flex items-center justify-center shadow-[var(--clay-shadow-sm)] group-hover:border-cyan-500/60 transition-colors">
                <img
                  src="/avatars/krishna-prasad-kurmi.png"
                  alt="Krishna Prasad Kurmi"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              <h3 className="font-display text-lg font-bold">Krishna Prasad Kurmi</h3>
              <div className="clay-badge-cyan mt-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold">
                Frontend Dashboard
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Responsive UI components, interactive charts, tactile claymorphic aesthetics, and planner widgets.
              </p>

              {/* Social Buttons */}
              <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-border/60 w-full">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Krishna Prasad Kurmi GitHub"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-cyan-500 transition-colors"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Krishna Prasad Kurmi LinkedIn"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-blue-500 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Krishna Prasad Kurmi Instagram"
                  className="clay-btn p-2 rounded-xl text-muted-foreground hover:text-foreground hover:text-rose-500 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 border-t border-border/50 relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 text-center relative z-10">
          <TiltCard className="antigravity-glass p-10 sm:p-14 rounded-3xl shadow-[var(--clay-shadow-lg)] border border-border/80 spatial-card">
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to meet your digital future?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-sm sm:text-base leading-relaxed">
              Create your profile in under 60 seconds. Test scenarios, calibrate habits, and stay years ahead of your goals.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild className="h-12 px-8 rounded-2xl font-bold shadow-[var(--clay-shadow)] text-base hover:scale-105 transition-transform">
                <Link to="/signup">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 rounded-2xl font-bold shadow-[var(--clay-shadow-sm)] text-base hover:scale-105 transition-transform">
                <Link to="/login">
                  Log In to Existing Twin
                </Link>
              </Button>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 bg-sidebar/50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GaugeCircle className="h-3.5 w-3.5" />
            </div>
            <span className="font-display font-bold text-foreground">Digital Twin AI</span>
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
            © {new Date().getFullYear()} Digital Twin AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
