export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  if (typeof window === "undefined") return;

  // Load Sentry after first paint — keeps ~270KB out of the critical bundle.
  const start = () => {
    void import("./sentryImpl").then(({ initSentryImpl }) => initSentryImpl(dsn));
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.readyState === "complete") {
    setTimeout(start, 1500);
  } else {
    window.addEventListener("load", () => setTimeout(start, 1500), { once: true });
  }
}
