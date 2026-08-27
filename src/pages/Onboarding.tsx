import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { useAuth } from "../lib/authContext";
import AppShell from "../components/AppShell";
import Plant from "../components/Plant";
import PlantIcon from "../components/PlantIcon";
import { LeafIcon, SproutIcon, SunIcon } from "../components/icons";
import { applyReferral } from "../lib/referral";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [recovering, setRecovering] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderDays, setReminderDays] = useState<string[]>(["1","2","3","4","5"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supabaseConfigured || !supabase || !user) return null;
  const db = supabase;

  const DAYS = [
    { id: "1", label: "Mon" },
    { id: "2", label: "Tue" },
    { id: "3", label: "Wed" },
    { id: "4", label: "Thu" },
    { id: "5", label: "Fri" },
    { id: "6", label: "Sat" },
    { id: "0", label: "Sun" },
  ];

  const toggleDay = (id: string) =>
    setReminderDays((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    if (step === 1) {
      const { error: err } = await db.from("profiles").upsert({
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
      void applyReferral(user.id);
      setBusy(false);
      setStep(2);
      return;
    }

    // step 2: reminders
    const { error: err } = await db.from("profiles").upsert({
      id: user.id,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderTime,
      reminder_days: reminderDays.join(",") || "1,2,3,4,5",
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

  const skip = async () => {
    if (busy) return;
    setBusy(true);
    const { error: err } = await db.from("profiles").upsert({
      id: user.id,
      ...(step === 1 ? {} : { reminder_enabled: false }),
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (!err) {
      await refreshProfile();
      void applyReferral(user.id);
    }
    navigate("/check-in", { replace: true });
  };

  return (
    <AppShell>
      <div className="onboard">
        <div className="onboard-head">
          {step === 1 ? (
            <>
              <PlantIcon size={48} className="onboard-art" />
              <span className="head-eyebrow">
                <LeafIcon size={13} />A quiet start
              </span>
              <h1>Almost ready</h1>
              <p>Two gentle questions — answer them however you like. Or skip.</p>
            </>
          ) : (
            <>
              <Plant steps={3} size={64} showLabel={false} />
              <span className="head-eyebrow">
                <SunIcon size={13} />Make it yours
              </span>
              <h1>A quiet nudge?</h1>
              <p>Reminders are off by default. Turn them on only if you want one.</p>
            </>
          )}
          <div className="onboard-progress" aria-hidden="true">
            <span className={`onboard-dot${step === 1 ? " onboard-dot--active" : ""}`} />
            <span className={`onboard-dot${step === 2 ? " onboard-dot--active" : ""}`} />
          </div>
        </div>

        <div className="onboard-card spot-card">
          {step === 1 ? (
            <>
              <div className="how-card">
                <h2>How this works</h2>
                <p className="how-lead">
                  Every day there's one question. You write anything — from "I got out of bed" to "I replied to one email."
                </p>
                <ul className="how-points">
                  <li>
                    <span className="how-point-icon"><LeafIcon size={15} /></span>
                    <span><strong>One quiet question a day</strong><span>No checklists, no quotas.</span></span>
                  </li>
                  <li>
                    <span className="how-point-icon"><SproutIcon size={15} /></span>
                    <span><strong>A warm reply that hears you</strong><span>Never a canned "great job".</span></span>
                  </li>
                  <li>
                    <span className="how-point-icon"><SunIcon size={15} /></span>
                    <span><strong>No points or streaks</strong><span>Quiet days are fine. Always.</span></span>
                  </li>
                </ul>
              </div>

              <form onSubmit={submit}>
                <div className="onboard-questions">
                  <div className="field">
                    <h2>What can I call you?</h2>
                    <input className="input" type="text" autoComplete="nickname" placeholder="A name — or just leave it" value={name} onChange={(e) => setName(e.target.value)} />
                    <p className="hint">Optional. You can leave it empty.</p>
                  </div>
                  <div className="field">
                    <h2>What are you recovering from?</h2>
                    <textarea className="textarea" placeholder="e.g. burnout, a long sick leave, a hard season — anything you want me to keep in mind" value={recovering} onChange={(e) => setRecovering(e.target.value)} />
                    <p className="hint">Also optional, and totally skippable. It just helps me respond a little more gently.</p>
                  </div>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="onboard-actions">
                  <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
                    {busy && <span className="btn-dot" aria-hidden="true" />}
                    {busy ? "Saving…" : "Continue"}
                  </button>
                  <button type="button" className="auth-inline-link onboard-skip" onClick={skip} disabled={busy}>Skip — start writing</button>
                </div>
              </form>
            </>
          ) : (
            <form onSubmit={submit}>
              <div className="field">
                <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} />
                  Send me a gentle reminder
                </label>
                <p className="hint">One email at a time you choose. No nagging.</p>
              </div>
              {reminderEnabled && (
                <>
                  <div className="field">
                    <label className="field-label" htmlFor="onboard-time">Time</label>
                    <input id="onboard-time" className="input" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
                  </div>
                  <div className="field">
                    <span className="field-label">Days</span>
                    <div className="day-chips" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {DAYS.map((d) => (
                        <button key={d.id} type="button" className={`chip${reminderDays.includes(d.id) ? " chip--on" : ""}`} onClick={() => toggleDay(d.id)}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="onboard-preview">
                <Plant steps={3} size={80} showLabel={false} />
                <span>Your plant starts as a seed — one step at a time.</span>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="onboard-actions">
                <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
                  {busy && <span className="btn-dot" aria-hidden="true" />}
                  {busy ? "Saving…" : "Save and start"}
                </button>
                <button type="button" className="auth-inline-link onboard-skip" onClick={skip} disabled={busy}>Skip, no reminders</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
