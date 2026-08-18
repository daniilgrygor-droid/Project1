import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";

export default function Privacy() {
  return (
    <div className="app landing">
      <header className="app-header">
        <div className="wrap">
          <Wordmark />
          <nav className="nav-links">
            <Link to="/" className="btn btn--ghost btn--sm">
              Back
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <div className="privacy">
          <h1>Privacy Policy</h1>
          <p className="privacy-lead">
            Short, and in plain words. We built this place to feel safe, and
            that includes how your journal is handled.
          </p>

          <h2>What we keep</h2>
          <p>
            Your account email, and the small steps you write down. A step can
            include a category and a mood, but only if you choose them. You can
            delete any entry at any time.
          </p>

          <h2>How we use it</h2>
          <p>
            To write your personal reply, your entry is sent to Google's Gemini
            API. We don't sell your journal, and we don't share it with anyone
            else.
          </p>
          <p>
            On the free tier, data sent to Gemini may be used by Google to
            improve its models. We're also working on a paid tier where replies
            are processed privately.
          </p>

          <h2>Your control</h2>
          <p>
            You can edit or delete any entry in your journal, and sign out of
            your account whenever you want. If you'd like your data removed,
            write to us and we'll take care of it.
          </p>

          <p className="privacy-contact">
            Questions? <a href="mailto:hello@smallsteps.app">hello@smallsteps.app</a>
          </p>

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
