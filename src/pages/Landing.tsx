import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useRevealOnScroll } from "../lib/useRevealOnScroll";
import Wordmark from "../components/Wordmark";
import Tree from "../components/Tree";
import {
  SproutIcon,
  SunIcon,
  LeafIcon,
} from "../components/icons";

function FloatingLeaf({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`floating-leaf${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden="true"
    >
      <path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16Z" fill="currentColor" />
      <path
        d="M4 20c3-4 7-7 11-9"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function FaintBranch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 90 52"
      width="90"
      height="52"
      className={`quote-branch${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <path
        d="M4 46 C 26 38 52 24 84 6"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 36 C 36 30 42 27 48 25"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M52 24 C 58 20 64 17 70 15"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="50" cy="24" rx="7" ry="4" transform="rotate(-18 50 24)" fill="currentColor" />
      <ellipse cx="72" cy="13" rx="6.5" ry="3.5" transform="rotate(-12 72 13)" fill="currentColor" />
      <ellipse cx="32" cy="35" rx="6" ry="3.5" transform="rotate(-30 32 35)" fill="currentColor" />
    </svg>
  );
}

export default function Landing() {
  const { session } = useAuth();
  useRevealOnScroll();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");

  // Final tree scene: staged reveal as it scrolls into view (leaves → canopy
  // → full tree), with a very slight parallax. Skipped entirely for reduced
  // motion — the scene simply appears.
  const sceneRef = useRef<HTMLElement>(null);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tree = el.querySelector<HTMLElement>(".tree-scene-tree");
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / rect.height));
      if (progress > 0.25) setSettling(true);
      if (tree && !reduce) {
        tree.style.transform = `translateY(${((0.5 - progress) * 24).toFixed(1)}px)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || state === "sending") return;

    if (!supabase) {
      setState("error");
      return;
    }

    setState("sending");
    const { error } = await supabase.from("waitlist").insert({ email: value });

    if (error) {
      setState("error");
      return;
    }
    setState("done");
  };

  const journalHref = session ? "/check-in" : "/auth?mode=up";
  const journalLabel = "Open your journal";

  return (
    <div className="app landing">
      <header className="app-header app-header--landing">
        <div className="wrap">
          <Wordmark />
          <nav className="nav-links nav-links--landing" aria-label="Landing menu">
            <a href="#how" className="nav-link">
              How it works
            </a>
            <a href="#why" className="nav-link">
              Why this exists
            </a>
            <Link to="/privacy" className="nav-link">
              Privacy
            </Link>
            <Link to={journalHref} className="btn btn--primary btn--sm nav-cta-btn">
              {journalLabel}
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {/* ------------------------------------------------ hero */}
        <section className="hero hero--editorial">
          <div className="wrap hero-wrap">
            <div className="hero-copy reveal">
              <p className="hero-eyebrow">For those coming back</p>
              <h1>
                Small steps
                <br />
                <span className="hero-title-accent">back to life</span>
              </h1>
              <p className="hero-sub">
                A quiet place to notice what you did today.
              </p>

              <div className="hero-actions">
                <Link to={journalHref} className="btn btn--primary btn--lg">
                  {journalLabel}
                </Link>
              </div>

              <form className="waitlist" onSubmit={submit}>
                {state === "done" ? (
                  <div className="waitlist-thanks" role="status">
                    Thank you. We'll write when it's ready — no reminders, no
                    rush.
                  </div>
                ) : (
                  <>
                    <div className="field">
                      <label htmlFor="waitlist-email">
                        Or leave your email — one note when it's ready
                      </label>
                      <div className="waitlist-row">
                        <input
                          id="waitlist-email"
                          className="input"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@email.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (state === "error") setState("idle");
                          }}
                          disabled={state === "sending"}
                        />
                        <button
                          type="submit"
                          className="btn btn--ghost btn--letme"
                          disabled={state === "sending"}
                        >
                          {state === "sending"
                            ? "Writing it down…"
                            : "Let me know"}
                        </button>
                      </div>
                    </div>
                    {state === "error" && (
                      <p className="form-error">
                        That didn't work. Try again a little later.
                      </p>
                    )}
                    <p className="hero-note">
                      One email when it's ready. No newsletters, no “last
                      chance”.
                    </p>
                  </>
                )}
              </form>
            </div>

            <div className="hero-art reveal" style={{ transitionDelay: "80ms" }}>
              <FloatingLeaf
                className="floating-leaf--bg"
                style={{ top: "6%", left: "6%", color: "var(--tree-foliage-dark)" }}
              />
              <FloatingLeaf
                className="floating-leaf--near"
                style={{ top: "18%", right: "8%", color: "var(--tree-foliage)" }}
              />
              <FloatingLeaf
                className="floating-leaf--bg"
                style={{ bottom: "16%", left: "12%", color: "var(--tree-foliage-dark)" }}
              />
              <FloatingLeaf
                className="floating-leaf--fore"
                style={{ top: "42%", left: "-2%", color: "var(--accent-secondary)" }}
              />
              <FloatingLeaf
                className="floating-leaf--near"
                style={{ bottom: "8%", right: "4%", color: "var(--tree-foliage)" }}
              />
              <Tree size={520} variant="hero" className="hero-tree" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ how it works */}
        <section className="section reveal" id="how">
          <div className="wrap">
            <div className="section-head">
              <h2>How it works</h2>
              <p>Simple, warm, and pressure-free. No gamification, ever.</p>
            </div>
            <div className="feature-grid">
              <div className="feature-card reveal">
                <span className="feature-icon">
                  <SproutIcon size={22} />
                </span>
                <h3>One question a day</h3>
                <p>
                  A small moment of your day. That's it. No checklists, no
                  quotas, no must-dos.
                </p>
              </div>
              <div className="feature-card reveal" style={{ transitionDelay: "80ms" }}>
                <span className="feature-icon">
                  <SunIcon size={22} />
                </span>
                <h3>A warm reply, not a grade</h3>
                <p>
                  Your words get a personal response that actually hears you —
                  never a canned “great job”.
                </p>
              </div>
              <div className="feature-card reveal" style={{ transitionDelay: "160ms" }}>
                <span className="feature-icon">
                  <LeafIcon size={22} />
                </span>
                <h3>No streaks, ever</h3>
                <p>
                  No counters, no points, no “X days in a row”. Skip a week and
                  nothing breaks, and no one scolds you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ quote */}
        <section className="quote-section reveal">
          <div className="wrap">
            <div className="quote-band">
              <FaintBranch className="quote-branch--left" />
              <blockquote>
                “Coming back to life isn't a feat. It's a hundred small steps,
                and no one is required to notice them. Except us.”
              </blockquote>
              <FaintBranch className="quote-branch--right" />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ why this exists */}
        <section className="section reveal" id="why">
          <div className="wrap">
            <div className="section-head">
              <h2>Why this exists</h2>
              <p>A quieter way to look at what's already true.</p>
            </div>
            <div className="about-text">
              <p>
                After burnout or a long sick leave, the hardest thing is rarely
                the big plan — it's the first small one. A shower. One email.
                Ten minutes outside.
              </p>
              <p>
                Most tools answer that with streaks and scores. Small Steps
                answers with one question and a warm reply: what did you do
                today — and isn't that enough.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ how we use your entries */}
        <section className="section section--soft section--privacy reveal">
          <div className="wrap">
            <div className="section-head">
              <h2>How we use your entries</h2>
              <p>Honest, and in plain words.</p>
            </div>
            <div className="privacy-note">
              <p>
                To write your personal reply, your entry is sent to Google's
                Gemini API. Your journal is never sold or shared with anyone
                else.
              </p>
              <p>
                On the free tier, data sent to Gemini may be used by Google to
                improve its models. We're also working on a paid tier where
                replies are processed privately.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ start when you're ready */}
        <section className="section section--green reveal">
          <div className="wrap">
            <div className="section-head">
              <h2>Start when you're ready</h2>
              <p>There's no rush. The journal is almost ready — we'll write to you.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <Link to={journalHref} className="btn btn--primary btn--lg">
                {journalLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ final tree scene */}
        <section
          ref={sceneRef}
          className={`tree-scene reveal${settling ? " tree-scene--settling" : ""}`}
        >
          <div className="wrap">
            <div className="tree-scene-art">
              <FloatingLeaf
                className="floating-leaf--bg"
                style={{ top: "10%", left: "10%", color: "var(--tree-foliage-dark)" }}
              />
              <FloatingLeaf
                className="floating-leaf--near"
                style={{ top: "26%", right: "12%", color: "var(--accent-secondary)" }}
              />
              <FloatingLeaf
                className="floating-leaf--bg"
                style={{ bottom: "22%", left: "6%", color: "var(--tree-foliage)" }}
              />
              <FloatingLeaf
                className="floating-leaf--near"
                style={{ bottom: "30%", right: "6%", color: "var(--tree-foliage-dark)" }}
              />
              <FloatingLeaf
                className="floating-leaf--near"
                style={{ top: "4%", left: "42%", color: "var(--tree-foliage-dark)" }}
              />
              <FloatingLeaf
                className="floating-leaf--fore"
                style={{ top: "48%", left: "24%", color: "var(--tree-foliage)" }}
              />
              <Tree size={620} variant="scene" className="tree-scene-tree" />
            </div>
            <div className="tree-scene-caption">
              <Wordmark />
              <p>
                Small things, over time, become something larger.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="wrap">
          <Wordmark />
          <p>
            No quotas, no streaks, no points. Just you and your small steps,
            with no one grading them.
          </p>
          <p>
            Your entries are processed by Google's Gemini API to write your
            replies.
          </p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="footer-sep" aria-hidden="true">
              ·
            </span>
            <a href="mailto:hello@smallsteps.app">Contact &amp; feedback</a>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Small Steps.
          </p>
        </div>
      </footer>
    </div>
  );
}