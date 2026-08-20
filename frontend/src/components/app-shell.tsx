import { useState, useMemo, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  ChevronLeft,
  GaugeCircle,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Lightbulb,
  LogOut,
  Moon,
  Settings,
  Split,
  Sun,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsDialog } from "@/components/settings-dialog";
import { useTwin, getRoleConfig } from "@/lib/twin-store";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { state, setTheme, signOut } = useTwin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const cfg = getRoleConfig(state.profile.role);

  const navItems = useMemo(() => {
    const items = [
      { to: "/dashboard", label: "Overview", icon: LayoutGrid, color: "text-indigo-500", activeBg: "clay-badge-indigo" },
      { to: "/planner", label: "Tasks & Planner", icon: ListChecks, color: "text-cyan-500", activeBg: "clay-badge-cyan" },
    ];

    if (cfg.hasStudyIntelligence) {
      items.push({ to: "/study", label: "Study & Academic", icon: GraduationCap, color: "text-purple-500", activeBg: "clay-badge-purple" });
    }

    items.push(
      { to: "/suggestions", label: "Suggestions", icon: Lightbulb, color: "text-amber-500", activeBg: "clay-badge-amber" },
      { to: "/simulator", label: "What-If Simulator", icon: Split, color: "text-rose-500", activeBg: "clay-badge-rose" },
      { to: "/wealth", label: "Wealth Planner", icon: Wallet, color: "text-emerald-500", activeBg: "clay-badge-emerald" },
      { to: "/analytics", label: "Analytics", icon: Activity, color: "text-blue-500", activeBg: "clay-badge-indigo" },
      { to: "/profile", label: "Profile & Goals", icon: User, color: "text-violet-500", activeBg: "clay-badge-purple" },
    );

    return items;
  }, [cfg.hasStudyIntelligence]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/50 bg-sidebar/80 backdrop-blur transition-[width] duration-300 md:flex ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)]">
            <GaugeCircle className="h-5 w-5 shrink-0" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 font-display text-base font-bold tracking-tight">
              <span>Digital Twin</span>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.2 rounded-md">AI</span>
            </div>
          )}
        </div>
        
        <nav className="flex flex-1 flex-col gap-1.5 px-3 py-2">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "bg-card text-foreground shadow-[var(--clay-shadow-sm)] border border-border/60"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground hover:shadow-[var(--clay-shadow-sm)]"
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${active ? item.color : "text-muted-foreground group-hover:text-foreground"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 rounded-xl text-muted-foreground shadow-[var(--clay-shadow-sm)] bg-card/60"
            onClick={() => setCollapsed((v) => !v)}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/40 bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="truncate">{state.profile.name || "Guest"}</span>
              <span className={`hidden sm:inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                state.profile.role === "student"
                  ? "clay-badge-purple"
                  : state.profile.role === "professional"
                  ? "clay-badge-indigo"
                  : state.profile.role === "freelancer"
                  ? "clay-badge-amber"
                  : state.profile.role === "entrepreneur"
                  ? "clay-badge-rose"
                  : "clay-badge-emerald"
              }`}>
                {state.profile.role}
              </span>
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                Live Sync
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">{state.profile.email}</p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")}
            className="rounded-xl shadow-[var(--clay-shadow-sm)]"
          >
            {state.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Account" className="rounded-xl shadow-[var(--clay-shadow-sm)]">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuLabel className="font-display font-semibold">{state.profile.name || "Guest"}</DropdownMenuLabel>
              <p className="px-2 pb-2 text-xs text-muted-foreground truncate">{state.profile.email}</p>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setSettingsOpen(true)} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings & Roles
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  signOut();
                  navigate({ to: "/" });
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl animate-rise">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border/50 bg-background/95 py-2.5 backdrop-blur md:hidden shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
        {navItems.slice(0, 5).map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold transition-all ${
                active
                  ? "bg-card text-foreground shadow-[var(--clay-shadow-sm)] rounded-xl border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? item.color : "text-muted-foreground"}`} />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
