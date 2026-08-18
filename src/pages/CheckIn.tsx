import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { saveStep } from "../lib/ai";
import { type Category, type Step } from "../lib/types";
import AppShell from "../components/AppShell";
import PraiseCard from "../components/PraiseCard";
import CategoryPicker from "../components/CategoryPicker";
import MoodPicker from "../components/MoodPicker";
import EntryCard from "../components/EntryCard";
import SproutLoader from "../components/SproutLoader";
import PlantIcon from "../components/PlantIcon";
import { plantStageFor } from "../lib/constants";
import { LeafIcon } from "../components/icons";
import { useCountUp } from "../lib/useCountUp";
import { smallStepsNoticed } from "../lib/copy";
import { registerUndoRestore } from "../lib/undoStore";

const MAX_FEED = 100;

const DRAFT_KEY = "ss-checkin-draft";

interface Draft {
  date: string;
  note: string;
}

function readDraft(): string {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return "";
    const draft = JSON.parse(raw) as Draft;
    const today = new Date().toISOString().slice(0, 10);
    if (draft.date !== today) return "";
    return draft.note;
  } catch {
    return "";
  }
}

function writeDraft(note: string) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ date: today, note }));
  } catch {
    /* storage unavailable — skip */
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable — skip */
  }
}

type ButtonState = "idle" | "saving" | "saved";

