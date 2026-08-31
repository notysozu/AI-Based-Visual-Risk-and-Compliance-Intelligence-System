import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

const markdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1 className="text-base font-bold text-foreground dark:text-white mt-3 mb-1.5" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-sm font-bold text-foreground dark:text-white mt-3 mb-1.5" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-sm font-semibold text-foreground dark:text-white mt-2.5 mb-1 tracking-tight" {...props} />
  ),
  h4: ({ node, ...props }: any) => (
    <h4 className="text-xs font-semibold text-muted-foreground dark:text-white/70 mt-2 mb-1 uppercase tracking-wider font-mono" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="leading-relaxed my-1.5 text-xs sm:text-sm text-foreground/90 dark:text-white/90" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-xs sm:text-sm text-foreground/90 dark:text-white/90" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-xs sm:text-sm text-foreground/90 dark:text-white/90" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="leading-relaxed pl-1" {...props} />,
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-foreground dark:text-white" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-2 border-[#0071E3] bg-[#0071E3]/5 dark:bg-white/5 pl-3 py-1.5 my-2.5 rounded-r text-xs sm:text-sm text-foreground/90 dark:text-white/80 font-normal italic"
      {...props}
    />
  ),
  // Styled Markdown Tables matching chat screen
  table: ({ node, ...props }: any) => (
    <div className="my-3.5 w-full overflow-x-auto rounded-xl border border-border/70 dark:border-white/10 shadow-xs bg-card/60 dark:bg-white/2">
      <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-muted/80 dark:bg-white/10 text-foreground dark:text-white border-b border-border/70 dark:border-white/10 font-semibold" {...props} />
  ),
  tbody: ({ node, ...props }: any) => (
    <tbody className="divide-y divide-border/40 dark:divide-white/5" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="hover:bg-muted/40 dark:hover:bg-white/5 transition-colors" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-3.5 py-2.5 font-semibold text-xs text-foreground dark:text-white border-r border-border/30 dark:border-white/5 last:border-r-0" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-3.5 py-2.5 text-xs text-foreground/90 dark:text-white/80 border-r border-border/20 dark:border-white/5 last:border-r-0" {...props} />
  ),
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code className="font-mono bg-muted dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-[#0071E3] dark:text-blue-400" {...props} />
    ) : (
      <pre className="font-mono bg-muted/60 dark:bg-black/40 p-3 rounded-xl text-xs overflow-x-auto my-2 border border-border/60 dark:border-white/10 text-foreground dark:text-white/90">
        <code {...props} />
      </pre>
    ),
};

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

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("AI analysis copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const winner = useMemo<"A" | "B" | null>(() => {
    if (recommendedScenario) return recommendedScenario;
    const lower = (content || "").toLowerCase();
    if (lower.includes("choose scenario b") || lower.includes("adopt scenario b") || lower.includes("winner: scenario b") || lower.includes("optimal: scenario b")) {
      return "B";
    }
    if (lower.includes("choose scenario a") || lower.includes("adopt scenario a") || lower.includes("winner: scenario a") || lower.includes("optimal: scenario a")) {
      return "A";
    }
    return null;
  }, [content, recommendedScenario]);

  if (!content) return null;

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
          {winner && (
            <span className="clay-badge-emerald text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="h-3 w-3" /> Recommended: Scenario {winner}
            </span>
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

      {/* Structured Content Area with ReactMarkdown & Table Support */}
      <div className="prose-chat leading-relaxed space-y-2 text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>

      {/* Action Adoption Bar if both adopt callbacks available */}
      {(onAdoptA || onAdoptB) && (
        <div className="mt-4 pt-3.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 bg-muted/20 dark:bg-white/2 p-3.5 rounded-2xl">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Adopt selected trajectory into your active habits & budget:
          </span>
          <div className="flex items-center gap-2">
            {onAdoptA && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3.5 rounded-xl font-bold hover:border-indigo-500"
                onClick={onAdoptA}
              >
                Adopt Scenario A
              </Button>
            )}
            {onAdoptB && (
              <Button
                size="sm"
                className="h-8 text-xs px-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
                onClick={onAdoptB}
              >
                <Zap className="h-3.5 w-3.5 mr-1" /> Adopt Scenario B
              </Button>
            )}
          </div>
        </div>
      )}

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
