import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import AppShell from "../components/AppShell";
import SproutLoader from "../components/SproutLoader";
import { deleteAllSteps, fetchSteps } from "../lib/steps";
import { isPrivate } from "../lib/types";
import { planLabel, PRICE_YEARLY } from "../lib/billing";
import {
  applyTheme,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from "../lib/theme";
import { LeafIcon } from "../components/icons";
import {
  applyTextSize,
  readTextSize,
  TEXT_SIZES,
  type TextSizeId,
} from "../lib/textSize";
import { deleteAccount, requestEmailChange } from "../lib/account";

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

function initialsOf(email?: string | null): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = (parts.length > 1 ? [parts[0], parts[1]] : [parts[0]])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return letters || email.slice(0, 2).toUpperCase();
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();

  const [recovering, setRecovering] = useState(profile?.context ?? "");
  const [name, setName] = useState(profile?.name ?? "");
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
  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
    if (billingBusy || !user) return;
    setBillingBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      toast.push("Something went wrong. Please try again.");
    } finally {
      setBillingBusy(false);
    }
  };

  const openPortal = async () => {
    if (billingBusy || !profile?.stripe_customer_id) return;
    setBillingBusy(true);
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: profile.stripe_customer_id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal failed:", err);
      toast.push("Something went wrong. Please try again.");
    } finally {
      setBillingBusy(false);
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
        name: name.trim() || null,
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
    toast.push("Saved.");
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
      toast.push("Reminders saved.");
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
      toast.push("Everything deleted. A fresh start, whenever you're ready.");
    }
  };

  const updatePassword = async () => {
    if (!supabase || !newPassword.trim() || pwBusy) return;
    setPwBusy(true);
    setPwError(null);
    const { error: err } = await supabase.auth.updateUser({
      password: newPassword.trim(),
    });
    setPwBusy(false);
    if (err) {
      setPwError(err.message);
      return;
    }
    setNewPassword("");
    toast.push("Password updated.");
  };

  const signOut = () => {
    void supabase?.auth.signOut();
  };

  const exportJournal = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const steps = await fetchSteps();
      const payload = {
        app: "Small Steps",
        exported_at: new Date().toISOString(),
        account: {
          email: user.email,
          plan: profile.plan,
          name: profile.name ?? null,
        },
        steps: steps.map((s) => ({
          id: s.id,
          created_at: s.created_at,
          note: s.note,
          category: s.category ?? null,
          mood: s.mood ?? null,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `small-steps-journal-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.push("Your journal is downloaded.");
      (window as any).plausible?.("export", { props: { format: "json" } });
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const steps = await fetchSteps();
      const escape = (v: string | null | number) => {
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      };
      const header = ["date", "note", "category", "mood", "ai_response"].join(",");
      const rows = steps.map((s) =>
        [s.created_at, s.note, s.category ?? "", s.mood ?? "", s.ai_response ?? ""].map(escape).join(","),
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `small-steps-journal-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.push("CSV is downloaded.");
      (window as any).plausible?.("export", { props: { format: "csv" } });
    } finally {
      setExporting(false);
    }
  };

  const changeEmail = async () => {
    if (emailBusy || !newEmail.trim()) return;
    setEmailBusy(true);
    setEmailMsg(null);
    const result = await requestEmailChange(newEmail.trim());
    setEmailBusy(false);
    if (result.ok) {
      setEmailMsg("Check your new email for a confirmation link.");
      setNewEmail("");
      toast.push("Confirmation sent to your new email.");
    } else {
      setEmailMsg(result.error || "Could not update email.");
    }
  };

  const wipeAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    const result = await deleteAccount();
    setDeletingAccount(false);
    if (result.ok) {
      toast.push("Your account and all data have been removed.");
    } else {
      toast.push(result.error || "Could not delete account. Try again.");
      setConfirmDeleteAccount(false);
    }
  };

  return (
    <AppShell>
      <div className="settings">
        <div className="settings-head">
          <h1>Settings</h1>
          <p>Small adjustments, no pressure — change them whenever you like.</p>
        </div>

        <div className="settings-note spot-card settings-account">
          <div className="settings-account-head">
            <span className="account-avatar" aria-hidden="true">
              {initialsOf(user.email)}
            </span>
            <div className="settings-account-id">
              <h2>{profile.name ?? "Your journal"}</h2>
              <p className="account-email">{user.email}</p>
            </div>
          </div>
          <div className="settings-account-meta">
            <span className="chip">
              <LeafIcon size={13} />
              {planLabel(profile.plan)}
            </span>
            <span className="chip">
              Member since{" "}
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="settings-account-actions">
            <button
              type="button"
              className="btn btn--quiet btn--sm"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="settings-card spot-card settings-card--plan">
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
                  onClick={() => void openPortal()}
                  disabled={billingBusy}
                >
                  {billingBusy ? "Opening…" : "Manage subscription"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => void goCheckout()}
                  disabled={billingBusy}
                >
                  {billingBusy ? "Redirecting…" : `Go Private — $${PRICE_YEARLY}/yr`}
                </button>
              )}
            </div>
          </div>
        </div>

        {deletedMsg && (
          <div className="settings-note spot-card" role="status">
            <h2>All done</h2>
            <p>
              Your entries have been deleted. If you ever come back, you can
              start fresh — a new seed.
            </p>
          </div>
        )}

        <form className="settings-card spot-card" onSubmit={submit}>
          <div className="field">
            <label className="field-label" htmlFor="settings-name">
              What should I call you?
            </label>
            <input
              id="settings-name"
              className="input"
              placeholder="Your name — or leave it blank"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
            <p className="hint">Shown on your account card, and nowhere else.</p>
          </div>

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

        <div className="settings-note spot-card">
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

        <div className="settings-note spot-card">
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
                  toast.push(
                    e.target.checked
                      ? "Weekly notes on."
                      : "Weekly notes off.",
                  );
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

        <div className="settings-note spot-card">
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

        <div className="settings-note spot-card">
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

        <div className="settings-note spot-card">
          <h2>Password</h2>
          <p>
            Prefer something new? Set a fresh password — we never see the old
            one.
          </p>
          <div className="field">
            <label className="field-label" htmlFor="settings-password">
              New password
            </label>
            <input
              id="settings-password"
              className="input"
              type="password"
              placeholder="8+ characters"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPwError(null);
              }}
            />
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void updatePassword()}
              disabled={pwBusy || newPassword.trim().length < 8}
            >
              {pwBusy ? "Working…" : "Update password"}
            </button>
            {pwError && (
              <p className="form-error" role="alert">
                {pwError}
              </p>
            )}
          </div>
        </div>

        <div className="settings-note spot-card">
          <h2>Email</h2>
          <p>
            Your current email: <strong>{user.email}</strong>. To change it,
            enter a new one below — we'll send a confirmation link.
          </p>
          <div className="field">
            <label className="field-label" htmlFor="settings-email">
              New email
            </label>
            <input
              id="settings-email"
              className="input"
              type="email"
              placeholder="new@email.com"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailMsg(null);
              }}
            />
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void changeEmail()}
              disabled={emailBusy || !newEmail.trim()}
            >
              {emailBusy ? "Sending…" : "Change email"}
            </button>
            {emailMsg && (
              <p className="form-error" role="status">
                {emailMsg}
              </p>
            )}
          </div>
        </div>

        <div className="settings-note spot-card">
          <h2>Backup your journal</h2>
          <p>
            Everything you've written, in one portable file — keep it anywhere,
            import it later, or just have it close. A JSON file with all your
            steps, moods and categories.
          </p>
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void exportJournal()}
              disabled={exporting}
            >
              {exporting ? "Preparing…" : "Download JSON"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void exportCSV()}
              disabled={exporting}
            >
              {exporting ? "Preparing…" : "Download CSV"}
            </button>
          </div>
        </div>

        <div className="settings-card spot-card">
          <h2>Quick tour</h2>
          <p>See the 4-step guide again — where to write, how filters work, and where your plant grows.</p>
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                try { localStorage.removeItem("ss-tour-done"); } catch {}
                window.location.href = "/check-in";
              }}
            >
              Show tour again
            </button>
          </div>
        </div>

        <div className="settings-note spot-card settings-note--danger">
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

        <div className="settings-note spot-card settings-note--danger">
          <h2>Delete account</h2>
          <p>
            This removes your profile, all steps, and signs you out. Your email
            can then be used to create a new account anytime.
          </p>
          {confirmDeleteAccount ? (
            <div className="step-confirm-inline">
              <span>Permanently delete your account? This can't be undone.</span>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setConfirmDeleteAccount(false)}
                disabled={deletingAccount}
              >
                Keep my account
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => void wipeAccount()}
                disabled={deletingAccount}
              >
                {deletingAccount ? "Deleting…" : "Delete account"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setConfirmDeleteAccount(true)}
            >
              Delete my account
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}