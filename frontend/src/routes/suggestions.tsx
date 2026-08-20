import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useGuard } from "@/lib/use-guard";
import { getRoleSuggestions, baseline, useTwin, getRoleConfig } from "@/lib/twin-store";

export const Route = createFileRoute("/suggestions")({
  head: () => ({
    meta: [
      { title: "Suggestions — Digital Twin" },
      { name: "description", content: "Ideas your twin recommends, ready to drop into today's plan." },
      { property: "og:title", content: "Suggestions — Digital Twin" },
      {
        property: "og:description",
        content: "Ideas your twin recommends, ready to drop into today's plan.",
      },
    ],
  }),
  component: SuggestionsPage,
});

function SuggestionsPage() {
  const ok = useGuard();
  const { state, adopt } = useTwin();
  if (!ok) return null;

  const base = baseline(state.logs);
  const cfg = getRoleConfig(state.profile.role);
  const suggestions = getRoleSuggestions(state.profile.role);

  return (
    <AppShell
      title="Suggestions"
      subtitle={`${cfg.badge} · Ideas recommended for your role, ready to drop into today's plan.`}
    >
      <div className="panel mb-5 p-5 text-sm text-muted-foreground">
        Based on {base.days || 0} logged days: sleep {base.sleep || state.profile.sleepHours}h,
        screen {base.screen || state.profile.screenTime}h, {cfg.studyLabel.toLowerCase()}{" "}
        {base.study || (state.profile.studyHours / 7).toFixed(1)}h per day.
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {suggestions.map((s) => {
          const taken = state.adopted.includes(s.id);
          return (
            <div
              key={s.id}
              className="panel flex flex-col justify-between p-6 hover:-translate-y-1 hover:shadow-[var(--clay-shadow-lg)] transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="label-xs">{s.category}</span>
                  <span className="rounded-full border border-border/40 bg-accent px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-[var(--clay-shadow-sm)]">
                    {s.impact}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
                <span className="text-xs font-mono text-muted-foreground">
                  {s.start} · {s.minutes} min
                </span>
                <Button
                  size="sm"
                  variant={taken ? "outline" : "default"}
                  disabled={taken}
                  className="rounded-xl"
                  onClick={() => {
                    adopt(s);
                    toast.success("Added to today's plan");
                  }}
                >
                  {taken ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-emerald-500" /> In your plan
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> Add to tasks
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
