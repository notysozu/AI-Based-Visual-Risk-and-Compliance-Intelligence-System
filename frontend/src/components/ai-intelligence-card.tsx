import { useState, useMemo } from "react";
import {
  Copy,
  Check,
  Zap,
  TrendingUp,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  title?: string;
  badge?: string;
  content: string;
  probability?: number | null;
  onAdoptA?: () => void;
  onAdoptB?: () => void;
  recommendedScenario?: "A" | "B" | null;
  className?: string;
};

interface ParsedSection {
  title: string;
  type: "scenario_a" | "scenario_b" | "tradeoff" | "choice" | "wealth" | "general";
  lines: string[];
}

export function AIIntelligenceCard({
  title = "Visual Risk AI Intelligence",
  badge = "Neural Model",
  content,
  probability,
  onAdoptA,
  onAdoptB,
  recommendedScenario,
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "verdict" | "scenarios">("all");

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("AI analysis copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse raw markdown into structured sections
  const sections = useMemo<ParsedSection[]>(() => {
    if (!content) return [];

    const rawLines = content.split("\n");
    const parsed: ParsedSection[] = [];
    let currentSection: ParsedSection = {
      title: "Overview",
      type: "general",
      lines: [],
    };

    for (const raw of rawLines) {
      const line = raw.trim();
      if (!line) continue;

      if (line.startsWith("### ") || line.startsWith("#### ")) {
        if (currentSection.lines.length > 0) {
          parsed.push(currentSection);
        }
        const heading = line.replace(/^#{3,4}\s*/, "").replace(/\*\*/g, "");
        const lower = heading.toLowerCase();

        let type: ParsedSection["type"] = "general";
        if (lower.includes("scenario a")) type = "scenario_a";
        else if (lower.includes("scenario b")) type = "scenario_b";
        else if (lower.includes("tradeoff") || lower.includes("comparison")) type = "tradeoff";
        else if (lower.includes("choice") || lower.includes("verdict") || lower.includes("recommendation")) type = "choice";
        else if (lower.includes("wealth") || lower.includes("prediction") || lower.includes("projection")) type = "wealth";

        currentSection = {
          title: heading,
          type,
          lines: [],
        };
      } else {
        currentSection.lines.push(line);
      }
    }

    if (currentSection.lines.length > 0) {
      parsed.push(currentSection);
    }

    return parsed;
  }, [content]);

  // Extract winning scenario if not explicitly provided
  const winner = useMemo<"A" | "B" | null>(() => {
    if (recommendedScenario) return recommendedScenario;
    const lower = content.toLowerCase();
    if (lower.includes("choose scenario b") || lower.includes("adopt scenario b") || lower.includes("winner: scenario b")) {
      return "B";
    }
    if (lower.includes("choose scenario a") || lower.includes("adopt scenario a") || lower.includes("winner: scenario a")) {
      return "A";
    }
    return null;
  }, [content, recommendedScenario]);

  const renderFormattedLine = (line: string, idx: number) => {
    let text = line;
    let isBullet = false;

    if (text.startsWith("- ") || text.startsWith("* ")) {
      isBullet = true;
      text = text.substring(2);
    }

    // Parse **bold** parts
    const parts = [];
    const regex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-bold text-foreground">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 mt-1.5 shrink-0" />
          <div className="flex-1">{parts}</div>
        </div>
      );
    }

    return (
      <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-1">
        {parts}
      </p>
    );
  };

  const filteredSections = useMemo(() => {
    if (activeTab === "verdict") {
      return sections.filter((s) => s.type === "choice" || s.type === "tradeoff" || s.type === "wealth");
    }
    if (activeTab === "scenarios") {
      return sections.filter((s) => s.type === "scenario_a" || s.type === "scenario_b");
    }
    return sections;
  }, [sections, activeTab]);

  return (
    <div className={`panel p-6 border border-border/60 shadow-[var(--clay-shadow)] space-y-5 animate-rise ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-[0_3px_10px_rgba(99,102,241,0.4)]">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm tracking-tight text-foreground">{title}</h3>
              <span className="clay-badge-indigo text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {badge}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Synthesized twin trajectory & behavioral recommendations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sections.some((s) => s.type === "scenario_a" || s.type === "scenario_b") && (
            <div className="flex rounded-xl bg-input p-0.5 border border-border/30 shadow-[var(--clay-inset)] text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "all" ? "bg-card text-foreground shadow-[var(--clay-shadow-sm)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("scenarios")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "scenarios" ? "bg-card text-foreground shadow-[var(--clay-shadow-sm)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Scenarios
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("verdict")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === "verdict" ? "bg-card text-foreground shadow-[var(--clay-shadow-sm)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Verdict
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2.5 rounded-xl shadow-[var(--clay-shadow-sm)] flex items-center gap-1.5 hover:border-foreground/40"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="space-y-3.5">
        {filteredSections.map((sec, idx) => {
          const isA = sec.type === "scenario_a";
          const isB = sec.type === "scenario_b";
          const isChoice = sec.type === "choice";
          const isTradeoff = sec.type === "tradeoff";

          const cardStyle = isA
            ? "border-indigo-500/30 bg-indigo-500/[0.04]"
            : isB
            ? "border-emerald-500/30 bg-emerald-500/[0.04]"
            : isChoice
            ? "border-purple-500/40 bg-gradient-to-br from-purple-500/[0.06] via-purple-500/[0.02] to-transparent"
            : isTradeoff
            ? "border-amber-500/30 bg-amber-500/[0.03]"
            : "border-border/40 bg-input/40";

          const badgeClass = isA
            ? "clay-badge-indigo"
            : isB
            ? "clay-badge-emerald"
            : isChoice
            ? "clay-badge-purple"
            : isTradeoff
            ? "clay-badge-amber"
            : "clay-badge-indigo";

          return (
            <div
              key={idx}
              className={`rounded-2xl border p-4 shadow-[var(--clay-inset)] transition-all ${cardStyle}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full tracking-wider ${badgeClass}`}>
                    {sec.title}
                  </span>
                </div>

                {isChoice && winner && (
                  <span className="clay-badge-emerald text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Optimal: Scenario {winner}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 mt-2">
                {sec.lines.map((l, lIdx) => renderFormattedLine(l, lIdx))}
              </div>

              {/* Action buttons inside Choice card */}
              {isChoice && (
                <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Adopt this optimal roadmap into your active habits:
                  </span>
                  <div className="flex items-center gap-2">
                    {onAdoptA && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-3 rounded-xl font-bold hover:border-indigo-500"
                        onClick={onAdoptA}
                      >
                        Adopt Scenario A
                      </Button>
                    )}
                    {onAdoptB && (
                      <Button
                        size="sm"
                        className="h-7 text-[11px] px-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
                        onClick={onAdoptB}
                      >
                        <Zap className="h-3 w-3 mr-1" /> Adopt Scenario B
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Probability footer badge if available */}
      {probability !== null && probability !== undefined && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-input border border-border/40 shadow-[var(--clay-inset)] text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">Monte Carlo Simulation Success Odds:</span>
          </div>
          <span className="clay-badge-emerald px-2.5 py-0.5 rounded-full font-bold text-xs">
            {Math.round(probability * 100)}% Confidence
          </span>
        </div>
      )}
    </div>
  );
}
