import { useEffect, useState } from "react";
import { subscribeUndo, undoSoftDelete } from "../lib/undoStore";
import type { Step } from "../lib/types";

export default function UndoToast() {
  const [pending, setPending] = useState<{ step: Step } | null>(null);

  useEffect(() => subscribeUndo(setPending), []);

  return (
    <div
      className={`undo-toast${pending ? " undo-toast--visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      {pending && (
        <>
          <span className="undo-toast-text">
            Remove this step? You can always write a new one.
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm undo-toast-btn"
            onClick={undoSoftDelete}
          >
            Undo
          </button>
        </>
      )}
    </div>
  );
}
