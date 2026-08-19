import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Wordmark from "../components/Wordmark";
import PlantIcon from "../components/PlantIcon";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase?.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    }) ?? { data: { subscription: { unsubscribe: () => {} } } };

    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || busy || !password) return;
    setBusy(true);
    setError(null);

    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (err) {
      setError("That didn't work. Give it another try.");
      return;
    }
    setDone(true);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card spot-card">
        <div className="auth-art">
          <PlantIcon size={52} className="auth-art-icon" />
        </div>
        <Wordmark />
        {done ? (
          <>
            <h1>All set</h1>
            <p className="auth-lead">
              Your password is updated. You can sign in whenever you're ready.
            </p>
            <Link to="/auth" className="btn btn--primary btn--block">
              Go to sign-in
            </Link>
          </>
        ) : ready ? (
          <>
            <h1>Choose a new password</h1>
            <p className="auth-lead">
              Make it something you'll remember. No rush.
            </p>
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
                  className="input"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="auth-submit">
                <button
                  type="submit"
                  className="btn btn--primary btn--block"
                  disabled={busy}
                >
                  {busy ? "One moment…" : "Update password"}
                </button>
              </div>
            </form>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <h1>Opening the reset link…</h1>
            <p className="auth-lead">
              If you followed the link from your email, the form to choose a new
              password will appear here.
            </p>
          </>
        )}

        <p className="auth-note">
          · <Link to="/auth">Back to sign-in</Link>
        </p>
      </div>
    </div>
  );
}
