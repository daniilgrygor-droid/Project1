import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import type { Category, Step } from "../lib/types";
import { dayLabel, moodEmoji, MOOD_LABEL, timeLabel } from "../lib/constants";
import { relativeDate } from "../lib/types";
import { CATEGORY_LABEL } from "../lib/constants";
import { updateStep } from "../lib/steps";
import { requestSoftDelete } from "../lib/undoStore";
import { CategoryIcon, PencilIcon, SunIcon } from "./icons";
import CategoryPicker from "./CategoryPicker";
import MoodPicker from "./MoodPicker";

interface EntryCardProps {
  step: Step;
  onChanged: (step: Step) => void;
  onDeleted: (id: string) => void;
  defaultExpanded?: boolean;
  showTime?: boolean;
  className?: string;
  inlineReply?: boolean;
  style?: CSSProperties;
}

export default function EntryCard({
  step,
  onChanged,
  onDeleted,
  defaultExpanded = false,
  showTime = false,
  className,
  inlineReply = false,
  style,
}: EntryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [note, setNote] = useState(step.note);
  const [category, setCategory] = useState<Category | null>(step.category);
  const [mood, setMood] = useState<number | null>(step.mood);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorDetail, setSaveErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setNote(step.note);
      setCategory(step.category);
      setMood(step.mood);
    }
  }, [step, editing]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const value = note.trim();
    if (!value || busy) return;
    setBusy(true);
    setSaveError(null);
    setSaveErrorDetail(null);
    try {
      const res = await updateStep(step.id, {
        note: value,
        category,
        mood,
      });
      if (res.ok && res.step) {
        onChanged(res.step);
        setEditing(false);
      } else {
        setSaveError("Couldn't save this step. Please try again.");
        setSaveErrorDetail(res.error ?? "unknown error");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (busy) return;
    requestSoftDelete(step);
    onDeleted(step.id);
  };

  const metaLine = showTime
    ? `${dayLabel(step.created_at)} · ${timeLabel(step.created_at)}`
    : relativeDate(step.created_at);

  return (
    <li
      style={style}
      className={`step-item spot-card${expanded ? " step-item--expanded" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="step-body">
        <div className="step-meta">
          <span>{metaLine}</span>
          {!editing && (
            <span className="step-meta-side">
              {step.showed_up_only ? (
                <span className="step-meta-mark" title="Showed up today">
                  <SunIcon size={14} />
                </span>
              ) : (
                <>
                  {step.category ? (
                    <span
                      className="step-meta-mark"
                      title={CATEGORY_LABEL[step.category]}
                    >
                      <CategoryIcon category={step.category} size={14} />
                    </span>
                  ) : null}
                  {step.mood != null ? (
                    <span className="step-meta-mark" title={MOOD_LABEL[step.mood]}>
                      {moodEmoji(step.mood)}
                    </span>
                  ) : null}
                </>
              )}
              <button
                type="button"
                className="step-remove"
                aria-label="More actions"
                onClick={() => setExpanded((v) => !v)}
              >
                ···
              </button>
            </span>
          )}
        </div>

        <div className="step-note">{step.showed_up_only ? "showed up today" : step.note}</div>

        {inlineReply && step.ai_response && (
          <div className="step-ai">
            <em>{step.ai_response}</em>
          </div>
        )}

        {expanded && !editing && (
          <div className="step-detail">
            {step.ai_response && (
              <div className="step-ai">
                <em>{step.ai_response}</em>
              </div>
            )}
            <div className="step-actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setNote(step.note);
                  setCategory(step.category);
                  setMood(step.mood);
                  setEditing(true);
                }}
              >
                <PencilIcon size={14} />
                Edit
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm step-delete-btn"
                onClick={remove}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {editing && (
          <form className="step-edit" onSubmit={save}>
            <label className="visually-hidden" htmlFor={`edit-note-${step.id}`}>
              Edit entry
            </label>
            <textarea
              id={`edit-note-${step.id}`}
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={2000}
            />
            <CategoryPicker value={category} onChange={setCategory} />
            <MoodPicker value={mood} onChange={setMood} />
            <div className="step-actions">
              <button type="submit" className="btn btn--primary" disabled={busy || !note.trim()}>
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setEditing(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
            {saveError && (
              <p className="form-error" role="alert">
                {saveError}
                {saveErrorDetail && (
                  <span className="form-error-detail"> ({saveErrorDetail})</span>
                )}
              </p>
            )}
          </form>
        )}
      </div>
    </li>
  );
}