
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTwin } from "@/lib/twin-store";

export function useGuard(): boolean {
  const { state, ready } = useTwin();
  const navigate = useNavigate();
  const signedIn = (Boolean(state.profile.id) || state.authed) && state.profile.onboarded;

  useEffect(() => {
    if (ready && !signedIn) {
      navigate({ to: "/login" });
    }
  }, [ready, signedIn, navigate]);

  return ready && signedIn;
}