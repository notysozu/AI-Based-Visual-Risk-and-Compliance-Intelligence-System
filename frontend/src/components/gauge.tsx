import { useMemo } from "react";

type Props = {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: number;
  warning?: boolean;
  animating?: boolean;
  display?: string;
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
}: Props) {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 16;
  const c = 2 * Math.PI * r;
  const dash = useMemo(() => `${(c * pct * 0.75).toFixed(2)} ${c}`, [c, pct]);

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
            className={warning ? "text-amber-500" : "text-foreground"}
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
        </div>
      </div>
      <span className="label-xs mt-3 text-center">{label}</span>
      {sublabel ? (
        <span className="mt-1 text-center text-xs text-muted-foreground">{sublabel}</span>
      ) : null}
    </div>
  );
}
