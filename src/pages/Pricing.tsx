import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";
import MarketingFooter from "../components/MarketingFooter";
import { useAuth } from "../lib/auth";
import { isPrivate, type Plan } from "../lib/types";
import { PLANS, PRICE_MONTHLY, PRICE_YEARLY } from "../lib/billing";
import { LeafIcon } from "../components/icons";
import { useSpotlight } from "../lib/useSpotlight";

const COMPARE: { feature: string; free: boolean; priv: boolean }[] = [
  { feature: "One gentle question a day", free: true, priv: true },
  { feature: "Warm, personal AI replies", free: true, priv: true },
  { feature: "Mood & category markers", free: true, priv: true },
  { feature: "Gentle reminders & weekly notes", free: false, priv: true },
  {
    feature: "Private AI processing — never trains models",
    free: false,
    priv: true,
  },
];

const FAQ = [
  {
    q: "How does payment work?",
    a: "Private is a simple Stripe checkout — $5 a month or $48 a year (save $12). No cards saved on our end, cancel anytime.",
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
  interval,
}: {
  plan: Plan;
  featured?: boolean;
  cta: string;
  onCta?: () => void;
  interval?: "month" | "year";
}) {
  const p = PLANS[plan];
  const onMove = useSpotlight<HTMLDivElement>();
  return (
    <div
      className={`pricing-card spot-card${featured ? " pricing-card--featured" : ""}`}
      onMouseMove={onMove}
    >
      {featured && (
        <span className="pricing-pop" aria-hidden="true">
          Most popular
        </span>
      )}
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
        ) : interval === "month" ? (
          <>
            <span className="pricing-price-amount">${PRICE_MONTHLY}</span>
            <span className="pricing-price-note">per month</span>
          </>
        ) : (
          <>
            <span className="pricing-price-amount">${PRICE_YEARLY}</span>
            <span className="pricing-price-note">per year</span>
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
      {plan === "free" && (
        <p className="pricing-card-trust">No credit card required</p>
      )}
      {plan === "private" && (
        <p className="pricing-card-trust">Secure checkout via Stripe</p>
      )}
    </div>
  );
}

export default function Pricing() {
  const { session, profile, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [showSticky, setShowSticky] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const privateActive = profile !== null && isPrivate(profile);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goPrivate = async () => {
    if (!session) {
      window.location.href = "/auth?mode=up";
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          email: session.user.email,
          interval,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const openPortal = async () => {
    if (!profile?.stripe_customer_id || busy) return;
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
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
            <span className="head-eyebrow">
              <LeafIcon size={13} />
              Honest pricing
            </span>
            <h1>One small question,</h1>
            <h1 className="pricing-head-accent">one quiet price.</h1>
            <p className="pricing-lead">
              No ads, no selling your data, no dark patterns. Just a journal
              that stays calm — and an option to keep your words closer.
            </p>
          </div>

          <div className="pricing-toggle" role="group" aria-label="Billing interval">
            <button
              type="button"
              className={`pricing-toggle-btn${interval === "month" ? " pricing-toggle-btn--active" : ""}`}
              onClick={() => setInterval("month")}
              aria-pressed={interval === "month"}
            >
              Monthly — ${PRICE_MONTHLY}/mo
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn${interval === "year" ? " pricing-toggle-btn--active" : ""}`}
              onClick={() => setInterval("year")}
              aria-pressed={interval === "year"}
            >
              Yearly — ${PRICE_YEARLY}/yr
              <span className="pricing-toggle-save">Save $12</span>
            </button>
          </div>

          <div className="pricing-grid" ref={gridRef}>
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
              interval={interval}
              cta={
                !loading
                  ? session
                    ? privateActive
                      ? "Manage subscription"
                      : busy
                        ? "Redirecting…"
                        : "Go Private"
                    : "Sign in to go Private"
                  : "…"
              }
              onCta={
                session
                  ? privateActive
                    ? openPortal
                    : goPrivate
                  : () => (window.location.href = "/auth?mode=up")
              }
            />
          </div>

          <div className="pricing-guarantee">
            <span>
              <LeafIcon size={14} />
              Secure checkout via Stripe
            </span>
            <span>
              <LeafIcon size={14} />
              Cancel anytime from settings
            </span>
            <span>
              <LeafIcon size={14} />
              Your data stays yours
            </span>
            <span>
              <LeafIcon size={14} />
              No ads, no tracking
            </span>
          </div>

          <section
            className="pricing-compare reveal"
            aria-label="Compare plans"
          >
            <h2>Free vs Private</h2>
            <table className="compare">
              <thead>
                <tr>
                  <th>What you get</th>
                  <th>Free</th>
                  <th className="col--featured">Private</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td className={row.free ? "compare-yes" : "compare-no"}>
                      {row.free ? "✓" : "—"}
                    </td>
                    <td
                      className={`col--featured${row.priv ? " compare-yes" : " compare-no"}`}
                    >
                      {row.priv ? "✓" : "—"}
                    </td>
                  </tr>
                ))}
                <tr className="compare-price">
                  <td>Starting from</td>
                  <td>$0</td>
                  <td className="col--featured">
                    ${PRICE_MONTHLY}/mo or ${PRICE_YEARLY}/yr
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section
            className="pricing-faq"
            aria-label="Frequently asked questions"
          >
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

      {showSticky && session && !privateActive && (
        <div className="pricing-sticky">
          <span>
            Private — ${interval === "month" ? `${PRICE_MONTHLY}/mo` : `${PRICE_YEARLY}/yr`}
          </span>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={goPrivate}
            disabled={busy}
          >
            {busy ? "Redirecting…" : "Go Private"}
          </button>
        </div>
      )}

      <MarketingFooter />
    </div>
  );
}
