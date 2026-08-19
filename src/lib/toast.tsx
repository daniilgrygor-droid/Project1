import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LeafIcon } from "../components/icons";

type ToastTone = "ok" | "info";

interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

interface ToastCtxValue {
  push: (text: string, tone?: ToastTone) => void;
}

const ToastCtx = createContext<ToastCtxValue>({ push: () => {} });

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((text: string, tone: ToastTone = "ok") => {
    const id = ++idRef.current;
    setToasts((cur) => [...cur, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`} role="status">
            <span className="toast-icon" aria-hidden="true">
              <LeafIcon size={14} />
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}