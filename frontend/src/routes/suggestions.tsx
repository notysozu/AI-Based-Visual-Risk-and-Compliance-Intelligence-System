import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Plus,
  Sparkles,
  RefreshCw,
  PlusCircle,
  RotateCcw,
  Search,
  Zap,
  Clock,
  TrendingUp,
  BrainCircuit,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useGuard } from "@/lib/use-guard";
import { baseline, useTwin, getRoleConfig, getRoleSuggestions, type Suggestion } from "@/lib/twin-store";
import {
  getUserSuggestions,
  generateSmartSuggestions,
  resetSuggestionsApi,
  adoptSuggestionApi,
} from "@/lib/api";

export const Route = createFileRoute("/suggestions")({
  head: () => ({
    meta: [
      { title: "Smart AI Suggestions — Digital Twin" },
      { name: "description", content: "Hyper-personalized AI lifestyle, focus, and financial recommendations." },
      { property: "og:title", content: "Smart AI Suggestions — Digital Twin" },
      {
        property: "og:description",
        content: "Hyper-personalized AI lifestyle, focus, and financial recommendations.",
      },
    ],
  }),
  component: SuggestionsPage,
});

interface SuggestionItemData {
  id?: number;
  suggestion_id: string;
  title: string;
  category: string;
  detail: string;
  impact: string;
  start_time: string;
  duration_minutes: number;
  is_adopted: boolean;
  is_ai_generated: boolean;
}

