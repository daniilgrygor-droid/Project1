import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import AppShell from "../components/AppShell";
import SproutLoader from "../components/SproutLoader";
import { deleteAllSteps } from "../lib/steps";
import { isPrivate } from "../lib/types";
import {
  cancelPrivate,
  paymentDetails,
  planLabel,
  PRICE_YEARLY,
  requestPrivatePayment,
} from "../lib/billing";
import {
  applyTheme,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from "../lib/theme";
import {
  applyTextSize,
  readTextSize,
  TEXT_SIZES,
  type TextSizeId,
} from "../lib/textSize";

const THEME_OPTIONS: { id: ThemePreference; label: string; hint: string }[] = [
  { id: "light", label: "Light", hint: "The warm daytime palette." },
  { id: "dark", label: "Dark", hint: "A muted evening palette for late hours." },
];

const DAYS = [
  { id: "1", label: "Mo" },
  { id: "2", label: "Tu" },
  { id: "3", label: "We" },
  { id: "4", label: "Th" },
  { id: "5", label: "Fr" },
  { id: "6", label: "Sa" },
  { id: "7", label: "Su" },
];

function parseDays(csv: string): string[] {
  return (csv || "1,2,3,4,5,6,7").split(",").map((d) => d.trim()).filter(Boolean);
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();

  const [recovering, setRecovering] = useState(profile?.context ?? "");
  const [replyLength, setReplyLength] = useState<"short" | "long">(
    profile?.reply_length ?? "short",
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reminderEnabled, setReminderEnabled] = useState(
    profile?.reminder_enabled ?? false,
  );
  const [reminderTime, setReminderTime] = useState(profile?.reminder_time ?? "19:00");
  const [reminderDays, setReminderDays] = useState<string[]>(
    parseDays(profile?.reminder_days ?? ""),
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletedMsg, setDeletedMsg] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySent, setPaySent] = useState(false);

  const [textSize, setTextSize] = useState<TextSizeId>(() => readTextSize());
  const [themePref, setThemePref] = useState<ThemePreference>(() =>
    // No stored choice → the picker reflects what's actually active (system).
    resolveTheme(readThemePreference()),
  );

  const chooseTextSize = (id: TextSizeId) => {
    setTextSize(id);
    applyTextSize(id);
  };

  const chooseTheme = (pref: ThemePreference) => {
    setThemePref(pref);
    writeThemePreference(pref);
    applyTheme(pref);
  };

  if (!supabase || !user || !profile) {
    return (
      <AppShell>
        <div className="settings">
          <SproutLoader />
        </div>
      </AppShell>
    );
  }
  const db = supabase;
  const privatePlan = isPrivate(profile);

  const goCheckout = async () => {
    if (billingBusy) return;
    setPaying(true);
  };

  const goCancel = async () => {
    if (billingBusy || !user) return;
    setBillingBusy(true);
    const ok = await cancelPrivate(user.id);
    setBillingBusy(false);
    if (ok) await refreshProfile();
  };

  const submitPayment = async () => {
    if (billingBusy || !user) return;
    setBillingBusy(true);
    const row = await requestPrivatePayment(user.id, user.email ?? "");
    setBillingBusy(false);
    if (row) {
      setPaySent(true);
      setPaying(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setSaved(false);
    setError(null);

    const { error: err } = await db
      .from("profiles")
      .update({
        context: recovering.trim() || null,
        reply_length: replyLength,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setBusy(false);
    if (err) {
      setError("Couldn't save that. Give it another try.");
      return;
    }
    await refreshProfile();
    setSaved(true);
  };

  const saveReminders = async () => {
    setSaved(false);
    const { error: err } = await db
      .from("profiles")
      .update({
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        reminder_days: reminderDays.length ? reminderDays.join(",") : "1,2,3,4,5,6,7",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (!err) {
      await refreshProfile();
      setSaved(true);
    }
  };

  const wipeData = async () => {
    if (deleting) return;
    setDeleting(true);
    const ok = await deleteAllSteps();
    setDeleting(false);
    if (ok) {
      setConfirmDelete(false);
      setDeletedMsg(true);
    }
  };

  return (
    <AppShell>
      <div className="settings">
        <div className="settings-head">
          <h1>Settings</h1>
          <p>Small adjustments, no pressure — change them whenever you like.</p>
        </div>

        <div className="settings-card settings-card--plan">
          <div className="settings-plan-row">
            <div className="settings-plan-info">
              <span className={`plan-badge plan-badge--${profile.plan}`}>
                {planLabel(profile.plan)}
              </span>
              <h2>
                {privatePlan
                  ? "Your words stay closer."
                  : "Keep your words closer."}
              </h2>
              <p>
                {privatePlan
                  ? "Your replies are processed privately — never used to train AI models. Reminders and weekly notes are on."
                  : `Private is $${PRICE_YEARLY} once a year — replies processed privately, never used to train models, plus gentle reminders and weekly notes.`}
              </p>
            </div>
            <div className="settings-plan-actions">
              {privatePlan ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => void goCancel()}
                  disabled={billingBusy}
                >
                  {billingBusy ? "Working…" : "Cancel Private"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => void goCheckout()}
                  disabled={billingBusy}
                >
                  {billingBusy ? "Opening…" : `Go Private — $${PRICE_YEARLY}/yr`}
                </button>
              )}
            </div>
          </div>
          {paying && !privatePlan && (
            <div className="manual-pay manual-pay--inline">
              {paySent ? (
                <div className="manual-pay-note">
                  <h3>Thank you.</h3>
                  <p>
                    Your request is in. We'll switch Private on as soon as the
                    payment arrives — usually within a day. No rush.
                  </p>
                </div>
              ) : (
                <>
                  <h3>Private — ${PRICE_YEARLY} once a year</h3>
                  <p className="manual-pay-details">{paymentDetails()}</p>
                  <div className="manual-pay-actions">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => void submitPayment()}
                      disabled={billingBusy}
                    >
                      {billingBusy ? "Recording…" : "I've paid"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      onClick={() => setPaying(false)}
                      disabled={billingBusy}
                    >
                      Not yet
                    </button>
                  </div>
                  <p className="manual-pay-hint">
                    No recurring charges. When the year passes, you can renew —
                    or quietly stay on the free plan.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {deletedMsg && (
          <div className="settings-note" role="status">
            <h2>All done</h2>
            <p>
              Your entries have been deleted. If you ever come back, you can
              start fresh — a new seed.
            </p>
          </div>
        )}

        <form className="settings-card" onSubmit={submit}>
          <div className="field">
            <h2>What are you recovering from?</h2>
            <textarea
              className="textarea"
              placeholder="e.g. burnout, a long sick leave, a hard season — anything you want me to keep in mind"
              value={recovering}
              onChange={(e) => {
                setRecovering(e.target.value);
                setSaved(false);
              }}
              rows={3}
            />
            <p className="hint">
              This helps me respond a little more gently. Leave it empty and
              I'll respond without it.
            </p>
          </div>

          <div className="field settings-choice">
            <h2>How long should replies be?</h2>
            <div className="choice-row">
              <label className="choice">
                <input
                  type="radio"
                  name="reply_length"
                  value="short"
                  checked={replyLength === "short"}
                  onChange={() => {
                    setReplyLength("short");
                    setSaved(false);
                  }}
                />
                <span>
                  <strong>Shorter replies</strong> — a single warm sentence.
                </span>
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="reply_length"
                  value="long"
                  checked={replyLength === "long"}
                  onChange={() => {
                    setReplyLength("long");
                    setSaved(false);
                  }}
                />
                <span>
                  <strong>Longer replies</strong> — two or three warm sentences.
                </span>
              </label>
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            {saved && (
              <span className="settings-saved" role="status">
                Saved.
              </span>
            )}
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>

        <div className="settings-note">
          <h2>Reminders</h2>
          <p>
            A gentle check-in whenever you're ready — nothing that scolds you
            for quiet days. A Private feature.
          </p>
          <label className={`choice${!privatePlan ? " choice--locked" : ""}`}>
            <input
              type="checkbox"
              checked={reminderEnabled}
              disabled={!privatePlan}
              onChange={(e) => {
                setReminderEnabled(e.target.checked);
                setSaved(false);
              }}
            />
            <span>Daily reminder</span>
          </label>
          {!privatePlan && (
            <p className="hint">
              Reminders come with the Private plan —{" "}
              <button type="button" className="btn--link" onClick={() => void goCheckout()}>
                see pricing
              </button>
              .
            </p>
          )}

          {reminderEnabled && (
            <div className="reminder-opts">
              <label className="reminder-row">
                <span>Time</span>
                <input
                  type="time"
                  className="input reminder-time"
                  value={reminderTime}
                  onChange={(e) => {
                    setReminderTime(e.target.value);
                    setSaved(false);
                  }}
                />
              </label>
              <div className="reminder-days">
                {DAYS.map((d) => {
                  const on = reminderDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`day-chip${on ? " day-chip--on" : ""}`}
                      onClick={() => {
                        setReminderDays((cur) =>
                          on ? cur.filter((x) => x !== d.id) : [...cur, d.id],
                        );
                        setSaved(false);
                      }}
                      aria-pressed={on}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void saveReminders()}
              disabled={busy}
            >
              Save reminders
            </button>
          </div>
        </div>

        <div className="settings-note">
          <h2>Weekly notes</h2>
          <p>
            Once a week you may get a short, warm email looking back at your
            small steps. You can turn it off here. A Private feature.
          </p>
          <label className={`choice${!privatePlan ? " choice--locked" : ""}`}>
            <input
              type="checkbox"
              checked={profile.weekly_email}
              disabled={!privatePlan}
              onChange={async (e) => {
                setSaved(false);
                const { error: err } = await db
                  .from("profiles")
                  .update({
                    weekly_email: e.target.checked,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", user.id);
                if (!err) {
                  await refreshProfile();
                  setSaved(true);
                }
              }}
            />
            <span>Send me the weekly note</span>
          </label>
          {!privatePlan && (
            <p className="hint">
              Weekly notes come with the Private plan —{" "}
              <button type="button" className="btn--link" onClick={() => void goCheckout()}>
                see pricing
              </button>
              .
            </p>
          )}
        </div>

        <div className="settings-note">
          <h2>Appearance</h2>
          <p>How the site looks for you — day or evening.</p>
          <div className="choice-row">
            {THEME_OPTIONS.map((t) => (
              <label key={t.id} className="choice">
                <input
                  type="radio"
                  name="theme"
                  value={t.id}
                  checked={themePref === t.id}
                  onChange={() => chooseTheme(t.id)}
                />
                <span>
                  <strong>{t.label}</strong> — {t.hint}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-note">
          <h2>Text size</h2>
          <p>Make everything a little easier to read.</p>
          <div className="text-size-row">
            {TEXT_SIZES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`day-chip${textSize === t.id ? " day-chip--on" : ""}`}
                onClick={() => chooseTextSize(t.id)}
                aria-pressed={textSize === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-note settings-note--danger">
          <h2>Your data</h2>
          <p>
            Everything here belongs to you. You can remove it all whenever you
            like.
          </p>
          {confirmDelete ? (
            <div className="step-confirm-inline">
              <span>Delete all your small steps? This can't be undone.</span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Keep everything
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => void wipeData()}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete all"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete all my data
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}