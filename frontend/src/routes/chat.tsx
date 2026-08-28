import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Sparkles, Split, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { useGuard } from "@/lib/use-guard";
import { TwinChat } from "@/components/twin-chat";

/** Fullscreen Dedicated Conversational Digital Twin Copilot Route */
export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Twin Copilot — Digital Twin AI" },
      { name: "description", content: "Fullscreen conversational simulation engine and personal AI advisor." },
      { property: "og:title", content: "Twin Copilot — Digital Twin AI" },
      {
        property: "og:description",
        content: "Fullscreen conversational simulation engine and personal AI advisor.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const ok = useGuard();
  if (!ok) return null;

  return (
    <AppShell
      title="Twin Copilot"
      subtitle="Fullscreen Conversational Simulation & Decision Intelligence"
      actions={
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-xl">
            <Link to="/simulator">
              <Split className="h-3.5 w-3.5 text-rose-500" />
              <span>Simulator</span>
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-xl">
            <Link to="/wealth">
              <Wallet className="h-3.5 w-3.5 text-emerald-500" />
              <span>Wealth Engine</span>
            </Link>
          </Button>
        </div>
      }
    >
      <div className="w-full">
        <TwinChat fullHeight={true} />
      </div>
    </AppShell>
  );
}
