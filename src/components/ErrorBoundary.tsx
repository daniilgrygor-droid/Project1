import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// A deploy replaces hashed chunks; an open tab still running the old code
// then fails to lazy-load a route. A single quiet reload picks up the new
// build (same as a manual refresh). The timestamp guards against loops.
const CHUNK_LOAD_ERROR =
  /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk \d+ failed/i;
const RELOAD_KEY = "ss-chunk-reload-at";
const RELOAD_WINDOW_MS = 15_000;

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  return CHUNK_LOAD_ERROR.test(error.message) || CHUNK_LOAD_ERROR.test(String(error.stack));
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    if (isChunkLoadError(error)) {
      try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
        if (Date.now() - last > RELOAD_WINDOW_MS) {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
        }
      } catch {
        /* storage unavailable — fall through to the gentle fallback */
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card spot-card">
            <p className="error-boundary-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </p>
            <h1>{this.props.fallbackTitle || "Something went quiet"}</h1>
            <p className="error-boundary-msg">
              That page hit a rough patch. You can try again or head somewhere
              else.
            </p>
            <div className="error-boundary-actions">
              <button
                className="btn btn--primary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </button>
              <Link to="/check-in" className="btn btn--ghost">
                Go to Check-in
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
