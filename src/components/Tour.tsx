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

export default function Tour() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
      // Only show for new users (no steps) or first time
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    } catch {
      return;
    }
  }, []);

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

  // Auto-advance every 3.8s like an animation
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      setIdx((i) => {
        if (i + 1 >= STEPS.length) {
          clearInterval(t);
          setTimeout(() => close(true), 1200);
          return i;
        }
        (window as any).plausible?.("tour_auto", { props: { step: String(i + 2) } });
        return i + 1;
      });
    }, 3800);
    return () => clearInterval(t);
  }, [open]);

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

  const step = STEPS[idx];

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Quick tour">
      <div className="tour-scrim" onClick={() => close(false)} />
      <div className="tour-card spot-card">
        <div key={idx} className="tour-progress" aria-hidden="true" />
        <div className="tour-head">
          <span className="tour-step">{idx + 1} / {STEPS.length}</span>
          <button type="button" className="tour-skip" onClick={() => close(false)}>Skip tour</button>
        </div>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="tour-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={prev} disabled={idx === 0}>Back</button>
          <button type="button" className="btn btn--primary btn--sm" onClick={next}>
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
