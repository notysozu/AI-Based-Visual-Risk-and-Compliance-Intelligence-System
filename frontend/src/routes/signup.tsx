import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  GaugeCircle,
  Moon,
  Sun,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Laptop,
  Rocket,
  HeartHandshake,
  Dices,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTwin, type UserRole } from "@/lib/twin-store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Digital Twin AI" },
      {
        name: "description",
        content: "Create your personalized Digital Twin AI and start forecasting your life.",
      },
      { property: "og:title", content: "Sign Up — Digital Twin AI" },
      {
        property: "og:description",
        content: "Create your personalized Digital Twin AI and start forecasting your life.",
      },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { state, ready, signIn, loadDemo, setTheme } = useTwin();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    if (ready && state.authed && state.profile.onboarded) {
      navigate({ to: "/dashboard" });
    }
  }, [ready, state.authed, state.profile.onboarded, navigate]);

  const submit = async (mode: "signup" | "login") => {
    if (!email || !password || (mode === "signup" && !name)) {
      toast.error("Fill in every field to continue");
      return;
    }
    if (mode === "signup" && !agreeTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy to continue");
      return;
    }
    const isLogin = mode === "login";
    const username = isLogin ? email.split("@")[0] : name;
    try {
      const onboarded = await signIn(username, email, !isLogin);
      toast.success(isLogin ? "Welcome back!" : "Twin profile created!");
      navigate({ to: onboarded && isLogin ? "/dashboard" : "/setup" });
    } catch (e: any) {
      toast.error(e.message || "Failed to authenticate");
    }
  };

  const handleLoadDemoRole = async (role: UserRole, randomize = false) => {
    setLoadingRole(role + (randomize ? "-rand" : ""));
    try {
      await loadDemo(role, randomize);
      const roleName =
        role === "student"
          ? "Student"
          : role === "freelancer"
          ? "Freelancer / Creator"
          : role === "entrepreneur"
          ? "Founder / Entrepreneur"
          : role === "retiree"
          ? "Retiree / Senior"
          : "Working Professional";

      toast.success(`${randomize ? "Randomized " : ""}${roleName} demo twin loaded!`);
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message || "Failed to load demo twin");
    } finally {
      setLoadingRole(null);
    }
  };

  const handleLoadFullyRandom = async () => {
    const roles: UserRole[] = ["student", "professional", "freelancer", "entrepreneur", "retiree"];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    await handleLoadDemoRole(randomRole, true);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between border-r border-border bg-sidebar p-12 lg:flex overflow-hidden">
        {/* Soft background ambient tints */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2.5 z-10">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
              <GaugeCircle className="h-4.5 w-4.5" />
            </div>
            <span className="font-display text-base font-bold tracking-tight">Digital Twin</span>
          </Link>
        </div>

        <div className="max-w-md z-10">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Start modeling your future today.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Create your personalized Digital Twin in less than a minute. Tailored for students, professionals, freelancers, founders, and retirees.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              ← Back to main website
            </Link>
          </div>
        </div>

        <div className="z-10 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary underline underline-offset-4">
            Log in here
          </Link>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-6 sm:p-10 overflow-hidden">
        {/* Soft background ambient tints */}
        <div className="absolute top-1/4 right-10 h-72 w-72 rounded-full bg-indigo-500/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 h-72 w-72 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />

        <div className="panel w-full max-w-md p-8 animate-rise z-10">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
                <GaugeCircle className="h-4 w-4" />
              </div>
              <span className="font-display text-base font-bold">Digital Twin</span>
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl shadow-[var(--clay-shadow-sm)]"
              aria-label="Toggle theme"
              onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")}
            >
              {state.theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="login">Log in</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-6 space-y-4">
              <div className="grid gap-1.5">
                <Label className="label-xs" htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alice" />
              </div>
              <Field id="signup-email" label="Email" value={email} set={setEmail} type="email" />
              <Field id="signup-password" label="Password" value={password} set={setPassword} type="password" />

              <div className="flex items-start space-x-2.5 pt-1">
                <Checkbox
                  id="agree-terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(Boolean(checked))}
                />
                <Label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                  I agree to the{" "}
                  <Link to="/pages/terms" target="_blank" className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/pages/privacy" target="_blank" className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>

              <Button className="w-full mt-2" size="lg" onClick={() => submit("signup")}>
                Create Twin Profile
              </Button>
            </TabsContent>

            <TabsContent value="login" className="mt-6 space-y-4">
              <Field id="email" label="Email" value={email} set={setEmail} type="email" />
              <Field id="password" label="Password" value={password} set={setPassword} type="password" />
              <Button className="w-full mt-2" size="lg" onClick={() => submit("login")}>
                Log in to Twin
              </Button>
            </TabsContent>
          </Tabs>

          {/* Quick Demo Twin Multi-Role Selector */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-card px-2 text-muted-foreground font-semibold">Or explore 1-click demo personas</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole !== null}
                onClick={() => handleLoadDemoRole("student")}
                className="flex flex-col h-auto py-2.5 px-1 items-center gap-1 rounded-xl text-xs font-semibold hover:border-purple-500/50 hover:bg-purple-500/5 transition-all shadow-[var(--clay-shadow-sm)]"
              >
                <GraduationCap className="h-4 w-4 text-purple-500" />
                <span>Student</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole !== null}
                onClick={() => handleLoadDemoRole("professional")}
                className="flex flex-col h-auto py-2.5 px-1 items-center gap-1 rounded-xl text-xs font-semibold hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all shadow-[var(--clay-shadow-sm)]"
              >
                <Briefcase className="h-4 w-4 text-indigo-500" />
                <span>Professional</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={loadingRole !== null}
                onClick={() => handleLoadDemoRole("freelancer")}
                className="flex flex-col h-auto py-2.5 px-1 items-center gap-1 rounded-xl text-xs font-semibold hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all shadow-[var(--clay-shadow-sm)]"
              >
                <Laptop className="h-4 w-4 text-cyan-500" />
                <span>Freelancer</span>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-between gap-2 rounded-xl text-xs font-semibold shadow-[var(--clay-shadow-sm)]"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    More Personas & Randomizers
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-72 p-2">
                <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Specialized Personas
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="flex items-center gap-2.5 py-2 cursor-pointer font-medium"
                  onSelect={() => handleLoadDemoRole("entrepreneur")}
                  onClick={() => handleLoadDemoRole("entrepreneur")}
                >
                  <div className="clay-icon-rose p-1.5 rounded-xl shrink-0">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Founder / Startup</p>
                    <p className="text-xs text-muted-foreground">Runway, growth & valuation</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="flex items-center gap-2.5 py-2 cursor-pointer font-medium"
                  onSelect={() => handleLoadDemoRole("retiree")}
                  onClick={() => handleLoadDemoRole("retiree")}
                >
                  <div className="clay-icon-emerald p-1.5 rounded-xl shrink-0">
                    <HeartHandshake className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Retiree / Senior</p>
                    <p className="text-xs text-muted-foreground">Preservation & longevity</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  className="flex items-center gap-2.5 py-2 cursor-pointer font-medium bg-accent/40 hover:bg-accent"
                  onSelect={handleLoadFullyRandom}
                  onClick={handleLoadFullyRandom}
                >
                  <div className="clay-icon-cyan p-1.5 rounded-xl shrink-0">
                    <Dices className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Fully Random Twin</p>
                    <p className="text-xs text-muted-foreground">Surprise me with any role & random habits</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  set,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="label-xs" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={label}
      />
    </div>
  );
}
