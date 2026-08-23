import * as Sentry from "@sentry/react";

export function initSentryImpl(dsn: string) {
  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.5,
    environment: import.meta.env.MODE || "development",
    enabled:
      import.meta.env.MODE === "production" &&
      !window.location.hostname.includes("localhost"),
  });
}