function SuggestionsPage() {
  const ok = useGuard();
  const { state, adopt } = useTwin();

  const [items, setItems] = useState<SuggestionItemData[]>([]);
  const [diagnostic, setDiagnostic] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [addingMore, setAddingMore] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const base = baseline(state.logs);
  const cfg = getRoleConfig(state.profile.role);
  const userId = state.profile.id ?? 1;

  // Load initial suggestions from database or fallback to local role templates
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await getUserSuggestions(userId);
        if (isMounted && res?.suggestions?.length > 0) {
          setItems(res.suggestions);
          setDiagnostic(res.lifestyle_diagnostic || "");
        } else if (isMounted) {
          // Fallback to local role suggestions
          const roleDefaults = getRoleSuggestions(state.profile.role).map((s) => ({
            suggestion_id: s.id,
            title: s.title,
            category: s.category,
            detail: s.detail,
            impact: s.impact,
            start_time: s.start,
            duration_minutes: s.minutes,
            is_adopted: state.adopted.includes(s.id),
            is_ai_generated: false,
          }));
          setItems(roleDefaults);
        }
      } catch (err) {
        console.warn("Failed to load suggestions from backend, using local store:", err);
        const roleDefaults = getRoleSuggestions(state.profile.role).map((s) => ({
          suggestion_id: s.id,
          title: s.title,
          category: s.category,
          detail: s.detail,
          impact: s.impact,
          start_time: s.start,
          duration_minutes: s.minutes,
          is_adopted: state.adopted.includes(s.id),
          is_ai_generated: false,
        }));
        if (isMounted) setItems(roleDefaults);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [userId, state.profile.role]);

  // Handle AI Regeneration (Data Analysis & Refresh)
  const handleRegenerate = async () => {
    setGenerating(true);
    toast.info("AI is analyzing your role and 30-day baseline data...");
    try {
      const res = await generateSmartSuggestions(userId, { mode: "regenerate" });
      if (res?.suggestions) {
        setItems(res.suggestions);
        setDiagnostic(res.lifestyle_diagnostic || "");
        toast.success("Fresh AI suggestions generated from your data");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI suggestions");
    } finally {
      setGenerating(false);
    }
  };

  // Handle Suggest More (Append 3-4 extra suggestions)
  const handleSuggestMore = async () => {
    setAddingMore(true);
    toast.info("AI is synthesizing additional complementary suggestions...");
    try {
      const res = await generateSmartSuggestions(userId, { mode: "more" });
      if (res?.suggestions) {
        setItems(res.suggestions);
        toast.success("Added extra AI suggestions to your library");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add more suggestions");
    } finally {
      setAddingMore(false);
    }
  };

  // Handle Reset to Defaults
  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await resetSuggestionsApi(userId);
      if (res?.suggestions) {
        setItems(res.suggestions);
        setDiagnostic(res.lifestyle_diagnostic || "");
        toast.success(`Reset to default ${cfg.badge} suggestions`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset suggestions");
    } finally {
      setResetting(false);
    }
  };

  // Handle Adoption
  const handleAdopt = (item: SuggestionItemData) => {
    const s: Suggestion = {
      id: item.suggestion_id,
      title: item.title,
      category: item.category,
      detail: item.detail,
      impact: item.impact,
      start: item.start_time,
      minutes: item.duration_minutes,
    };

    adopt(s);
    setItems((prev) =>
      prev.map((i) => (i.suggestion_id === item.suggestion_id ? { ...i, is_adopted: true } : i))
    );
    toast.success(`"${item.title}" added to today's planner tasks`);
  };

  // Filtered & Searched Suggestions
  const filteredSuggestions = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeCategory === "all") return true;
      if (activeCategory === "adopted") return item.is_adopted || state.adopted.includes(item.suggestion_id);

      const cat = item.category.toLowerCase();
      if (activeCategory === "focus") return cat.includes("focus") || cat.includes("work");
      if (activeCategory === "vitality") return cat.includes("vitality") || cat.includes("health") || cat.includes("sleep");
      if (activeCategory === "finance") return cat.includes("finance") || cat.includes("money") || cat.includes("savings");
      if (activeCategory === "study") return cat.includes("study") || cat.includes("academic") || cat.includes("skill");

      return true;
    });
  }, [items, activeCategory, searchQuery, state.adopted]);

  if (!ok) return null;

  return (
    <AppShell
      title="Smart Suggestions"
      subtitle={`${cfg.badge} · Persona-calibrated recommendations derived from your measured lifestyle data.`}
    >
      <div className="space-y-5">
        {/* Lifestyle Diagnostics & Analysis Banner */}
        <div className="panel p-5 border border-border/60 shadow-[var(--clay-shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-[0_3px_10px_rgba(245,158,11,0.3)]">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm tracking-tight text-foreground">
                    Data-Driven Persona Engine
                  </h3>
                  <span className="clay-badge-amber text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {cfg.badge}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {diagnostic || `Based on ${base.days || 0} logged days: sleep ${base.sleep || state.profile.sleepHours}h, screen ${base.screen || state.profile.screenTime}h, ${cfg.studyLabel.toLowerCase()} ${base.study || (state.profile.studyHours / 7).toFixed(1)}h/day.`}
                </p>
              </div>
            </div>

            {/* AI Generation Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3 rounded-xl shadow-[var(--clay-shadow-sm)] flex items-center gap-1.5 hover:border-foreground/40"
                onClick={handleSuggestMore}
                disabled={addingMore || generating}
              >
                <PlusCircle className={`h-3.5 w-3.5 text-indigo-500 ${addingMore ? "animate-spin" : ""}`} />
                <span>{addingMore ? "Synthesizing..." : "Suggest More"}</span>
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs px-3 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-[0_2px_8px_rgba(99,102,241,0.4)] flex items-center gap-1.5"
                onClick={handleRegenerate}
                disabled={generating || addingMore}
              >
                <Sparkles className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
                <span>{generating ? "Analyzing Data..." : "Regenerate with AI"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2.5 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={handleReset}
                disabled={resetting}
                title="Reset to role default baseline"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-1">
            <div className="rounded-xl bg-input/40 p-2.5 border border-border/30 shadow-[var(--clay-inset)] text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Sleep</span>
              <p className="text-sm font-bold mt-0.5 font-display">{base.sleep || state.profile.sleepHours}h / night</p>
            </div>
            <div className="rounded-xl bg-input/40 p-2.5 border border-border/30 shadow-[var(--clay-inset)] text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Screen Load</span>
              <p className="text-sm font-bold mt-0.5 font-display">{base.screen || state.profile.screenTime}h / day</p>
            </div>
            <div className="rounded-xl bg-input/40 p-2.5 border border-border/30 shadow-[var(--clay-inset)] text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">{cfg.studyLabel}</span>
              <p className="text-sm font-bold mt-0.5 font-display">{base.study || (state.profile.studyHours / 7).toFixed(1)}h / day</p>
            </div>
            <div className="rounded-xl bg-input/40 p-2.5 border border-border/30 shadow-[var(--clay-inset)] text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Adopted Habits</span>
              <p className="text-sm font-bold mt-0.5 font-display text-emerald-600 dark:text-emerald-400">
                {items.filter((i) => i.is_adopted || state.adopted.includes(i.suggestion_id)).length} Active
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-input/50 p-1 border border-border/40 shadow-[var(--clay-inset)] text-xs">
            {[
              { id: "all", label: "All Suggestions" },
              { id: "focus", label: "Focus & Work" },
              { id: "vitality", label: "Vitality & Sleep" },
              { id: "finance", label: "Finance & Savings" },
              { id: "study", label: cfg.studyLabel },
              { id: "adopted", label: "Adopted in Plan" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeCategory === tab.id
                    ? "bg-card text-foreground shadow-[var(--clay-shadow-sm)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suggestions..."
              className="pl-8 h-9 text-xs rounded-xl shadow-[var(--clay-inset)] bg-input/40 border-border/40"
            />
          </div>
        </div>

        {/* Suggestions Grid */}
        {loading ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground animate-pulse">
            <Sparkles className="h-6 w-6 text-indigo-500 animate-spin mx-auto mb-2" />
            Loading calibrated recommendations...
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            <p>No suggestions match the selected category.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 rounded-xl text-xs"
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredSuggestions.map((s) => {
              const taken = s.is_adopted || state.adopted.includes(s.suggestion_id);
              const cat = s.category.toLowerCase();
              const catClass =
                cat.includes("study") || cat.includes("academic")
                  ? "clay-badge-purple"
                  : cat.includes("work") || cat.includes("focus")
                  ? "clay-badge-indigo"
                  : cat.includes("health") || cat.includes("sleep") || cat.includes("vitality") || cat.includes("fitness")
                  ? "clay-badge-emerald"
                  : "clay-badge-amber";

              return (
                <div
                  key={s.suggestion_id}
                  className={`panel flex flex-col justify-between p-6 hover:-translate-y-1 hover:shadow-[var(--clay-shadow-lg)] transition-all duration-200 border ${
                    taken ? "border-emerald-500/40 bg-emerald-500/[0.02]" : "border-border/60"
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${catClass}`}>
                          {s.category}
                        </span>
                        {s.is_ai_generated && (
                          <span className="clay-badge-indigo rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" /> AI
                          </span>
                        )}
                      </div>
                      <span className="clay-badge-emerald rounded-full px-2.5 py-0.5 text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {s.impact}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-base sm:text-lg font-bold text-foreground">{s.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.start_time} · {s.duration_minutes} min
                    </span>

                    <Button
                      size="sm"
                      variant={taken ? "outline" : "default"}
                      disabled={taken}
                      className={`rounded-xl text-xs font-semibold ${
                        taken
                          ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:from-indigo-700 hover:to-purple-700"
                      }`}
                      onClick={() => handleAdopt(s)}
                    >
                      {taken ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> In your plan
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add to tasks
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
