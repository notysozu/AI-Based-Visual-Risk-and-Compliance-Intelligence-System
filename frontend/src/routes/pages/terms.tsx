import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GaugeCircle,
  Moon,
  Sun,
  Scale,
  AlertTriangle,
  FileText,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Github,
  Linkedin,
  Instagram,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTwin } from "@/lib/twin-store";

export const Route = createFileRoute("/pages/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — VisualRisk AI (VRCI)" },
      {
        name: "description",
        content: "Review the terms, simulation modeling guidelines, and disclaimer policies for using AI-Based Visual Risk and Compliance Intelligence System (VisualRisk AI (VRCI)).",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { state, setTheme } = useTwin();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20">
      {/* Floating Header */}
      <header className="sticky top-4 z-50 mx-auto w-[94%] max-w-5xl">
        <div className="antigravity-glass rounded-2xl px-5 py-3 flex items-center justify-between border border-border/60 shadow-[var(--clay-shadow-sm)]">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
              <GaugeCircle className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              VisualRisk <span className="text-indigo-500 font-mono text-xs px-1.5 py-0.5 rounded-md bg-indigo-500/10">AI</span>
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

            <Button variant="outline" size="sm" asChild className="rounded-xl font-semibold">
              <Link to="/">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4 shadow-[var(--clay-shadow-sm)]">
            <Scale className="h-4 w-4" />
            <span>Rules of Engagement</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last Updated: August 2026 • Effective Immediately
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <div className="antigravity-glass p-8 rounded-3xl border border-border/80 shadow-[var(--clay-shadow)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="clay-icon-indigo w-10 h-10 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-bold">1. Acceptance of Terms</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or creating an account on AI-Based Visual Risk and Compliance Intelligence System (VisualRisk AI (VRCI)), you acknowledge and agree to be bound by these Terms of Service. If you disagree with any portion of these terms, please discontinue using the service.
            </p>
          </div>

          {/* Section 2: Critical Simulation Disclaimer */}
          <div className="antigravity-glass p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 shadow-[var(--clay-shadow)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="clay-icon-amber w-10 h-10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">2. Simulation & Predictive Modeling Disclaimer</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              AI-Based Visual Risk and Compliance Intelligence System (VisualRisk AI (VRCI)) provides probabilistic algorithmic risk modeling, 500-iteration Monte Carlo projections, focus momentum metrics, and syllabus scheduling for educational, self-reflection, and personal planning purposes only:
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span><strong>Not Financial Advice:</strong> Projected net worth, compounding forecasts, and retirement runways are mathematical estimations based on static assumptions and market distributions. They do not constitute certified financial or investment advisory services.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span><strong>Not Medical or Health Advice:</strong> Sleep and cognitive recovery indicators are behavioral proxies and should not replace clinical medical advice.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span><strong>User Discretion:</strong> You are solely responsible for decisions and actions taken based on simulated scenario outputs.</span>
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="antigravity-glass p-8 rounded-3xl border border-border/80 shadow-[var(--clay-shadow)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="clay-icon-purple w-10 h-10 rounded-xl flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-bold">3. User Accounts & Security</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your twin profile. You agree to immediately notify our team if you detect unauthorized access or security breaches.
            </p>
          </div>

          {/* Section 4 */}
          <div className="antigravity-glass p-8 rounded-3xl border border-border/80 shadow-[var(--clay-shadow)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="clay-icon-cyan w-10 h-10 rounded-xl flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-bold">4. Intellectual Property</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All proprietary algorithms, simulation engine code, user interfaces, branding, and visual designs remain the intellectual property of AI-Based Visual Risk and Compliance Intelligence System (VisualRisk AI (VRCI)) and its maintainers. You retain full ownership of all custom data and parameters you input.
            </p>
          </div>

          {/* Section 5 */}
          <div className="antigravity-glass p-8 rounded-3xl border border-border/80 shadow-[var(--clay-shadow)]">
            <h2 className="font-display text-2xl font-bold mb-3">5. Questions & Open Source Inquiries</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions regarding these Terms of Service or wish to contribute to the project, reach out via our GitHub repository at{" "}
              <a
                href="https://github.com/notysozu/AI-Based-Visual-Risk-and-Compliance-Intelligence-System"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80"
              >
                github.com/notysozu/Digital-Twin-AI
              </a>.
            </p>
          </div>
        </div>
      </main>

      {/* Reconstructed Apple-Style Minimal Footer */}
      <footer className="mt-auto border-t border-border/40 bg-sidebar/15 pt-16 pb-12 text-xs text-muted-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-border/40">
            {/* Brand Column */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0071E3] text-white">
                  <GaugeCircle className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-foreground text-sm tracking-tight">VisualRisk AI (VRCI)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-[#0071E3] dark:text-blue-400 font-medium">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm font-normal">
                Autonomous predictive intelligence modeling wealth, habits, study velocity, and decision compounding 5 years ahead.
              </p>
            </div>

            {/* Intelligence Suites */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-foreground tracking-wider uppercase font-mono">Platform</span>
              <ul className="space-y-2">
                <li><Link to="/study" className="hover:text-foreground transition-colors">Study Intelligence</Link></li>
                <li><Link to="/simulator" className="hover:text-foreground transition-colors">What-If Simulator</Link></li>
                <li><Link to="/suggestions" className="hover:text-foreground transition-colors">Recommendations</Link></li>
                <li><Link to="/planner" className="hover:text-foreground transition-colors">Habit Planner</Link></li>
                <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Live Dashboard</Link></li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-foreground tracking-wider uppercase font-mono">Account</span>
              <ul className="space-y-2">
                <li><Link to="/login" className="hover:text-foreground transition-colors">Log In</Link></li>
                <li><Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link></li>
                <li><Link to="/profile" className="hover:text-foreground transition-colors">Twin Profile</Link></li>
                <li><Link to="/analytics" className="hover:text-foreground transition-colors">System Analytics</Link></li>
              </ul>
            </div>

            {/* Project & Legal */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-foreground tracking-wider uppercase font-mono">Project</span>
              <ul className="space-y-2">
                <li><a href="https://github.com/notysozu/AI-Based-Visual-Risk-and-Compliance-Intelligence-System" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">GitHub Repo <ArrowUpRight className="h-3 w-3" /></a></li>
                <li><Link to="/pages/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/pages/terms" className="font-semibold text-foreground">Terms of Service</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Home Page</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Colophon Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[11px] text-muted-foreground text-center sm:text-left">
              © {new Date().getFullYear()} AI-Based Visual Risk & Compliance Intelligence System (VisualRisk AI (VRCI)). All rights reserved.
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://github.com/notysozu/AI-Based-Visual-Risk-and-Compliance-Intelligence-System"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="VisualRisk AI GitHub"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-[#0A66C2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-[#E4405F] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
