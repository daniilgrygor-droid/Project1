import { useEffect, useState } from "react";
import { CategoryIcon, LeafIcon, SproutIcon } from "./icons";
import { CATEGORY_LABEL, MOOD_LABEL, moodEmoji } from "../lib/constants";
import type { Category } from "../lib/types";

interface PraiseCardProps {
  note: string;
  response: string | null;
  fallback?: string;
  category?: Category | null;
  mood?: number | null;
  /** While an AI reply is being written, show a quiet typing indicator. */
  typing?: boolean;
  /** True while the note is still flying in — keeps its seat empty. */
  hideNote?: boolean;
  /** True right after a fresh submission — the reply types itself in. */
  typeResponse?: boolean;
  /** Called once the typewriter has finished (or was skipped). */
  onTyped?: () => void;
}

export default function PraiseCard({
  note,
  response,
  fallback,
  category = null,
  mood = null,
  typing = false,
  hideNote = false,
  typeResponse = false,
  onTyped,
}: PraiseCardProps) {
  const [shown, setShown] = useState(() => response?.length ?? 0);

  // Typewriter for a freshly arrived reply: eases out so it starts brisk
  // and settles calmly. Full text stays available to screen readers.
  useEffect(() => {
    if (!response) {
      setShown(0);
      return;
    }
    if (!typeResponse) {
      setShown(response.length);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(response.length);
      onTyped?.();
      return;
    }

    setShown(0);
    const total = response.length;
    const duration = Math.min(4200, Math.max(1400, total * 18));
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 2);
      const n = Math.round(total * eased);
      setShown(n);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setShown(total);
        onTyped?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeResponse, response]);

  const isTyping = typeResponse && response != null && shown < response.length;

  return (
    <section className="praise praise--enter" aria-live="polite">
      <div className="praise-head">
        <SproutIcon size={18} />
        A personal reply
        {category || mood != null ? (
          <span className="praise-marks">
            {category ? (
              <span className="praise-mark" title={CATEGORY_LABEL[category]}>
                <CategoryIcon category={category} size={14} />
              </span>
            ) : null}
            {mood != null ? (
              <span className="praise-mark" title={MOOD_LABEL[mood]}>
                {moodEmoji(mood)}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
      <blockquote className="praise-note">
        <span className="praise-note-leaf">
          <LeafIcon size={14} />
        </span>
        <span className={`praise-note-text${hideNote ? " praise-note-text--veiled" : ""}`}>
          «{note}»
        </span>
      </blockquote>
      <div className="praise-text">
        {typing ? (
          <div className="praise-text--typing">
            <span className="typing-dots" aria-hidden="true">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
            <span className="visually-hidden">Writing a reply…</span>
          </div>
        ) : response ? (
          <>
            <span aria-hidden="true">{response.slice(0, shown)}</span>
            <span className="visually-hidden">{response}</span>
            {isTyping && <span className="type-caret" aria-hidden="true" />}
          </>
        ) : (
          <span className="praise-fallback">
            {fallback ??
              "Thank you for sharing that — sit with it for a moment."}
          </span>
        )}
      </div>
    </section>
  );
}
