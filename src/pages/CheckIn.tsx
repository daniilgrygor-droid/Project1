import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { saveStep } from "../lib/ai";
import { useAuth } from "../lib/authContext";
import { type Category, type Step } from "../lib/types";
import AppShell from "../components/AppShell";
import PraiseCard from "../components/PraiseCard";
import CategoryPicker from "../components/CategoryPicker";
import MoodPicker from "../components/MoodPicker";
import EntryCard from "../components/EntryCard";
import PlantIcon from "../components/PlantIcon";
import Plant from "../components/Plant";
import Tour from "../components/Tour";
import { plantStageFor, dayKey } from "../lib/constants";
import { LeafIcon, SproutIcon, SunIcon } from "../components/icons";
import { useCountUp } from "../lib/useCountUp";
import { useTypewriter } from "../lib/useTypewriter";
import { useToast } from "../lib/toastContext";
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

/* Quiet phrases shown while the reply is being written — one at a time,
   no percentages, no countdowns. */
const TYPING_HINTS = [
  "reading what you wrote…",
  "finding the right words…",
  "letting the reply settle…",
];

const SHOWED_UP_HINTS = [
  "noting that you showed up…",
  "holding that moment…",
];

export default function CheckIn() {
  const { profile } = useAuth();
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
  const toast = useToast();
  const [fallback, setFallback] = useState<string | undefined>(undefined);
  const [showPraise, setShowPraise] = useState(true);
  const [newStepId, setNewStepId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [flight, setFlight] = useState<{ text: string } | null>(null);
  const [noteRevealed, setNoteRevealed] = useState(true);
  const [typeReply, setTypeReply] = useState(false);
  const [overlay, setOverlay] = useState<null | {
    note: string;
    response: string | null;
    category: Category | null;
    mood: number | null;
  }>(null);
  const overlayTimer = useRef<number | null>(null);

  const closeOverlay = useCallback(() => {
    if (overlayTimer.current) {
      window.clearTimeout(overlayTimer.current);
      overlayTimer.current = null;
    }
    setOverlay(null);
    setTypeReply(false);
  }, []);

  // Once the reply has finished typing itself in, let the moment breathe,
  // then return to the page. Skip is always available.
  const onOverlayTyped = useCallback(() => {
    overlayTimer.current = window.setTimeout(closeOverlay, 2400);
  }, [closeOverlay]);

  useEffect(() => {
    if (!overlay) return;
    document.body.style.overflow = "hidden";
    if (!overlay.response && !fallback) {
      // Nothing to type out — let the moment breathe, then return.
      overlayTimer.current = window.setTimeout(closeOverlay, 2400);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [overlay, closeOverlay, fallback]);

  useEffect(
    () => () => {
      if (overlayTimer.current) window.clearTimeout(overlayTimer.current);
    },
    [],
  );

  const hints = note.trim() ? TYPING_HINTS : SHOWED_UP_HINTS;

  useEffect(() => {
    if (!submitting) {
      setHintIdx(0);
      return;
    }
    const t = window.setInterval(
      () => setHintIdx((i) => (i + 1) % hints.length),
      1800,
    );
    return () => window.clearInterval(t);
  }, [submitting, hints.length]);

  // The note's journey: a clone lifts off from the textarea and settles
  // into its quoted seat in the reply card. FLIP-style, WAAPI-driven.
  useEffect(() => {
    if (!flight) return;
    let raf = 0;
    let clone: HTMLSpanElement | null = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      clone?.remove();
      setFlight(null);
      setNoteRevealed(true);
    };

    const start = () => {
      if (done) return;
      const target = document.querySelector<HTMLElement>(".praise-note-text");
      if (!target) {
        // Card never appeared (save failed) — just let the seat fill.
        finish();
        return;
      }
      const tr = target.getBoundingClientRect();
      const sr = textareaRef.current?.getBoundingClientRect();
      if (!sr || !tr.width) {
        finish();
        return;
      }
      clone = document.createElement("span");
      clone.className = "flight-clone";
      clone.textContent = flight.text;
      clone.style.left = `${tr.left}px`;
      clone.style.top = `${tr.top}px`;
      clone.style.width = `${tr.width}px`;
      document.body.appendChild(clone);
      const anim = clone.animate(
        [
          {
            transform: `translate(${sr.left - tr.left}px, ${sr.top - tr.top}px) scale(${Math.max(0.35, sr.width / tr.width)}, ${Math.max(0.2, sr.height / tr.height)})`,
            opacity: 0.55,
          },
          { transform: "none", opacity: 1 },
        ],
        { duration: 700, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
      );
      anim.onfinish = finish;
      anim.oncancel = finish;
    };

    raf = requestAnimationFrame(start);
    return () => {
      cancelAnimationFrame(raf);
      if (!done) {
        done = true;
        clone?.remove();
      }
    };
  }, [flight]);

  const feedCount = steps?.length ?? 0;
  const animatedCount = useCountUp(feedCount);
  const weekCount = steps
    ? steps.filter(
        (s) => Date.now() - new Date(s.created_at).getTime() < 7 * 86400000,
      ).length
    : 0;
  const activeDays = steps
    ? new Set(steps.map((s) => s.created_at.slice(0, 10))).size
    : 0;

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
    if (!showedUp && note.trim()) {
      setTyping(true);
      // Send the note flying from the textarea to its seat in the card.
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setNoteRevealed(false);
        setFlight({ text: note.trim() });
      }
    }

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
      setTypeReply(true);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setOverlay({
          note: saved.note ?? "",
          response: saved.ai_response,
          category: saved.category ?? null,
          mood: saved.mood ?? null,
        });
      }
      window.setTimeout(() => setBtnState("idle"), 700);
      window.setTimeout(() => setShowPraise(true), 260);
      window.setTimeout(() => setFeedback(false), 2200);
    } else {
      setBtnState("idle");
    }
    if (res.aiFailed) setFallback(res.message);
    clearDraft();
    toast.push(showedUp ? "Noted. That counts." : "Noticed. That counts.");
    (window as any).plausible?.("checkin", { props: { showedUp: String(showedUp), category: category ?? "none", mood: mood ? String(mood) : "none" } });
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
  const markedToday = latest
    ? dayKey(latest.created_at) === dayKey(new Date().toISOString())
    : false;
  const returnGap = useMemo(() => {
    if (!latest) return 0;
    const last = dayKey(latest.created_at);
    const todayKey = dayKey(new Date().toISOString());
    if (last >= todayKey) return 0;
    return Math.round(
      (Date.parse(todayKey) - Date.parse(last)) / 86400000,
    );
  }, [latest]);
  const hour = new Date().getHours();
  const overlayText = overlay ? overlay.response ?? fallback ?? null : null;
  const typedReply = useTypewriter(overlayText, typeReply, onOverlayTyped);
  const overlayTyping =
    typeReply && overlayText != null && typedReply < overlayText.length;
  const greeting =
    hour < 5
      ? "Resting well"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";

  return (
    <AppShell>
      <Tour />
      {overlay && (
        <div
          className="reply-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="A conversation about your step"
        >
          <div className="chat-thread">
            {overlay.note && (
              <div
                className="chat-bubble chat-bubble--me"
                style={{ animationDelay: ".1s" }}
              >
                {overlay.note}
              </div>
            )}
            <div
              className="chat-bubble chat-bubble--ai"
              style={{ animationDelay: ".55s" }}
            >
              <span className="chat-avatar" aria-hidden="true">
                <SproutIcon size={13} />
              </span>
              <span className="chat-text">
                <span aria-hidden="true">
                  {(overlayText ?? "").slice(0, typedReply)}
                </span>
                <span className="visually-hidden">{overlayText}</span>
                {overlayTyping && (
                  <span className="type-caret" aria-hidden="true" />
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="reply-skip"
            onClick={closeOverlay}
            autoFocus
          >
            Skip
          </button>
        </div>
      )}
      <div className="checkin">
        <div className="checkin-head">
          <div className="checkin-date">{today}</div>
          <span className="head-eyebrow">
            <SproutIcon size={13} />
            {greeting}
            {profile?.name ? `, ${profile.name}` : ""}
          </span>
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

        {markedToday && (
          <p className="today-done">
            <LeafIcon size={13} />
            Already noticed today — anything else counts too.
          </p>
        )}

        {returnGap >= 2 && (
          <p className="welcome-back">
            <SproutIcon size={14} />
            Welcome back. It's been {returnGap} days since your last step —
            that quiet return counts too.
          </p>
        )}

        {feedCount > 0 && (
          <div className="reflect-grid checkin-stats" aria-label="A quick summary">
            <div className="reflect-tile spot-card">
              <span className="reflect-tile-icon">
                <SproutIcon size={15} />
              </span>
              <span className="reflect-tile-number">{animatedCount}</span>
              <span className="reflect-tile-label">Small steps</span>
            </div>
            <div className="reflect-tile spot-card">
              <span className="reflect-tile-icon">
                <SunIcon size={15} />
              </span>
              <span className="reflect-tile-number">{weekCount}</span>
              <span className="reflect-tile-label">This week</span>
            </div>
            <div className="reflect-tile spot-card">
              <span className="reflect-tile-icon">
                <LeafIcon size={15} />
              </span>
              <span className="reflect-tile-number">{activeDays}</span>
              <span className="reflect-tile-label">Active days</span>
            </div>
            <div className="reflect-tile spot-card">
              <span className="reflect-tile-icon">
                <PlantIcon size={15} />
              </span>
              <span className="reflect-tile-number reflect-tile-number--text">
                {stage?.label ?? "A seed"}
              </span>
              <span className="reflect-tile-label">Your plant</span>
            </div>
          </div>
        )}

        <form className="checkin-form spot-card" onSubmit={submit}>
          <div className="field">
            <label className="visually-hidden" htmlFor="step-note">
              What did you do today
            </label>
            <textarea
              id="step-note"
              ref={textareaRef}
              className="textarea"
              placeholder="e.g. went outside for 10 minutes"
              value={note}
              onChange={handleNoteChange}
              disabled={submitting}
              maxLength={2000}
              rows={4}
            />
            {note.length > 0 && (
              <span className="char-count" aria-live="polite">
                {note.length}/2000
              </span>
            )}
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
              {submitting ? "Holding it…" : btnState === "saved" ? (
                <>
                  <LeafIcon size={15} />
                  Noticed
                </>
              ) : (
                "Mark it"
              )}
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
            <div className="warm-loading" aria-live="polite">
              <span key={hintIdx} className="warm-loading-text">
                {hints[hintIdx % hints.length]}
              </span>
              <span className="warm-loading-line" aria-hidden="true" />
            </div>
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
            hideNote={!noteRevealed}
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
              hideNote={!noteRevealed}
              typeResponse={typeReply}
              onTyped={() => setTypeReply(false)}
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

          {!feedLoaded && (
            <div className="sk-feed" aria-busy="true" aria-label="Loading your steps">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="sk-feed-entry">
                  <div className="sk-feed-meta">
                    <span className="skeleton skeleton--mini" />
                    <span className="skeleton skeleton--mini" />
                  </div>
                  <span className="skeleton skeleton--text" />
                  <span className="skeleton skeleton--text skeleton--w60" />
                </div>
              ))}
            </div>
          )}

          {empty && (
            <div className="steps-empty steps-empty--story steps-empty--seed">
              <Plant steps={0} size={150} showLabel={false} />
              <p>
                Your journal is ready. Nothing here yet — and that's okay.
              </p>
              <p className="steps-empty-hint">
                Write one small thing you did today. It can be anything: "got out
                of bed", "drank water", "sat in the sun for a minute."
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