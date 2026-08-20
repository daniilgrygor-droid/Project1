import { Link } from "react-router-dom";
import Wordmark from "./Wordmark";

export default function MarketingFooter() {
  return (
    <footer className="app-footer footer--columns">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Wordmark />
            <p>
              No quotas, no streaks, no points. Just you and your small steps,
              with no one grading them.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="/#how">How it works</a>
              </li>
              <li>
                <Link to="/pricing">Pricing</Link>
              </li>
              <li>
                <Link to="/auth?mode=up">Start free</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li>
                <a href="/#faq">FAQ</a>
              </li>
              <li>
                <a href="mailto:hello@smallsteps.app">
                  Contact &amp; feedback
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Small Steps. Made quietly, for people
            coming back.
          </p>
        </div>
      </div>
    </footer>
  );
}