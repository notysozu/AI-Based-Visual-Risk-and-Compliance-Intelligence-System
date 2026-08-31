
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTwin } from "@/lib/twin-store";

export function useGuard(): boolean {
  const { state, ready } = useTwin();
  const navigate = useNavigate();
  const isAuthed = Boolean(state.profile.id) || state.authed;
  const isOnboarded = state.profile.onboarded;

  useEffect(() => {
    if (ready) {
      if (!isAuthed) {
        navigate({ to: "/login" });
      } else if (!isOnboarded) {
        navigate({ to: "/setup" });
      }
    }
  }, [ready, isAuthed, isOnboarded, navigate]);

  return ready && isAuthed && isOnboarded;
}