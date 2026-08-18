import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import AppShell from "../components/AppShell";
import PlantIcon from "../components/PlantIcon";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [name, setName] = useState("");
  const [recovering, setRecovering] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supabaseConfigured || !supabase || !user) return null;
  const db = supabase;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error: err } = await db
      .from("profiles")
      .upsert({
        id: user.id,
        name: name.trim() || null,
        context: recovering.trim() || null,
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (err) {
      setError("Couldn't save that. Give it another try.");
      setBusy(false);
      return;
    }

    await refreshProfile();
    navigate("/check-in", { replace: true });
  };

  return (
    <AppShell>
      <div className="onboard">
        <div className="onboard-head">
          <PlantIcon size={48} className="onboard-art" />
          <h1>Almost ready</h1>
          <p>Two gentle questions — answer them however you like. Or skip.</p>
        </div>

        <div className="how-card">
          <h2>How this works</h2>
          <p>
            Every day there's one question: “What's one small thing you did
            today?” You write anything — from “I got out of bed” to “I replied
            to one email.” You get a warm, personal response. That's all. No
            quotas, no points, no “why wasn't there anything yesterday.”
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="onboard-questions">
            <div className="field">
              <h2>What can I call you?</h2>
              <input
                className="input"
                type="text"
                autoComplete="nickname"
                placeholder="A name — or just leave it"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="hint">Optional. You can leave it empty.</p>
            </div>

            <div className="field">
              <h2>What are you recovering from?</h2>
              <textarea
                className="textarea"
                placeholder="e.g. burnout, a long sick leave, a hard season — anything you want me to keep in mind"
                value={recovering}
                onChange={(e) => setRecovering(e.target.value)}
              />
              <p className="hint">
                Also optional, and totally skippable. It just helps me respond
                a little more gently.
              </p>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="onboard-actions">
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={busy}
            >
              {busy ? "Saving…" : "Continue when you're ready"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
