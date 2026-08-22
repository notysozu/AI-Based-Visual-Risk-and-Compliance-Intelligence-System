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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTwin } from "@/lib/twin-store";

export const Route = createFileRoute("/pages/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Digital Twin AI" },
      {
        name: "description",
        content:
          "Review the terms, simulation modeling guidelines, and disclaimer policies for using Digital Twin AI.",
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
              By accessing or creating an account on Digital Twin AI, you acknowledge and agree to be bound by these Terms of Service. If you disagree with any portion of these terms, please discontinue using the service.
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
              Digital Twin AI provides probabilistic algorithmic modeling, 500-iteration Monte Carlo projections, focus momentum metrics, and syllabus scheduling for educational, self-reflection, and personal planning purposes only:
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
              All proprietary algorithms, simulation engine code, user interfaces, branding, and visual designs remain the intellectual property of Digital Twin AI and its maintainers. You retain full ownership of all custom data and parameters you input.
            </p>
          </div>

          {/* Section 5 */}
          <div className="antigravity-glass p-8 rounded-3xl border border-border/80 shadow-[var(--clay-shadow)]">
            <h2 className="font-display text-2xl font-bold mb-3">5. Questions & Legal Inquiries</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions regarding these Terms of Service, contact us at{" "}
              <a href="mailto:lifegamer2050@gmail.com" className="text-primary font-semibold underline underline-offset-4">
                lifegamer2050@gmail.com
              </a>.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 bg-sidebar/50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GaugeCircle className="h-3.5 w-3.5" />
            </div>
            <span className="font-display font-bold text-foreground">Digital Twin AI</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/pages/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/pages/terms" className="font-semibold text-foreground">Terms of Service</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>

          <div>
            © {new Date().getFullYear()} Digital Twin AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
