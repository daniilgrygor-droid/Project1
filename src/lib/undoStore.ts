import { deleteStep } from "./steps";
import type { Step } from "./types";

export const UNDO_WINDOW_MS = 10_000;

type Listener = (state: { step: Step } | null) => void;

let state: { step: Step } | null = null;
let timerId: number | null = null;
const listeners = new Set<Listener>();
const restoreHandlers = new Set<(step: Step) => void>();

function emit() {
  for (const listener of listeners) listener(state);
}

function cancel() {
  if (timerId != null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
}

export function subscribeUndo(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestSoftDelete(step: Step) {
  cancel();
  state = { step };
  emit();
  timerId = window.setTimeout(() => {
    timerId = null;
    state = null;
    emit();
    void deleteStep(step.id);
  }, UNDO_WINDOW_MS);
}

export function undoSoftDelete() {
  if (!state) return;
  const { step } = state;
  cancel();
  state = null;
  emit();
  for (const handler of restoreHandlers) handler(step);
}

export function registerUndoRestore(handler: (step: Step) => void): () => void {
  restoreHandlers.add(handler);
  return () => {
    restoreHandlers.delete(handler);
  };
}
