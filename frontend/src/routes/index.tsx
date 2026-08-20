import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTwin, type UserRole } from "@/lib/twin-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Digital Twin" },
      {
        name: "description",
        content: "Create your twin profile or load a demo twin to explore the dashboard.",
      },
      { property: "og:title", content: "Sign in — Digital Twin" },
      {
        property: "og:description",
        content: "Create your twin profile or load a demo twin to explore the dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { state, ready, signIn, loadDemo, setTheme } = useTwin();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    if (ready && state.authed && state.profile.onboarded) navigate({ to: "/dashboard" });
  }, [ready, state.authed, state.profile.onboarded, navigate]);

  const submit = async (mode: "signup" | "login") => {
    if (!email || !password || (mode === "signup" && !name)) {
      toast.error("Fill in every field to continue");
      return;
    }
    const isLogin = mode === "login";
    const username = isLogin ? email.split("@")[0] : name;
    try {
      const onboarded = await signIn(username, email, !isLogin);
      toast.success(isLogin ? "Welcome back" : "Twin profile created");
      navigate({ to: onboarded && isLogin ? "/dashboard" : "/setup" });
    } catch (e: any) {
      if (e.message.includes("Please sign up first")) {
        setShowSignUpDialog(true);
      } else {
        toast.error(e.message || "Failed to log in");
      }
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

      toast.success(`${randomize ? "Randomized " : ""}${roleName} demo twin loaded with 30 days of history`);
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
      <div className="relative hidden flex-col justify-between border-r border-border bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-2">
          <GaugeCircle className="h-5 w-5" />
          <span className="font-display text-sm font-semibold">Digital Twin</span>
        </div>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            A model of you, running a few years ahead.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Log the day, plan the day, and watch how small changes to money, sleep, and focus
            reshape the next five years.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
            {[
              ["30d", "history modelled"],
              ["500", "Monte Carlo runs"],
              ["5y", "forward horizon"],
            ].map(([a, b]) => (
              <div key={b}>
                <div className="font-display text-2xl font-semibold">{a}</div>
                <div className="label-xs mt-1">{b}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Local demo — data stays in your browser.</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="panel w-full max-w-md p-8 animate-rise">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--clay-btn-primary)]">
                <GaugeCircle className="h-4 w-4" />
              </div>
              <span className="font-display text-base font-bold">Digital Twin</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl shadow-[var(--clay-shadow-sm)]"
              aria-label="Toggle theme"
              onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")}
            >
              {state.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
              <Field id="email" label="Email" value={email} set={setEmail} type="email" />
              <Field id="password" label="Password" value={password} set={setPassword} type="password" />
              <Button className="w-full mt-2" size="lg" onClick={() => submit("signup")}>
                Create Twin Profile
              </Button>
            </TabsContent>

            <TabsContent value="login" className="mt-6 space-y-4">
              <Field id="login-email" label="Email" value={email} set={setEmail} type="email" />
              <Field id="login-password" label="Password" value={password} set={setPassword} type="password" />
              <Button className="w-full mt-2" size="lg" onClick={() => submit("login")}>
                Log in to Twin
              </Button>
            </TabsContent>
          </Tabs>

          {/* Dedicated Demo Twin Multi-Role Dropdown Selector */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2.5 text-muted-foreground font-semibold">Or explore demo personas</span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="w-full flex items-center justify-between" disabled={!!loadingRole}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-foreground" />
                    <span>{loadingRole ? "Loading Demo..." : "Load Demo Twin"}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-1.5" align="center">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
                  Preset Demo Personas (Standard)
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="flex items-center gap-2.5 py-2 cursor-pointer"
                    onClick={() => handleLoadDemoRole("student", false)}
                  >
                    <div className="clay-icon-purple p-1.5 rounded-xl shrink-0">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Student</p>
                      <p className="text-xs text-muted-foreground">Study blocks, exams & allowance savings</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2.5 py-2 cursor-pointer"
                    onClick={() => handleLoadDemoRole("professional", false)}
                  >
                    <div className="clay-icon-indigo p-1.5 rounded-xl shrink-0">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Working Professional</p>
                      <p className="text-xs text-muted-foreground">Monthly salary, 401(k) & deep work</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2.5 py-2 cursor-pointer"
                    onClick={() => handleLoadDemoRole("freelancer", false)}
                  >
                    <div className="clay-icon-amber p-1.5 rounded-xl shrink-0">
                      <Laptop className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Freelancer / Creator</p>
                      <p className="text-xs text-muted-foreground">Client billings, tax buffer & runway</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2.5 py-2 cursor-pointer"
                    onClick={() => handleLoadDemoRole("entrepreneur", false)}
                  >
                    <div className="clay-icon-rose p-1.5 rounded-xl shrink-0">
                      <Rocket className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Founder / Entrepreneur</p>
                      <p className="text-xs text-muted-foreground">Venture equity, runway & build sprints</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2.5 py-2 cursor-pointer"
                    onClick={() => handleLoadDemoRole("retiree", false)}
                  >
                    <div className="clay-icon-emerald p-1.5 rounded-xl shrink-0">
                      <HeartHandshake className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Retiree / Senior</p>
                      <p className="text-xs text-muted-foreground">Pension, longevity & wellness buffer</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
                  Randomized Demo Values
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="flex items-center gap-2 py-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleLoadDemoRole("student", true)}
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <span>Random Student (Varied Age & Allowance)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 py-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleLoadDemoRole("professional", true)}
                  >
                    <Briefcase className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Random Professional (Varied Salary & Net Worth)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 py-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleLoadDemoRole("freelancer", true)}
                  >
                    <Laptop className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Random Freelancer (Varied Invoicing & Runway)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 py-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleLoadDemoRole("entrepreneur", true)}
                  >
                    <Rocket className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span>Random Founder (Varied Valuation & Burn)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 py-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleLoadDemoRole("retiree", true)}
                  >
                    <HeartHandshake className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Random Retiree (Varied Nest Egg & Routine)</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  className="flex items-center gap-2.5 py-2 cursor-pointer font-medium bg-accent/40 hover:bg-accent"
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

      <AlertDialog open={showSignUpDialog} onOpenChange={setShowSignUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Not Found</AlertDialogTitle>
            <AlertDialogDescription>
              We couldn't find a digital twin profile registered under that email/username. Please sign up first to get started!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSignUpDialog(false);
                setActiveTab("signup");
              }}
            >
              Sign Up Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <Input id={id} type={type} value={value} onChange={(e) => set(e.target.value)} />
    </div>
  );
}
