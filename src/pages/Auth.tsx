import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import Wordmark from "../components/Wordmark";
import PlantIcon from "../components/PlantIcon";

type Mode = "in" | "up";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { configured, refreshProfile } = useAuth();

  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "up" ? "up" : "in",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as { from?: string } | null)?.from ?? "/check-in";

  const afterAuth = async () => {
    const p = await refreshProfile();
    if (!p || !p.onboarded_at) {
      navigate("/onboarding", { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  const forgotPassword = async () => {
    if (!supabase || !email.trim()) {
      setError("Enter your email above, then tap “Forgot password?”.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);

    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` },
    );

    setBusy(false);
    if (err) {
      setError(`Couldn't send the reset link: ${err.message}. Try again later.`);
    } else {
      setMessage(
        "Check your inbox — there's a link to choose a new password. No rush."
      );
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    if (mode === "in") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(
          `Couldn't sign you in: ${err.message}. Check your email and password.`
        );
      } else {
        await afterAuth();
      }
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(
          `Couldn't create an account: ${err.message}. Give it another try.`
        );
      } else if (data.session) {
        await afterAuth();
      } else {
        setMessage(
          "Almost there. Check your inbox for a confirmation email — come back whenever you're ready."
        );
      }
    }

    setBusy(false);
  };

  if (!configured) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-art">
            <PlantIcon size={52} className="auth-art-icon" />
          </div>
          <Wordmark />
          <h1>Sign-in isn't connected yet</h1>
          <p className="auth-lead">
            To enable accounts, add your Supabase keys to the <code>.env</code>{" "}
            file.
          </p>
          <div className="setup-note">
            Create a project on{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline" }}
            >
              supabase.com
            </a>
            , then set:
            <br />
            <code>VITE_SUPABASE_URL=…</code>
            <br />
            <code>VITE_SUPABASE_ANON_KEY=…</code>
            <br />
            <br />
            Full details are in the project README.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-art">
          <PlantIcon size={52} className="auth-art-icon" />
        </div>
        <Wordmark />
        <h1>{mode === "in" ? "Welcome back" : "Welcome"}</h1>
        <p className="auth-lead">
          {mode === "in"
            ? "Your steps didn't go anywhere — they're waiting for you."
            : "No long forms here. Just enough to make sure your steps never get lost."}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Sign in or create an account">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "in"}
            className={`auth-tab${mode === "in" ? " auth-tab--active" : ""}`}
            onClick={() => {
              setMode("in");
              setError(null);
              setMessage(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "up"}
            className={`auth-tab${mode === "up" ? " auth-tab--active" : ""}`}
            onClick={() => {
              setMode("up");
              setError(null);
              setMessage(null);
            }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              required
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "in" && (
              <button
                type="button"
                className="auth-inline-link auth-forgot"
                onClick={() => void forgotPassword()}
              >
                Forgot password?
              </button>
            )}
          </div>

          <div className="auth-submit">
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={busy}
            >
              {busy
                ? "One moment…"
                : mode === "in"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </div>
        </form>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <div className="auth-message" role="status">
            {message}
          </div>
        )}

        <p className="auth-note">
          {mode === "in" ? (
            <>
              No account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("up");
                  setError(null);
                  setMessage(null);
                }}
                className="auth-inline-link"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("in");
                  setError(null);
                  setMessage(null);
                }}
                className="auth-inline-link"
              >
                Sign in
              </button>
            </>
          )}{" "}
          · <Link to="/">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
