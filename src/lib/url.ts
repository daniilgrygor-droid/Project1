/**
 * Small Steps — dynamic origin helpers.
 *
 * All runtime links (gift links, referral links, Stripe return URLs, etc.)
 * must be built from the current page origin so the same build works on
 * preview deployments, production, and any future custom domain.
 *
 * Import from here instead of hardcoding "small-steps-seven.vercel.app"
 * or any other specific domain anywhere in the app.
 */

/** Runtime origin — accurate for the current deployment (preview, prod, custom domain). */
export const APP_ORIGIN = typeof window !== "undefined"
  ? window.location.origin
  : "";

/** Full URL to the app root (e.g. "https://example.com/"). */
export const APP_ROOT = APP_ORIGIN ? `${APP_ORIGIN}/` : "/";

/** Build-time default origin used in static markup (LD+JSON, prerender) when the runtime origin is unknown.
 *
 *  Set `VITE_APP_URL` in .env to override. Falls back to a placeholder so the
 *  build never ships a stale preview domain.
 */
export const BUILD_APP_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_APP_URL) ||
  "https://smallsteps.app";
