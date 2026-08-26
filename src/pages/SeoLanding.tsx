import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";
import MarketingFooter from "../components/MarketingFooter";
import { LeafIcon } from "../components/icons";
import { useAuth } from "../lib/authContext";

export interface SeoSection {
  heading: string;
  body: string[];
}

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoPageProps {
  eyebrow: string;
  title: string;
  lead: string;
  sections: SeoSection[];
  faq: SeoFaq[];
  ctaLabel?: string;
}

export default function SeoLanding({
  eyebrow,
  title,
  lead,
  sections,
  faq,
  ctaLabel = "Start free — one small step today",
}: SeoPageProps) {
  const { session } = useAuth();
  const journalHref = session ? "/check-in" : "/auth?mode=up";

  return (
    <div className="app landing">
      <header className="app-header app-header--landing">
        <div className="wrap">
          <Wordmark />
          <nav className="nav-links nav-links--landing" aria-label="Menu">
            <Link to="/pricing" className="nav-link">
              Pricing
            </Link>
            <Link to="/" className="btn btn--ghost btn--sm">
              Back
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <div className="privacy">
          <div className="privacy-head">
            <span className="head-eyebrow">
              <LeafIcon size={13} />
              {eyebrow}
            </span>
            <h1>{title}</h1>
            <p className="privacy-lead">{lead}</p>
            <div className="seo-cta-row">
              <Link to={journalHref} className="btn btn--primary btn--lg">
                {ctaLabel}
              </Link>
              <span className="seo-cta-note">Free forever · No streaks · No guilt</span>
            </div>
          </div>

          <div className="seo-sections">
            {sections.map((s) => (
              <section key={s.heading} className="seo-section spot-card">
                <h2>{s.heading}</h2>
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            ))}
          </div>

          <div className="seo-faq">
            <h2>Common questions</h2>
            {faq.map((f) => (
              <details key={f.q} className="faq-item spot-card">
                <summary>
                  <span>{f.q}</span>
                  <span className="faq-chevron" aria-hidden="true">
                    <LeafIcon size={13} />
                  </span>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>

          <div className="seo-final">
            <Link to={journalHref} className="btn btn--primary btn--lg">
              {ctaLabel}
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
