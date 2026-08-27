import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN && !(Sentry as unknown as { getClient?: () => unknown }).getClient?.()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  });
}

export default Sentry;
