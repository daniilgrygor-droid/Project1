import { useEffect, useRef, useState } from "react";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Smoothly counts toward `value` whenever it changes. Respects reduced motion.
export function useCountUp(value: number, duration = 700): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    if (typeof window === "undefined" || prefersReducedMotion) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }

    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

// Counts up from 0 once the element scrolls into view.
function useCountUpInView(target: number, durationMs = 1100) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(target * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  return [ref, value] as const;
}

/** Renders a formatted number with optional prefix/suffix, counted up. */
export function CountUp({
  prefix = "",
  value,
  suffix = "",
  className = "",
}: {
  prefix?: string;
  value: number;
  suffix?: string;
  className?: string;
}) {
  const [ref, current] = useCountUpInView(value);
  return (
    <span ref={ref} className={`stat-count${className ? ` ${className}` : ""}`}>
      {prefix}
      {current}
      {suffix}
    </span>
  );
}