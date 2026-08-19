import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import AppShell from "../components/AppShell";
import SproutLoader from "../components/SproutLoader";
import { LeafIcon } from "../components/icons";
import type { Payment } from "../lib/types";

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Admin() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    const { supabase: sb } = await import("../lib/supabase");
    if (!sb) return;
    const { data, error } = await sb
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setPayments((data as Payment[]) ?? []);
  }, [user]);

  useEffect(() => {
    if (user && profile?.is_admin) void reload();
  }, [user, profile?.is_admin, reload]);

  if (loading || !profile) {
    return (
      <AppShell>
        <div className="settings">
          <SproutLoader />
        </div>
      </AppShell>
    );
  }

  if (!profile.is_admin) {
    return (
      <AppShell>
        <div className="settings">
          <div className="settings-head">
            <span className="head-eyebrow">
              <LeafIcon size={13} />
              Founder only
            </span>
            <h1>Not for you</h1>
            <p>This little corner is just for the founder. Nothing to see here.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const pending = payments.filter((p) => p.status === "pending");
  const settled = payments.filter((p) => p.status !== "pending");

  const confirm = async (p: Payment) => {
    if (busy || !supabase) return;
    setBusy(p.id);
    await supabase.rpc("admin_confirm_payment", { p_payment_id: p.id });
    setBusy(null);
    await reload();
    await refreshProfile();
    toast.push("Private on. Welcome back.");
  };

  const revoke = async (p: Payment) => {
    if (busy || !supabase) return;
    setBusy(p.id);
    await supabase.rpc("admin_revoke_private", { p_user_id: p.user_id });
    setBusy(null);
    await reload();
    await refreshProfile();
    toast.push("Private off for this account.");
  };

  return (
    <AppShell>
      <div className="settings">
        <div className="settings-head">
          <span className="head-eyebrow">
            <LeafIcon size={13} />
            Billing desk
          </span>
          <h1>Payments</h1>
          <p>
            Confirm arrivals to switch Private on. One quiet glance a day is
            enough.
          </p>
        </div>

        <div className="settings-card spot-card">
          <h2>Waiting</h2>
          {pending.length === 0 ? (
            <p className="settings-empty">Nothing waiting. Good.</p>
          ) : (
            <ul className="admin-list">
              {pending.map((p) => (
                <li key={p.id} className="admin-item">
                  <div className="admin-item-info">
                    <strong>{p.email || "unknown"}</strong>
                    <span>
                      ${p.amount} · requested {fmt(p.created_at)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={busy === p.id}
                    onClick={() => void confirm(p)}
                  >
                    {busy === p.id ? "Confirming…" : "Confirm"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="settings-card spot-card">
          <h2>Private</h2>
          {settled.length === 0 ? (
            <p className="settings-empty">No one yet.</p>
          ) : (
            <ul className="admin-list">
              {settled.map((p) => {
                const expired =
                  p.status === "confirmed" &&
                  p.period_end &&
                  new Date(p.period_end) < new Date();
                return (
                  <li key={p.id} className="admin-item">
                    <div className="admin-item-info">
                      <strong>{p.email || "unknown"}</strong>
                      <span
                        className={
                          p.status === "confirmed" && !expired
                            ? "admin-status admin-status--ok"
                            : p.status === "confirmed"
                              ? "admin-status admin-status--warn"
                              : "admin-status"
                        }
                      >
                        {p.status} · {fmt(p.period_start)} → {fmt(p.period_end)}
                        {expired ? " · expired" : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={busy === p.id}
                      onClick={() => void revoke(p)}
                    >
                      {busy === p.id ? "Working…" : "Revoke"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}