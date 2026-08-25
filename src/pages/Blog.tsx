import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";
import MarketingFooter from "../components/MarketingFooter";
import { LeafIcon } from "../components/icons";
import { POSTS } from "../lib/blogPosts";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Blog() {
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
              Journal
            </span>
            <h1>Small Steps blog</h1>
            <p className="privacy-lead">
              Notes on recovering gently — burnout, sick leave, and the art of
              the small step.
            </p>
          </div>

          <div className="blog-list">
            {POSTS.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="blog-card spot-card"
              >
                <span className="blog-tag">{p.tag}</span>
                <h2>{p.title}</h2>
                <p>{p.description}</p>
                <span className="blog-meta">
                  {fmtDate(p.date)} · {p.readMinutes} min read
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
