import { useState } from "react";
import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";
import { useAuth } from "../lib/auth";
import { isPrivate, type Plan } from "../lib/types";
import {
  cancelPrivate,
  paymentDetails,
  PLANS,
  PRICE_YEARLY,
  requestPrivatePayment,
} from "../lib/billing";
import { LeafIcon } from "../components/icons";

const FAQ = [
  {
    q: "How does payment work?",
    a: "Private is one quiet payment of $48 a year. You transfer it to the details shown, press “I've paid”, and Private is switched on as soon as the payment arrives — usually within a day. No recurring charges, no cards saved.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — one tap from your settings, no guilt and no retention flow. Your journal stays exactly where it is.",
  },
  {
    q: "What happens if I don't renew?",
    a: "You quietly go back to the free plan. Every entry you've written stays, and your plant keeps growing.",
  },
  {
    q: "Why does Private cost money?",
    a: "Running a small, calm product without ads or data-selling. Private also covers processing your replies without using them to train AI models.",
  },
];

function TierCard({
  plan,
  featured,
  cta,
  onCta,
}: {
  plan: Plan;
  featured?: boolean;
  cta: string;
  onCta?: () => void;
}) {
  const p = PLANS[plan];
  return (
    <div className={`pricing-card${featured ? " pricing-card--featured" : ""}`}>
      <div className="pricing-card-top">
        <h2>{p.label}</h2>
        <p>{p.tagline}</p>
      </div>
      <div className="pricing-price">
        {plan === "free" ? (
          <>
            <span className="pricing-price-amount">$0</span>
            <span className="pricing-price-note">forever</span>
          </>
        ) : (
          <>
            <span className="pricing-price-amount">${PRICE_YEARLY}</span>
            <span className="pricing-price-note">one quiet payment a year</span>
          </>
        )}
      </div>
      <ul className="pricing-features">
        {p.features.map((f) => (
          <li key={f}>
            <LeafIcon size={14} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`btn btn--block${featured ? " btn--primary" : " btn--ghost"}`}
        onClick={onCta}
      >
        {cta}
      </button>
    </div>
  );
}

export default function Pricing() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [paying, setPaying] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const privateActive = profile !== null && isPrivate(profile);

  const goPrivate = async () => {
    if (!session) {
      window.location.href = "/auth?mode=up";
      return;
    }
    if (busy) return;
    setBusy(true);
    const row = await requestPrivatePayment(
      session.user.id,
      session.user.email ?? "",
    );
    setBusy(false);
    if (row) {
      setSent(true);
      setPaying(false);
    }
  };

  const goCancel = async () => {
    if (!session || busy) return;
    setBusy(true);
    const ok = await cancelPrivate(session.user.id);
    setBusy(false);
    if (ok) await refreshProfile();
  };

  return (
    <div className="app landing">
      <header className="app-header">
        <div className="wrap">
          <Wordmark />
          <nav className="nav-links" aria-label="Landing menu">
            <Link to="/#how" className="nav-link">
              How it works
            </Link>
            <Link to="/privacy" className="nav-link">
              Privacy
            </Link>
            <Link to="/" className="btn btn--ghost btn--sm">
              Back
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <section className="pricing">
          <div className="pricing-head">
            <p className="hero-eyebrow">Simple, honest pricing</p>
            <h1>One small question,</h1>
            <h1 className="pricing-head-accent">one quiet price.</h1>
            <p className="pricing-lead">
              No ads, no selling your data, no dark patterns. Just a journal
              that stays calm — and an option to keep your words closer.
            </p>
          </div>

          <div className="pricing-grid">
            <TierCard
              plan="free"
              cta={
                !loading
                  ? session
                    ? privateActive
                      ? "You're on Private"
                      : "Your current plan"
                    : "Start for free"
                  : "…"
              }
              onCta={
                session
                  ? undefined
                  : () => (window.location.href = "/auth?mode=up")
              }
            />
            <TierCard
              plan="private"
              featured
              cta={
                !loading
                  ? session
                    ? privateActive
                      ? "Cancel Private"
                      : "Go Private"
                    : "Sign in to go Private"
                  : "…"
              }
              onCta={
                session
                  ? privateActive
                    ? goCancel
                    : () => setPaying(true)
                  : () => (window.location.href = "/auth?mode=up")
              }
            />
          </div>

          {paying && session && !privateActive && (
            <div className="manual-pay" role="region" aria-label="Pay for Private">
              {sent ? (
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
                      className="btn btn--primary"
                      onClick={() => void goPrivate()}
                      disabled={busy}
                    >
                      {busy ? "Recording…" : "I've paid"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--quiet"
                      onClick={() => setPaying(false)}
                      disabled={busy}
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

          <section className="pricing-faq" aria-label="Frequently asked questions">
            <h2>A few honest answers</h2>
            <div className="pricing-faq-list">
              {FAQ.map((item) => (
                <details key={item.q} className="pricing-faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </section>
      </main>

      <footer className="app-footer">
        <div className="wrap">
          <Wordmark />
          <p>
            © {new Date().getFullYear()} Small Steps. No streaks, no guilt.
          </p>
        </div>
      </footer>
    </div>
  );
}