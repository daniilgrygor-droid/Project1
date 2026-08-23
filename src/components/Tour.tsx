import { useEffect, useState } from "react";

const STEPS = [
  {
    title: "One small question",
    text: "Each day, write one thing you did — even “got out of bed” counts. I’ll reply warmly.",
    target: ".checkin-form .textarea",
  },
  {
    title: "Add a little context",
    text: "Category and mood are optional, but they help your reply feel more personal. Try picking one.",
    target: ".picker",
  },
  {
    title: "Look back",
    text: "Your Journey keeps every step. Filter by category or mood to find what matters.",
    target: ".journey-filters",
  },
  {
    title: "Watch it grow",
    text: "Your plant grows with you — from a seed to a bloom. No rush, no streaks.",
    target: ".growth-chip",
  },
];

const KEY = "ss-tour-done";

function useTyping(text: string, speed = 22, startDelay = 180) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);

  // Respect reduced motion — show instantly
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduce) {
      setOut(text);
      setDone(true);
      return;
    }
    setOut("");
    setDone(false);
    let i = 0;
    let t: number | null = null;
    const start = window.setTimeout(() => {
      t = window.setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          if (t) clearInterval(t);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (t) clearInterval(t);
    };
  }, [text, speed, startDelay, reduce]);

  return { out, done };
}

export default function Tour() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
      const t = setTimeout(() => setOpen(true), 420);
      return () => clearTimeout(t);
    } catch {
      return;
    }
  }, []);

  const step = STEPS[idx];
  const titleTyping = useTyping(step.title, 32, 280);
  const textTyping = useTyping(step.text, 18, 520);
  const typingDone = titleTyping.done && textTyping.done;

  const close = (done = true) => {
    setOpen(false);
    if (done) {
      try { localStorage.setItem(KEY, "1"); } catch {}
      (window as any).plausible?.("tour_complete", { props: { step: String(idx + 1) } });
    }
  };

  const next = () => {
    if (idx + 1 >= STEPS.length) close(true);
    else {
      setIdx((i) => i + 1);
      (window as any).plausible?.("tour_step", { props: { step: String(idx + 2) } });
    }
  };

  const prev = () => setIdx((i) => Math.max(0, i - 1));

  // Auto-advance after typing is done + pause
  useEffect(() => {
    if (!open || !typingDone) return;
    const t = setTimeout(() => {
      if (idx + 1 >= STEPS.length) {
        setTimeout(() => close(true), 900);
      } else {
        setIdx((i) => i + 1);
        (window as any).plausible?.("tour_auto", { props: { step: String(idx + 2) } });
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [open, typingDone, idx]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, idx]);

  if (!open) return null;

  return (
    <div className="tour tour--cinematic" role="dialog" aria-modal="true" aria-label="Quick tour">
      <div className="tour-scrim tour-scrim--dark" onClick={() => close(false)} />
      <div className="tour-card spot-card tour-card--cinematic">
        <div key={idx} className="tour-progress" aria-hidden="true" />
        <div className="tour-head">
          <span className="tour-step">{idx + 1} / {STEPS.length}</span>
          <button type="button" className="tour-skip" onClick={() => close(false)}>Skip tour</button>
        </div>
        <h3 className="tour-title">
          {titleTyping.out}
          {!titleTyping.done && <span className="tour-caret" aria-hidden="true">|</span>}
        </h3>
        <p className="tour-text">
          {textTyping.out}
          {!textTyping.done && <span className="tour-caret" aria-hidden="true">|</span>}
        </p>
        <div className="tour-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={prev} disabled={idx === 0}>Back</button>
          <button type="button" className="btn btn--primary btn--sm tour-next" onClick={next} disabled={!typingDone && idx + 1 !== STEPS.length}>
            {idx + 1 === STEPS.length ? "Done — start" : "Next"}
          </button>
        </div>
        <div className="tour-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`tour-dot${i === idx ? " tour-dot--on" : ""}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
