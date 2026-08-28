import { createFileRoute } from "@tanstack/react-router";
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
    <AppShell fullBleed={true}>
      <div className="w-full h-full flex flex-col flex-1">
        <TwinChat fullHeight={true} />
      </div>
    </AppShell>
  );
}