export default function CheckIn() {
  const [note, setNote] = useState(() => readDraft());
  const noteRef = useRef(note);
  noteRef.current = note;
  const draftTimer = useRef<number | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [btnState, setBtnState] = useState<ButtonState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [latest, setLatest] = useState<Step | null>(null);
  const [fallback, setFallback] = useState<string | undefined>(undefined);
  const [showPraise, setShowPraise] = useState(true);
  const [newStepId, setNewStepId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(false);
  const [typing, setTyping] = useState(false);

  const feedCount = steps?.length ?? 0;
  const animatedCount = useCountUp(feedCount);

  const handleNoteChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNote(value);
    if (draftTimer.current != null) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => writeDraft(value), 500);
  };

  useEffect(() => {
    return () => {
      if (draftTimer.current != null) {
        window.clearTimeout(draftTimer.current);
        writeDraft(noteRef.current);
      }
    };
  }, []);

  const loadSteps = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("steps")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_FEED);
    if (!error) setSteps((data as Step[]) ?? []);
  }, []);

  useEffect(() => {
    void loadSteps();
  }, [loadSteps]);

  useEffect(
    () =>
      registerUndoRestore((restored) => {
        setSteps((prev) => {
          if (!prev) return prev;
          if (prev.some((s) => s.id === restored.id)) return prev;
          return [...prev, restored].sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
        });
      }),
    [],
  );

  useEffect(() => {
    if (steps && steps.length > 0 && !latest) setLatest(steps[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const doSubmit = async (showedUp: boolean) => {
    if (submitting) return;
    if (!showedUp && !note.trim()) return;

    setSubmitting(true);
    setBtnState("saving");
    setError(null);
    setFallback(undefined);
    if (!showedUp && note.trim()) setTyping(true);

    const res = await saveStep(note, showedUp, { category, mood });
    setSubmitting(false);
    setTyping(false);

    if (!res.ok) {
      setBtnState("idle");
      if (res.reason === "not-configured") {
        setError(
          "The database isn't connected yet. Add your Supabase keys to .env — see README."
        );
      } else {
        setError(res.message ?? "Couldn't save it. Give it another try.");
      }
      return;
    }

    const saved = res.step;
    if (saved) {
      setSteps((prev) => [saved, ...(prev ?? [])]);
      setLatest(saved);
      setNewStepId(saved.id);
      setShowPraise(false);
      setBtnState("saved");
      setFeedback(true);
      window.setTimeout(() => setBtnState("idle"), 700);
      window.setTimeout(() => setShowPraise(true), 260);
      window.setTimeout(() => setFeedback(false), 2200);
    } else {
      setBtnState("idle");
    }
    if (res.aiFailed) setFallback(res.message);
    clearDraft();
    setNote("");
    setCategory(null);
    setMood(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void doSubmit(false);
  };

  const feedLoaded = steps !== null;
  const empty = feedLoaded && steps.length === 0;
  const stage = plantStageFor(steps?.length ?? 0) ?? null;

  return (
    <AppShell>
      <div className="checkin">
        <div className="checkin-head">
          <div className="checkin-date">{today}</div>
          <h1>What's one small thing you did today?</h1>
          <p>
            Any step counts — even the one that felt like “nothing”. Write it
            down, and I'll respond. Or just let me know you showed up.
          </p>
          {stage && (
            <Link
              to="/growth"
              className="growth-chip"
              aria-label="See how your plant is growing"
            >
              <span className="growth-chip-badge">
                <PlantIcon size={40} />
              </span>
              <span className="growth-chip-label">
                {stage.label}
                {stage.description && (
                  <span className="growth-chip-desc">
                    {stage.description}
                  </span>
                )}
              </span>
            </Link>
          )}
        </div>

        <form className="checkin-form" onSubmit={submit}>
          <div className="field">
            <label className="visually-hidden" htmlFor="step-note">
              What did you do today
            </label>
            <textarea
              id="step-note"
              className="textarea"
              placeholder="e.g. went outside for 10 minutes"
              value={note}
              onChange={handleNoteChange}
              disabled={submitting}
              maxLength={2000}
              rows={4}
            />
          </div>

          <CategoryPicker value={category} onChange={setCategory} />
          <MoodPicker value={mood} onChange={setMood} />

          <div className="checkin-actions">
            <button
              type="submit"
              className={`btn btn--primary checkin-submit${
                btnState === "saved" ? " btn--saved" : ""
              }`}
              disabled={submitting || !note.trim()}
            >
              {submitting && (
                <span className="btn-dot" aria-hidden="true" />
              )}
              {submitting ? "Holding it…" : btnState === "saved" ? "Noticed" : "Mark it"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={submitting}
              onClick={() => void doSubmit(true)}
            >
              I showed up today
            </button>
          </div>

          {submitting && (
            <p className="warm-loading" aria-live="polite">
              {note.trim() ? "reading what you wrote…" : "noting that you showed up…"}
            </p>
          )}
          {feedback && (
            <p className="step-feedback" aria-live="polite">
              <LeafIcon size={13} />
              One small step counts.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>

        {typing ? (
          <PraiseCard
            note={note.trim()}
            response={null}
            typing
            category={category}
            mood={mood}
          />
        ) : (
          showPraise &&
          latest && (
            <PraiseCard
              note={latest.note}
              response={latest.ai_response}
              fallback={fallback}
              category={latest.category}
              mood={latest.mood}
            />
          )
        )}

        {feedCount > 0 && (
          <p className="steps-count">{smallStepsNoticed(animatedCount)}</p>
        )}

        <section className="feed" aria-label="Your small steps">
          <div className="feed-head">
            <h2>Your small steps</h2>
            <p>Everything you've marked, newest first.</p>
          </div>

          {!feedLoaded && <SproutLoader />}

          {empty && (
            <div className="steps-empty steps-empty--story">
              <p>
                Nothing here yet. And that's okay — your story starts with one
                small step.
              </p>
            </div>
          )}

          {steps && steps.length > 0 && (
            <ul className="steps-list">
              {steps.map((step) => (
                <EntryCard
                  key={step.id}
                  step={step}
                  className={step.id === newStepId ? "step-item--new" : undefined}
                  onChanged={(updated) =>
                    setSteps((prev) =>
                      (prev ?? []).map((s) => (s.id === updated.id ? updated : s)),
                    )
                  }
                  onDeleted={(id) =>
                    setSteps((prev) => (prev ?? []).filter((s) => s.id !== id))
                  }
                />
              ))}
            </ul>
          )}

          <p className="steps-reassure">
            Missed a day? That's okay. There's no rush here.
          </p>
        </section>
      </div>
    </AppShell>
  );
}