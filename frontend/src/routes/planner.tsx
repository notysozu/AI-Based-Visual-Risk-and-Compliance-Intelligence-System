import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useGuard } from "@/lib/use-guard";
import { today, useTwin, type Task, getRoleConfig } from "@/lib/twin-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Tasks & Planner — Digital Twin" },
      { name: "description", content: "Today's plan, built from your tasks and adopted suggestions." },
      { property: "og:title", content: "Tasks & Planner — Digital Twin" },
      {
        property: "og:description",
        content: "Today's plan, built from your tasks and adopted suggestions.",
      },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const ok = useGuard();
  const { state, addTask, toggleTask, removeTask } = useTwin();
  const cfg = getRoleConfig(state.profile.role);
  const categories = cfg.taskCategories;

  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [minutes, setMinutes] = useState(45);
  const [category, setCategory] = useState<string>(categories[0]);

  const todays = useMemo(
    () =>
      state.tasks
        .filter((t) => t.date === today())
        .slice()
        .sort((a, b) => a.start.localeCompare(b.start)),
    [state.tasks],
  );

  if (!ok) return null;

  const done = todays.filter((t) => t.done).length;
  const planned = todays.reduce((s, t) => s + t.minutes, 0);

  const placeholder =
    state.profile.role === "student"
      ? "e.g. Study Chapter 4 & do problem set"
      : state.profile.role === "retiree"
      ? "e.g. Morning 30-min walk & crossword"
      : "e.g. Prepare project presentation";

  const submit = () => {
    if (!title.trim()) {
      toast.error("Give the task a name");
      return;
    }
    addTask({ title: title.trim(), start, minutes, category: category as any, done: false, date: today() });
    setTitle("");
    toast.success("Task added to today's plan");
  };

  return (
    <AppShell
      title="Today's Plan"
      subtitle={`${cfg.badge} · ${done} of ${todays.length} done · ${Math.round(planned / 60 * 10) / 10}h scheduled`}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="panel p-3 space-y-2">
          {todays.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nothing planned yet. Add a task, or adopt a suggestion to drop it straight in here.
            </p>
          )}
          {todays.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-4 p-3.5 rounded-2xl border border-border/40 bg-card shadow-[var(--clay-shadow-sm)] hover:shadow-[var(--clay-shadow)] hover:-translate-y-0.5 transition-all duration-150"
            >
              <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} />
              <div className="w-14 shrink-0 font-display text-sm font-bold tabular-nums">
                {t.start}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${t.done ? "text-muted-foreground line-through opacity-70" : "text-foreground"}`}>
                  {t.title}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border/40 bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground shadow-[var(--clay-shadow-sm)]">
                    {t.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.minutes}m
                  </span>
                  {t.fromSuggestion && <span className="italic text-[11px]">from suggestions</span>}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                onClick={() => removeTask(t.id)}
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="panel p-5">
            <p className="label-xs">Add a task</p>
            <div className="mt-4 space-y-3">
              <div className="grid gap-1.5">
                <Label className="label-xs">Task</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={placeholder}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="label-xs">Start</Label>
                  <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="label-xs">Duration</Label>
                  <Input
                    type="number"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="label-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl shadow-[var(--clay-shadow-sm)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full mt-2" size="lg" onClick={submit}>
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </div>
          </div>

          <div className="panel p-5">
            <p className="label-xs">Timetable</p>
            <div className="mt-4 space-y-1.5">
              {Array.from({ length: 16 }, (_, i) => i + 6).map((hour) => {
                const slot = todays.find((t) => Number(t.start.slice(0, 2)) === hour);
                return (
                  <div key={hour} className="flex items-center gap-3 text-xs">
                    <span className="w-8 text-muted-foreground font-mono tabular-nums">{`${hour}`.padStart(2, "0")}</span>
                    <div
                      className={`h-7 flex-1 rounded-xl px-3 text-[11px] leading-7 transition-all flex items-center justify-between ${
                        slot
                          ? "bg-accent/80 border border-border/60 shadow-[var(--clay-shadow-sm)] font-medium text-foreground"
                          : "bg-input/60 border border-border/20 shadow-[var(--clay-inset)] text-muted-foreground/60"
                      }`}
                    >
                      <span className="truncate">{slot ? slot.title : ""}</span>
                      {slot?.done && <Check className="h-3 w-3 text-foreground shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
