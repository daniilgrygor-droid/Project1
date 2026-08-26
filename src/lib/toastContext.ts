import { createContext, useContext } from "react";

export type ToastTone = "ok" | "info";

export interface ToastCtxValue {
  push: (text: string, tone?: ToastTone) => void;
}

export const ToastCtx = createContext<ToastCtxValue>({ push: () => {} });

export const useToast = () => useContext(ToastCtx);
