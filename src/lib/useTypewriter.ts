import { useEffect, useState } from "react";

/**
 * Reveals `text` character by character while `active` is true; snaps to
 * the full text otherwise. Eases out so typing starts brisk and settles
 * calmly. Skips itself under prefers-reduced-motion (and fires onDone).
 */
export function useTypewriter(
  text: string | null,
  active: boolean,
  onDone?: () => void,
): number {
  const [shown, setShown] = useState(() => (active ? 0 : text?.length ?? 0));

  useEffect(() => {
    if (!text) {
      setShown(0);
      return;
    }
    if (!active) {
      setShown(text.length);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      onDone?.();
      return;
    }

    setShown(0);
    const total = text.length;
    const duration = Math.min(4200, Math.max(1400, total * 18));
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 2);
      setShown(Math.round(total * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setShown(total);
        onDone?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active]);

  return shown;
}
