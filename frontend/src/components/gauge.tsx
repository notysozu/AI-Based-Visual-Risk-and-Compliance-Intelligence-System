import { useMemo, type ComponentType } from "react";
import { TriangleAlert } from "lucide-react";

type Props = {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: number;
  warning?: boolean;
  animating?: boolean;
  display?: string;
  colorScheme?: "default" | "emerald" | "indigo" | "amber" | "purple" | "cyan";
  icon?: ComponentType<{ className?: string }>;
};

export function Gauge({
  value,
  max = 10,
  label,
  sublabel,
  size = 190,
  warning = false,
  animating = false,
  display,
  colorScheme = "default",
  icon: Icon,
}: Props) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 16;
  const c = 2 * Math.PI * r;
  const dash = useMemo(() => `${(c * pct * 0.75).toFixed(2)} ${c}`, [c, pct]);

  const strokeColor = warning
    ? "text-rose-500 dark:text-rose-400"
    : colorScheme === "emerald"
    ? "text-emerald-600 dark:text-emerald-400"
    : colorScheme === "indigo"
    ? "text-indigo-600 dark:text-indigo-400"
    : colorScheme === "amber"
    ? "text-amber-500 dark:text-amber-400"
    : colorScheme === "purple"
    ? "text-purple-600 dark:text-purple-400"
    : colorScheme === "cyan"
    ? "text-cyan-600 dark:text-cyan-400"
    : "text-foreground";

  const badgeClass = warning
    ? "clay-badge-rose"
    : colorScheme === "emerald"
    ? "clay-badge-emerald"
    : colorScheme === "indigo"
    ? "clay-badge-indigo"
    : colorScheme === "purple"
    ? "clay-badge-purple"
    : colorScheme === "amber"
    ? "clay-badge-amber"
    : colorScheme === "cyan"
    ? "clay-badge-cyan"
    : "clay-badge-indigo";

  const dotBgClass = warning
    ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]"
    : colorScheme === "emerald"
    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
    : colorScheme === "indigo"
    ? "bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.7)]"
    : colorScheme === "purple"
    ? "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.7)]"
    : colorScheme === "amber"
    ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]"
    : "bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.7)]";

  return (
    <div className="flex max-w-full flex-col items-center">
      <div
        className={`relative flex items-center justify-center rounded-full p-2.5 bg-input shadow-[var(--clay-inset)] border border-border/40 transition-all ${
          animating ? "animate-pulse-glow" : ""
        }`}
        style={{ width: size + 20, height: size + 20 }}
      >
        <svg width={size} height={size} className="-rotate-[135deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-border/60"
            strokeWidth={12}
            strokeDasharray={`${(c * 0.75).toFixed(2)} ${c}`}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            className={strokeColor}
            strokeWidth={12}
            strokeDasharray={dash}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 700ms cubic-bezier(.34,1.56,.64,1)" }}
          />
        </svg>
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-card shadow-[var(--clay-shadow-sm)] border border-border/40">
          <span className="font-display text-3xl font-bold tabular-nums tracking-tight">
            {display ?? value.toFixed(1)}
          </span>
          {!display && (
            <span className="text-[10px] font-mono text-muted-foreground font-semibold">
              / 10
            </span>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-1.5 font-display text-sm font-bold text-foreground text-center">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span>{label}</span>
      </div>

      {sublabel ? (
        <span className={`mt-1.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${badgeClass}`}>
          {warning ? (
            <TriangleAlert className="h-3 w-3 shrink-0" />
          ) : (
            <span className={`h-2 w-2 rounded-full shrink-0 ${dotBgClass} animate-pulse`} />
          )}
          <span>{sublabel}</span>
        </span>
      ) : null}
    </div>
  );
}
