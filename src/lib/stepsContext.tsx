import { useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./authContext";
import { StepsContext } from "./useSteps";
import type { Step } from "./types";

export function StepsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !session) {
      setSteps(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("steps")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setSteps((data as Step[]) ?? []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addStep = useCallback((step: Step) => {
    setSteps((prev) => (prev ? [step, ...prev] : [step]));
  }, []);

  const updateStep = useCallback((step: Step) => {
    setSteps((prev) =>
      prev ? prev.map((s) => (s.id === step.id ? step : s)) : prev,
    );
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
  }, []);

  return (
    <StepsContext.Provider
      value={{ steps, loading, refresh, addStep, updateStep, removeStep }}
    >
      {children}
    </StepsContext.Provider>
  );
}
