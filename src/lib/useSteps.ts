import { createContext, useContext } from "react";
import type { Step } from "./types";

export interface StepsState {
  steps: Step[] | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addStep: (step: Step) => void;
  updateStep: (step: Step) => void;
  removeStep: (id: string) => void;
}

export const StepsContext = createContext<StepsState | null>(null);

export function useSteps() {
  const ctx = useContext(StepsContext);
  if (!ctx) throw new Error("useSteps must be used within StepsProvider");
  return ctx;
}
