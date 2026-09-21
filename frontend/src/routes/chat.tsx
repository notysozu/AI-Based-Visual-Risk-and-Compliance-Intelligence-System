import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useGuard } from "@/lib/use-guard";
import { TwinChat } from "@/components/twin-chat";
import { Skeleton } from "@/components/ui/skeleton";

/** Fullscreen Dedicated Conversational Visual Risk Copilot Route */
export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Visual Risk Copilot — AI-Based Risk & Compliance" },
      { name: "description", content: "Fullscreen conversational simulation engine and personal AI advisor." },
      { property: "og:title", content: "Visual Risk Copilot — AI-Based Risk & Compliance" },
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
  if (!ok) return (
    <AppShell fullBleed={true}>
      <div className="w-full h-full flex flex-col flex-1 p-6 space-y-4 max-w-2xl mx-auto pt-10">
        <div className="flex gap-3 items-end">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-16 w-64 rounded-2xl" />
        </div>
        <div className="flex gap-3 items-end flex-row-reverse">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="flex gap-3 items-end">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-20 w-72 rounded-2xl" />
        </div>
        <div className="flex-1" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </AppShell>
  );


  return (
    <AppShell fullBleed={true}>
      <div className="w-full h-full flex flex-col flex-1">
        <TwinChat fullHeight={true} />
      </div>
    </AppShell>
  );
}
