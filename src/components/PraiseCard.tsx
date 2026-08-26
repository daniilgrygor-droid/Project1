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
}

export default function PraiseCard({
  note,
  response,
  fallback,
  category = null,
  mood = null,
  typing = false,
  hideNote = false,
}: PraiseCardProps) {
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
          response
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
