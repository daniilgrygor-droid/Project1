import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";
import { HeartIcon, LeafIcon, SunIcon } from "../components/icons";

export default function Privacy() {
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
              <HeartIcon size={13} />
              Privacy
            </span>
            <h1>Privacy Policy</h1>
            <p className="privacy-lead">
              Short, and in plain words. We built this place to feel safe, and
              that includes how your journal is handled.
            </p>
          </div>

          <div className="privacy-grid">
            <section className="privacy-card spot-card">
              <span className="privacy-card-icon">
                <LeafIcon size={16} />
              </span>
              <h2>What we keep</h2>
              <p>
                Your account email, and the small steps you write down. A step
                can include a category and a mood, but only if you choose them.
                You can delete any entry at any time.
              </p>
            </section>

            <section className="privacy-card spot-card">
              <span className="privacy-card-icon">
                <SunIcon size={16} />
              </span>
              <h2>How we use it</h2>
              <p>
                To write your personal reply, your entry is sent to Google's
                Gemini API. We don't sell your journal, and we don't share it
                with anyone else.
              </p>
              <p>
                On the free tier, data sent to Gemini may be used by Google to
                improve its models. On Private, replies are processed privately.
              </p>
            </section>

            <section className="privacy-card spot-card">
              <span className="privacy-card-icon">
                <HeartIcon size={16} />
              </span>
              <h2>Your control</h2>
              <p>
                You can edit or delete any entry in your journal, and sign out
                of your account whenever you want. If you'd like your data
                removed, write to us and we'll take care of it.
              </p>
            </section>
          </div>

          <div className="privacy-contact spot-card">
            <p>
              Questions?{" "}
              <a href="mailto:hello@smallsteps.app">hello@smallsteps.app</a>
            </p>
          </div>

          <p className="privacy-back">
            <Link to="/">Back to Small Steps</Link>
          </p>
        </div>
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