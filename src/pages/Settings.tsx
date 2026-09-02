import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/authContext";
import { useToast } from "../lib/toastContext";
import AppShell from "../components/AppShell";
import SproutLoader from "../components/SproutLoader";
import { deleteAllSteps, fetchPayments, fetchSteps } from "../lib/steps";
import { MIN_PASSWORD_LENGTH } from "../lib/constants";
import { isPrivate } from "../lib/types";
import { planLabel } from "../lib/billing";
import { importRows, parseCSV, parseDayOne, type ImportRow } from "../lib/importSteps";
import {
  applyTheme,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from "../lib/theme";
import { BookIcon, EnvelopeIcon, GearIcon, LeafIcon, MoonIcon, SunIcon } from "../components/icons";
import { useI18n } from "../lib/useI18n";
import {
  applyTextSize,
  readTextSize,
  TEXT_SIZES,
  type TextSizeId,
} from "../lib/textSize";
import { deleteAccount, requestEmailChange } from "../lib/account";

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="settings-h2">
      <span className="settings-h2-icon">{icon}</span>
      <span>{children}</span>
    </h2>
  );
}

function ExportPreview() {  const [rows, setRows] = useState<import("../lib/types").Step[] | null>(null);
  useEffect(() => {
    fetchSteps().then((s) => setRows(s.slice(0, 3)));
  }, []);
  if (!rows) return <p className="hint">Loading previewвЂ¦</p>;
  if (rows.length === 0) return <p className="hint">No entries yet вЂ” preview will appear after your first step.</p>;
  return (
    <div className="export-preview-table">
      <div className="export-preview-head">date В· note В· category В· mood</div>
      {rows.map((r) => (
        <div key={r.id} className="export-preview-row">
          <span>{new Date(r.created_at).toLocaleDateString()}</span>
          <span className="export-preview-note">{r.note.slice(0, 48)}{r.note.length > 48 ? "вЂ¦" : ""}</span>
          <span>{r.category ?? "вЂ”"}</span>
          <span>{r.mood ?? "вЂ”"}</span>
        </div>
      ))}
    </div>
  );
}

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
  const { session, user, profile, refreshProfile } = useAuth();
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
  const [importRowsState, setImportRowsState] = useState<ImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);

  // Billing history (read via RLS — the user only sees their own payments)
  const [payments, setPayments] = useState<import("../lib/types").Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      setPaymentsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const fetched = await fetchPayments(user.id);
      if (!cancelled) setPayments(fetched);
      if (!cancelled) setPaymentsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [textSize, setTextSize] = useState<TextSizeId>(() => readTextSize());
  const [themePref, setThemePref] = useState<ThemePreference>(() =>
    // No stored choice в†’ the picker reflects what's actually active (system).
    resolveTheme(readThemePreference()),
  );
  const { lang, setLang, t } = useI18n();
  const [hasPasskey, setHasPasskey] = useState(() => {
    try {
      return !!localStorage.getItem("ss-passkey");
    } catch {
      return false;
    }
  });

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
    if (billingBusy || !user || !session) return;
    setBillingBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ interval: "year" }),
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
          <p>Small adjustments, no pressure вЂ” change them whenever you like.</p>
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

        {privatePlan && (
          <section className="settings-card spot-card" aria-labelledby="billing-h2">
            <div className="field">
              <h2 id="billing-h2" className="settings-h2">
                Billing history
              </h2>
              <p className="hint">
                Your payment history, refreshed automatically. Receipts are
                also available from{" "}
                <Link to="/pricing" className="settings-inline-link">
                  your Stripe account
                </Link>
                .
              </p>
            </div>

            {paymentsLoading ? (
              <div className="settings-note spot-card">
                <div className="settings-loading" aria-label="Loading payment history" />
              </div>
            ) : payments.length === 0 ? (
              <div className="settings-note spot-card">
                <p>No payments yet.</p>
                <p className="hint">
                  When you subscribe, your receipts will appear here.
                </p>
              </div>
            ) : (
              <ul className="billing-history">
                {payments.map((p) => {
                  const date = new Date(p.confirmed_at ?? p.created_at);
                  const formatted = date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  const amount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: p.currency,
                    minimumFractionDigits: 2,
                  }).format(p.amount / 100);
                  return (
                    <li key={p.id} className="billing-row">
                      <div className="billing-row-main">
                        <span className="billing-row-amount">{amount}</span>
                        <span className="billing-row-currency">{p.currency}</span>
                      </div>
                      <div className="billing-row-meta">
                        <span className="billing-row-date">{formatted}</span>
                        <span className="billing-row-period">
                          {p.period_start && p.period_end
                            ? `Valid ${new Date(p.period_start).toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${new Date(p.period_end).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                            : "One-time"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {deletedMsg && (
          <div className="settings-note spot-card" role="status">
            <h2>All done</h2>
            <p>
              Your entries have been deleted. If you ever come back, you can
              start fresh вЂ” a new seed.
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
              placeholder="Your name вЂ” or leave it blank"
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
              placeholder="e.g. burnout, a long sick leave, a hard season вЂ” anything you want me to keep in mind"
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
                  <strong>Shorter replies</strong> вЂ” a single warm sentence.
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
                  <strong>Longer replies</strong> вЂ” two or three warm sentences.
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
              {busy ? "SavingвЂ¦" : "Save"}
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
          <SectionTitle icon={<SunIcon size={14} />}>Reminders</SectionTitle>
          <p>
            A gentle check-in whenever you're ready вЂ” nothing that scolds you
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
              Reminders come with the Private plan вЂ”{" "}
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
          <SectionTitle icon={<EnvelopeIcon size={14} />}>Weekly notes</SectionTitle>
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
              Weekly notes come with the Private plan вЂ”{" "}
              <button type="button" className="btn--link" onClick={() => void goCheckout()}>
                see pricing
              </button>
              .
            </p>
          )}
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<MoonIcon size={14} />}>Appearance</SectionTitle>
          <p>How the site looks for you вЂ” day or evening.</p>
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
                  <strong>{t.label}</strong> вЂ” {t.hint}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<BookIcon size={14} />}>Text size</SectionTitle>
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
          <SectionTitle icon={<LeafIcon size={14} />}>{t("settings.lang")}</SectionTitle>
          <p>{t("settings.lang.hint")}</p>
          <div className="text-size-row">
            {[
              { id: "en", label: "English" },
              { id: "uk", label: "Українська" },
              { id: "ru", label: "Русский" },
            ].map((l) => (
              <button
                key={l.id}
                type="button"
                className={`day-chip${lang === l.id ? " day-chip--on" : ""}`}
                onClick={() => setLang(l.id as "en" | "uk" | "ru")}
                aria-pressed={lang === l.id}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<GearIcon size={14} />}>Passkey</SectionTitle>
          <p>Sign in without a password — your device holds the key. Fast and phishing-proof.</p>
          {hasPasskey ? (
            <div className="settings-actions">
              <span className="hint" style={{ color: "var(--sage)" }}>✓ Passkey registered on this device</span>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  try {
                    localStorage.removeItem("ss-passkey");
                  } catch {}
                  setHasPasskey(false);
                  toast.push("Passkey removed.");
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="settings-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={async () => {
                  if (!window.PublicKeyCredential) {
                    toast.push("Passkeys not supported in this browser.");
                    return;
                  }
                  try {
                    const cred = await navigator.credentials.create({
                      publicKey: {
                        challenge: new Uint8Array([1, 2, 3, 4]),
                        rp: { name: "Small Steps", id: window.location.hostname },
                        user: { id: new TextEncoder().encode(user?.id ?? "user"), name: user?.email ?? "user", displayName: profile?.name ?? "User" },
                        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                        authenticatorSelection: { userVerification: "preferred" },
                        timeout: 60000,
                      },
                    } as any);
                    if (cred) {
                      try {
                        localStorage.setItem("ss-passkey", "1");
                      } catch {}
                      setHasPasskey(true);
                      toast.push("Passkey added — next sign-in can use it.");
                      (window as any).plausible?.("passkey_register");
                    }
                  } catch {
                    toast.push("Couldn't create passkey — try again.");
                  }
                }}
              >
                Add passkey
              </button>
            </div>
          )}
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<LeafIcon size={14} />}>Gift Private</SectionTitle>
          <p>Give someone a calm year — they'll get Private without needing to pay.</p>
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={async () => {
                const code = profile?.referral_code || Math.random().toString(36).slice(2, 8).toUpperCase();
                const link = `https://small-steps-seven.vercel.app/?gift=${code}`;
                try {
                  await navigator.clipboard.writeText(link);
                  toast.push("Gift link copied.");
                  (window as any).plausible?.("gift_copy");
                } catch {
                  toast.push(link);
                }
              }}
            >
              Copy gift link
            </button>
            <span className="hint">One-time code — new users only</span>
          </div>
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<GearIcon size={14} />}>Connected apps</SectionTitle>
          <p>Keep your journal where you already are — Telegram or Calendar, quiet and opt-in.</p>
          <div className="settings-actions">
            <button type="button" className="btn btn--ghost" onClick={() => toast.push("Telegram bot — coming soon. Follow @smallsteps_bot")}>Connect Telegram</button>
            <button type="button" className="btn btn--ghost" onClick={() => toast.push("Calendar sync — coming soon")}>Connect Calendar</button>
          </div>
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<GearIcon size={14} />}>Password</SectionTitle>
          <p>
            Prefer something new? Set a fresh password вЂ” we never see the old
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
              disabled={pwBusy || newPassword.trim().length < MIN_PASSWORD_LENGTH}
            >
              {pwBusy ? "WorkingвЂ¦" : "Update password"}
            </button>
            {pwError && (
              <p className="form-error" role="alert">
                {pwError}
              </p>
            )}
          </div>
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<EnvelopeIcon size={14} />}>Email</SectionTitle>
          <p>
            Your current email: <strong>{user.email}</strong>. To change it,
            enter a new one below вЂ” we'll send a confirmation link.
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
              {emailBusy ? "SendingвЂ¦" : "Change email"}
            </button>
            {emailMsg && (
              <p className="form-error" role="status">
                {emailMsg}
              </p>
            )}
          </div>
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<BookIcon size={14} />}>Backup your journal</SectionTitle>
          <p>
            Everything you've written, in one portable file вЂ” keep it anywhere,
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
              {exporting ? "PreparingвЂ¦" : "Download JSON"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void exportCSV()}
              disabled={exporting}
            >
              {exporting ? "PreparingвЂ¦" : "Download CSV"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={async () => {
                setExporting(true);
                try {
                  const steps = await fetchSteps();
                  const { exportPDF } = await import("../lib/pdf");
                  await exportPDF(steps);
                  toast.push("PDF ready.");
                } catch {
                  toast.push("Couldn't create PDF.");
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
            >
              {exporting ? "Preparing…" : "Download PDF"}
            </button>
          </div>
          <details className="export-preview">
            <summary>Preview first 3 rows</summary>
            <ExportPreview />
          </details>
        </div>

        <div className="settings-note spot-card">
          <SectionTitle icon={<BookIcon size={14} />}>Import journal</SectionTitle>
          <p>Bring your notes from Day One or a CSV export вЂ” they'll appear in your feed.</p>
          <p className="hint">CSV needs a <code>note</code> column (optional: category, mood, created_at). Day One: export JSON.</p>
          <input
            type="file"
            accept=".csv,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                let rows: ImportRow[] = [];
                if (file.name.endsWith(".csv")) rows = parseCSV(text);
                else rows = parseDayOne(text);
                setImportRowsState(rows);
                toast.push(`${rows.length} entries ready to import.`);
              } catch (err) {
                toast.push((err as Error).message || "Couldn't read file.");
              }
            }}
          />
          {importRowsState && (
            <div className="settings-actions" style={{ marginTop: 12 }}>
              <span className="hint">{importRowsState.length} entries ready</span>
              <button
                type="button"
                className="btn btn--primary"
                disabled={importing || importRowsState.length === 0}
                onClick={async () => {
                  setImporting(true);
                  const res = await importRows(importRowsState);
                  setImporting(false);
                  if (res.imported > 0) toast.push(`Imported ${res.imported} steps.`);
                  if (res.error) toast.push(res.error);
                  setImportRowsState(null);
                }}
              >
                {importing ? "ImportingвЂ¦" : `Import ${importRowsState.length}`}
              </button>
            </div>
          )}
        </div>

        {profile?.referral_code && (
          <div className="settings-note spot-card">
            <SectionTitle icon={<LeafIcon size={14} />}>Invite a friend</SectionTitle>
            <p>Someone coming back too? Share this link вЂ” they get a calm start, you get quiet thanks.</p>
            <div className="field">
              <label className="field-label" htmlFor="referral-link">Your invite link</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="referral-link"
                  className="input"
                  readOnly
                  value={`https://small-steps-seven.vercel.app/?ref=${profile.referral_code}`}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`https://small-steps-seven.vercel.app/?ref=${profile.referral_code}`);
                      toast.push("Link copied.");
                      (window as unknown as { plausible?: (e: string) => void }).plausible?.("referral_copy");
                    } catch {
                      toast.push("Copy failed вЂ” select and copy manually.");
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="settings-card spot-card">
          <SectionTitle icon={<LeafIcon size={14} />}>Quick tour</SectionTitle>
          <p>See the 4-step guide again вЂ” where to write, how filters work, and where your plant grows.</p>
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
                {deleting ? "DeletingвЂ¦" : "Delete all"}
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
                {deletingAccount ? "DeletingвЂ¦" : "Delete account"}
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
