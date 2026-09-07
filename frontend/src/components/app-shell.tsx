import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Lightbulb,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Split,
  Sun,
  User,
  Wallet,
  Plus,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  X
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
import { getChatSessions, deleteChatSession, type ChatSessionData } from "@/lib/api";
import { toast } from "sonner";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  fullBleed = false
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  fullBleed?: boolean;
}) {
  const { state, setTheme, signOut } = useTwin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Chat sessions for sidebar
  const [sidebarSessions, setSidebarSessions] = useState<ChatSessionData[]>([]);
  const userId = state.profile.id ?? "default";

  // Real-time network connection detector
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch chat sessions for sidebar
  useEffect(() => {
    loadSidebarSessions();

    const handleSessionsUpdated = () => {
      loadSidebarSessions();
    };

    const handleOpenMobileThreads = () => {
      setMobileDrawerOpen(true);
    };

    window.addEventListener("chat-sessions-updated", handleSessionsUpdated);
    window.addEventListener("twin-open-mobile-threads", handleOpenMobileThreads);
    return () => {
      window.removeEventListener("chat-sessions-updated", handleSessionsUpdated);
      window.removeEventListener("twin-open-mobile-threads", handleOpenMobileThreads);
    };
  }, [userId, pathname]);

  const loadSidebarSessions = async () => {
    try {
      const data = await getChatSessions(userId);
      if (data) {
        setSidebarSessions(data.slice(0, 12));
      }
    } catch (e) {
      console.warn("Could not load sidebar sessions:", e);
    }
  };

  const handleNewChatDraft = () => {
    window.dispatchEvent(new CustomEvent("twin-new-chat-draft"));
    navigate({ to: "/chat" });
  };

  const handleSelectThread = (sessionId: string | number) => {
    window.dispatchEvent(new CustomEvent("twin-switch-chat-session", { detail: { sessionId } }));
    navigate({ to: "/chat" });
  };

  const handleDeleteThread = async (sessionId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteChatSession(sessionId, userId);
      setSidebarSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Thread deleted");
      window.dispatchEvent(new Event("chat-sessions-updated"));
    } catch (e) {
      toast.error("Could not delete thread");
    }
  };

  const cfg = getRoleConfig(state.profile.role);

  // Lower Section Modules & Tools (Pinned Below)
  const moduleItems = useMemo(() => {
    const items = [
      { to: "/dashboard", label: "Overview", icon: LayoutGrid, color: "text-indigo-500" },
      { to: "/planner", label: "Tasks & Planner", icon: ListChecks, color: "text-cyan-500" },
    ];

    if (cfg.hasStudyIntelligence) {
      items.push({ to: "/study", label: "Study & Academic", icon: GraduationCap, color: "text-purple-500" });
    }

    items.push(
      { to: "/suggestions", label: "Suggestions", icon: Lightbulb, color: "text-amber-500" },
      { to: "/simulator", label: "What-If Simulator", icon: Split, color: "text-rose-500" },
      { to: "/wealth", label: "Wealth Planner", icon: Wallet, color: "text-emerald-500" },
      { to: "/analytics", label: "Analytics", icon: Activity, color: "text-blue-500" },
      { to: "/profile", label: "Profile & Goals", icon: User, color: "text-violet-500" },
      { to: "/settings", label: "Settings", icon: Settings, color: "text-zinc-500 dark:text-zinc-400" },
    );

    return items;
  }, [cfg.hasStudyIntelligence]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* ------------------------------------------------------------- */}
      {/* CHATGPT-STYLE DESKTOP SIDEBAR                                  */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/50 bg-sidebar/80 dark:bg-[#141414]/95 backdrop-blur transition-[width] duration-300 md:flex ${
          collapsed ? "w-[72px]" : "w-68"
        }`}
      >
        {/* Brand Header: Logo + Title + Collapse Toggle (Hidden when collapsed) */}
        <div className={`flex h-16 items-center border-b border-border/40 shrink-0 ${collapsed ? "justify-center px-0" : "justify-between px-3.5"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0071E3] via-indigo-600 to-purple-600 text-white shadow-[0_4px_14px_rgba(0,113,227,0.35)] shrink-0">
              <Sparkles className="h-4 w-4 shrink-0" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-tight truncate">
                <span className="truncate">Visual Risk</span>
                <span className="text-[10px] bg-[#0071E3]/15 text-[#0071E3] dark:text-blue-400 font-bold px-1.5 py-0.5 rounded-md shrink-0">
                  AI
                </span>
              </div>
            )}
          </div>

          {/* Top Collapse Button (Hidden when collapsed) */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 rounded-xl hover:bg-muted dark:hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Scrollable Recent Chats Section with '+' New Chat icon beside heading */}
        <div className={`flex-1 overflow-y-auto space-y-1 min-h-0 ${collapsed ? "p-1.5 flex flex-col items-center" : "p-2"}`}>
          {!collapsed ? (
            <div className="px-2 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Recent Chats</span>
              <button
                type="button"
                onClick={handleNewChatDraft}
                className="h-6 w-6 rounded-lg hover:bg-muted dark:hover:bg-white/10 flex items-center justify-center text-[#0071E3] hover:text-[#0071E3]/80 transition-colors cursor-pointer"
                title="New Chat"
              >
                <Plus className="h-4 w-4 shrink-0" />
              </button>
            </div>
          ) : (
            <div className="py-1 w-full flex justify-center">
              <button
                type="button"
                onClick={handleNewChatDraft}
                className="h-9 w-9 rounded-xl bg-card dark:bg-white/10 hover:bg-muted dark:hover:bg-white/15 flex items-center justify-center text-[#0071E3] shadow-2xs cursor-pointer border border-border/40 dark:border-white/10 transition-transform active:scale-95"
                title="New Chat"
              >
                <Plus className="h-4 w-4 shrink-0" />
              </button>
            </div>
          )}

          <nav className={`flex flex-col gap-1 ${collapsed ? "w-full items-center" : "w-full"}`}>
            {sidebarSessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectThread(s.id)}
                title={s.title}
                className={`group flex items-center rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all duration-150 cursor-pointer ${
                  collapsed
                    ? "h-9 w-9 justify-center p-0"
                    : "w-full justify-between px-3 py-2 text-left"
                }`}
              >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5 truncate min-w-0"}`}>
                  <MessageSquare className="h-4 w-4 text-[#0071E3] shrink-0 opacity-70 group-hover:opacity-100 transition-transform group-hover:scale-110" />
                  {!collapsed && <span className="truncate max-w-[145px]">{s.title}</span>}
                </div>
                {!collapsed && (
                  <span
                    onClick={(e) => handleDeleteThread(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5 transition-opacity cursor-pointer"
                    title="Delete thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Pinned Lower Section: Modules & Telemetry Tools (Stuck to Bottom) */}
        <div className={`mt-auto border-t border-border/40 space-y-1 bg-sidebar/95 dark:bg-[#141414]/95 shrink-0 ${collapsed ? "p-1.5 flex flex-col items-center" : "p-2"}`}>
          {!collapsed && (
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Modules & Tools</span>
            </div>
          )}

          <nav className={`flex flex-col gap-1 ${collapsed ? "w-full items-center" : "w-full"}`}>
            {moduleItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={`group flex items-center rounded-xl text-xs font-semibold transition-all duration-150 ${
                    collapsed
                      ? "h-9 w-9 justify-center p-0"
                      : "gap-2.5 px-3 py-2 w-full"
                  } ${
                    active
                      ? "bg-card text-foreground shadow-2xs border border-border/60"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                      active ? item.color : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Collapse / Expand Button */}
        <div className={`border-t border-border/40 shrink-0 bg-sidebar/95 dark:bg-[#141414]/95 ${collapsed ? "p-1.5 flex justify-center" : "p-2"}`}>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer ${
              collapsed
                ? "h-9 w-9 justify-center p-0"
                : "w-full justify-start gap-2.5 px-3"
            }`}
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-[#0071E3] shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN VIEW AREA                                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2.5 sm:gap-3 border-b border-border/40 bg-background/85 px-3 sm:px-4 backdrop-blur md:px-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden rounded-xl text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs shrink-0"
            title="Chat Threads & Navigation"
          >
            <PanelLeftOpen className="h-4 w-4 text-[#0071E3]" />
          </Button>

          <div className="min-w-0 flex-1 flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{state.profile.name || "Guest"}</span>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                state.profile.role === "student"
                  ? "clay-badge-purple"
                  : state.profile.role === "professional"
                  ? "clay-badge-indigo"
                  : state.profile.role === "freelancer"
                  ? "clay-badge-amber"
                  : state.profile.role === "entrepreneur"
                  ? "clay-badge-rose"
                  : "clay-badge-emerald"
              }`}
            >
              {state.profile.role}
            </span>
            {isOnline ? (
              <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                Live
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                Offline
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")}
            className="rounded-xl shadow-2xs cursor-pointer shrink-0"
          >
            {state.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Account" className="rounded-xl shadow-2xs cursor-pointer">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuLabel className="font-display font-semibold">
                {state.profile.name || "Guest"}
              </DropdownMenuLabel>
              <p className="px-2 pb-2 text-xs text-muted-foreground truncate">{state.profile.email}</p>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
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

        {/* Content Container */}
        <main className={`flex-1 min-w-0 overflow-x-hidden ${fullBleed ? "p-0 flex flex-col min-h-0 pb-16 md:pb-0" : "px-4 py-6 pb-20 md:px-8 md:py-8 md:pb-8"}`}>
          <div className={`mx-auto w-full min-w-0 ${fullBleed ? "h-full flex flex-col flex-1" : "max-w-6xl animate-rise"}`}>
            {title && (
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                  {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border/50 bg-background/95 py-2 px-1 backdrop-blur md:hidden shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
        {[
          { to: "/chat", label: "Chat", icon: Sparkles, color: "text-[#0071E3]" },
          { to: "/dashboard", label: "Overview", icon: LayoutGrid, color: "text-indigo-500" },
          { to: "/planner", label: "Planner", icon: ListChecks, color: "text-cyan-500" },
          { to: "/simulator", label: "Simulator", icon: Split, color: "text-rose-500" },
          { to: "/wealth", label: "Wealth", icon: Wallet, color: "text-emerald-500" },
          { to: "/analytics", label: "Analytics", icon: Activity, color: "text-blue-500" },
        ].map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[9px] font-semibold transition-all ${
                active
                  ? "bg-card text-foreground shadow-2xs rounded-xl border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${active ? item.color : "text-muted-foreground"}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Sidebar & Chat Threads Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Slide-out Sheet */}
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-background dark:bg-[#141414] border-r border-border/60 shadow-2xl z-50">
            {/* Drawer Brand Header */}
            <div className="flex h-16 items-center justify-between border-b border-border/40 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0071E3] via-indigo-600 to-purple-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 font-display text-sm font-bold">
                  <span>Visual Risk</span>
                  <span className="text-[10px] bg-[#0071E3]/15 text-[#0071E3] font-bold px-1.5 py-0.5 rounded-md">
                    AI
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-3 border-b border-border/40">
              <Button
                onClick={() => {
                  handleNewChatDraft();
                  setMobileDrawerOpen(false);
                }}
                className="w-full justify-start gap-2 bg-[#0071E3] hover:bg-[#0071E3]/90 text-white rounded-xl shadow-xs cursor-pointer font-medium text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>New Chat Thread</span>
              </Button>
            </div>

            {/* Recent Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Conversations
              </div>
              {sidebarSessions.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground italic">No conversations yet.</p>
              ) : (
                sidebarSessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      handleSelectThread(s.id);
                      setMobileDrawerOpen(false);
                    }}
                    className="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <MessageSquare className="h-4 w-4 text-[#0071E3] shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </div>
                    <span
                      onClick={(e) => handleDeleteThread(s.id, e)}
                      className="opacity-60 hover:opacity-100 hover:text-rose-500 p-1 cursor-pointer"
                      title="Delete thread"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Pinned Bottom Options */}
            <div className="p-3 border-t border-border/40 space-y-1 bg-muted/20">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate({ to: "/settings" });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
