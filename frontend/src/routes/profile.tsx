import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useGuard } from "@/lib/use-guard";
import { money, useTwin, type Profile } from "@/lib/twin-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Goals — Visual Risk AI (VRCI)" },
      { name: "description", content: "Your stored answers, goals and app preferences." },
      { property: "og:title", content: "Profile & Goals — Visual Risk AI (VRCI)" },
      { property: "og:description", content: "Your stored answers, goals and app preferences." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const ok = useGuard();
  const navigate = useNavigate();
  const { state, updateProfile, setTheme, reset, loadDemo } = useTwin();
  const [draft, setDraft] = useState<Profile>(state.profile);
  if (!ok) return null;

  const p = state.profile;

  return (
    <AppShell title="Profile & Goals" subtitle="Everything your twin models about your daily routine.">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="panel p-6 sm:p-8">
          <p className="label-xs">Active Goals & Focus</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["goalName", "Goal name", "text"],
                ["goalCurrent", "Saved so far ($)", "number"],
                ["goalTarget", "Goal target ($)", "number"],
                ["focusArea", "Primary life / work focus", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className="grid gap-1.5">
                <Label className="label-xs">{label}</Label>
                <Input
                  type={type}
                  value={String(draft[key])}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: type === "number" ? Number(e.target.value) : e.target.value })
                  }
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-6"
            size="lg"
            onClick={() => {
              updateProfile(draft);
              toast.success("Profile updated");
            }}
          >
            Save changes
          </Button>

          <div className="mt-8 grid gap-3 border-t border-border/50 pt-6 sm:grid-cols-3">
            <Read label="Net worth" value={money(p.netWorth)} variant="emerald" />
            <Read label="Target" value={`${money(p.targetNetWorth)} by ${p.targetAge}`} variant="indigo" />
            <Read label="Savings rate" value={`${p.savingsRate}%`} variant="emerald" />
            <Read label="Sleep" value={`${p.sleepHours}h`} variant="indigo" />
            <Read label="Study / Upskill" value={`${p.studyHours}h / week`} variant="purple" />
            <Read label="Screen time" value={`${p.screenTime}h / day`} variant="amber" />
          </div>
        </div>

        <div className="space-y-5">
          {/* Persona Badge Tile */}
          <div className="panel p-6">
            <p className="label-xs">Persona Profile</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold font-display text-lg shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
                {(p.name || "T")[0].toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-sm">{p.name || "Visual Risk AI"}</h4>
                <span className={`inline-block mt-0.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full capitalize ${
                  p.role === "student"
                    ? "clay-badge-purple"
                    : p.role === "professional"
                    ? "clay-badge-indigo"
                    : p.role === "freelancer"
                    ? "clay-badge-amber"
                    : p.role === "entrepreneur"
                    ? "clay-badge-rose"
                    : "clay-badge-emerald"
                }`}>
                  {p.role}
                </span>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <p className="label-xs">Appearance</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Dark mode</span>
              <Switch
                checked={state.theme === "dark"}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              />
            </div>
          </div>

          <div className="panel space-y-3 p-6">
            <p className="label-xs">Twin Data Management</p>
            <Button variant="outline" className="w-full justify-center" onClick={() => navigate({ to: "/setup" })}>
              Re-run setup questions
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                loadDemo();
                toast.success("Demo twin reloaded");
              }}
            >
              Reload Default Demo Twin
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              onClick={() => {
                reset();
                toast.success("All local data cleared");
                navigate({ to: "/" });
              }}
            >
              Erase all local data
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Read({
  label,
  value,
  variant = "indigo",
}: {
  label: string;
  value: string;
  variant?: "emerald" | "indigo" | "purple" | "amber" | "rose" | "cyan";
}) {
  const dotColor =
    variant === "emerald"
      ? "bg-emerald-500"
      : variant === "indigo"
      ? "bg-indigo-500"
      : variant === "purple"
      ? "bg-purple-500"
      : variant === "amber"
      ? "bg-amber-500"
      : variant === "rose"
      ? "bg-rose-500"
      : "bg-cyan-500";

  return (
    <div className="rounded-2xl bg-card p-3.5 border border-border/50 shadow-[var(--clay-shadow-sm)]">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <p className="label-xs">{label}</p>
      </div>
      <p className="mt-1 font-display text-sm font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
