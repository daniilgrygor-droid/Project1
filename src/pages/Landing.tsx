import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import { useRevealOnScroll } from "../lib/useRevealOnScroll";
import Wordmark from "../components/Wordmark";
import MarketingFooter from "../components/MarketingFooter";
import Magnet from "../components/Magnet";
import { useSpotlight } from "../lib/useSpotlight";
import FaqJsonLd from "../components/FaqJsonLd";
import { LeafIcon } from "../components/icons";
import { PRICE_MONTHLY, PRICE_YEARLY } from "../lib/billing";

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

function ProductMockup() {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = wrapRef.current?.querySelector<HTMLElement>(".mockup");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * 7, ry: px * 9 });
  };

  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      ref={wrapRef}
      className="hero-mock reveal"
      style={{ transitionDelay: "100ms" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <FloatingLeaf
        className="floating-leaf--bg"
        style={{ top: "-6%", right: "-8%", color: "var(--tree-foliage)" }}
      />
      <FloatingLeaf
        className="floating-leaf--near"
        style={{ bottom: "-4%", left: "-6%", color: "var(--accent-secondary)" }}
      />
      <div
        className="mockup"
        style={{
          "--rx": `${tilt.rx}deg`,
          "--ry": `${tilt.ry}deg`,
        } as CSSProperties}
      >
        <div className="mockup-bar">
          <span className="mockup-dot" />
          <span className="mockup-dot" />
          <span className="mockup-dot" />
          <span className="mockup-url">smallsteps.app/check-in</span>
        </div>
        <div className="mockup-body">
          <span className="mock-date">Today</span>
          <p className="mock-question">What did you do today?</p>
          <div className="mock-input">
            <LeafIcon size={15} />
            Write something small…
            <span className="mock-caret" aria-hidden="true" />
          </div>
          <div className="mock-reply">
            <strong>That counts.</strong> A shower and one email is a full day
            after a hard season.
          </div>
        </div>
      </div>
      <span className="mock-glow" aria-hidden="true" />
    </div>
  );
}

const STEPS = [
  {
    num: "01",
    title: "One quiet question",
    text: "Each day opens with a small question — that's all. No checklists, no quotas, no must-dos.",
  },
  {
    num: "02",
    title: "A warm reply, not a grade",
    text: "Your words get a personal response that actually hears you — never a canned “great job”.",
  },
  {
    num: "03",
    title: "Small things, over time",
    text: "Your journal quietly grows into a record you can look back on — your own gentle progress.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "After burnout, the last thing I needed was another app yelling about streaks. This one just asks how my day went. It helped more than I expected.",
    author: "Anna",
    role: "Recovering from burnout",
    city: "Kyiv",
  },
  {
    quote:
      "I skipped two weeks and nothing broke. Nothing scolded me. That alone made me trust it.",
    author: "Maksym",
    role: "On his own pace",
    city: "Lviv",
  },
  {
    quote:
      "The reply isn't a grade. It hears me. That's the whole difference.",
    author: "Olena",
    role: "Returning after a hard season",
    city: "Odesa",
  },
];

const COMPARE_ROWS: { feature: string; us: boolean | string; them: boolean | string }[] = [
  { feature: "Daily question", us: "One, optional", them: "Checklists and quotas" },
  { feature: "Missed days", us: true, them: false },
  { feature: "Streaks and points", us: false, them: false },
  { feature: "Response to your words", us: "A warm, personal reply", them: "Badges and confetti" },
  { feature: "Reminders", us: "Off until you ask", them: "Push notifications by default" },
  { feature: "Your data", us: "Export or delete anytime", them: "Often locked in" },
];

const SHOWCASE_TABS = [
  { id: "checkin", label: "Check-in" },
  { id: "journey", label: "Journey" },
  { id: "progress", label: "Progress" },
] as const;

type ShowcaseTabId = (typeof SHOWCASE_TABS)[number]["id"];

const JOURNEY_ROWS = [
  { date: "Mar 12", text: "Took a shower and wrote one email." },
  { date: "Mar 13", text: "Walked ten minutes outside." },
  { date: "Mar 14", text: "Resting. That counts too." },
];

const BAR_HEIGHTS = [28, 44, 36, 62, 48, 78, 64];

const FAQ = [
  {
    q: "Is this a habit tracker?",
    a: "No. Small Steps is a journal. We never count days in a row, never score you, and never show a red 'missed' mark. The only metric that matters is the one you feel.",
  },
  {
    q: "What happens to my entries?",
    a: "Each entry gets one warm reply written by Google's Gemini API. Your journal is never sold or shared. On Private, replies are processed privately — on the free tier, data sent to Gemini may be used by Google to improve its models.",
  },
  {
    q: "What if I disappear for a month?",
    a: "Nothing breaks. Your journal waits for you, exactly as you left it. Coming back after a long pause is one more small step — and it's celebrated, not scolded.",
  },
  {
    q: "Is there really a free tier?",
    a: "Really. A journal and a warm reply after every entry, free forever. Private adds private AI processing and a few quiet extras for $48 a year — or $5 a month.",
  },
];

function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={`avatar${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  city,
}: {
  quote: string;
  author: string;
  role: string;
  city: string;
}) {
  const onMove = useSpotlight<HTMLElement>();
  return (
    <figure className="testimonial spot-card" onMouseMove={onMove}>
      <blockquote>
        <span className="testimonial-rating" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <LeafIcon key={i} size={13} />
          ))}
        </span>
        {quote}
      </blockquote>
      <figcaption>
        <Avatar name={author} className={`avatar--${author.toLowerCase()}`} />
        <span className="testimonial-meta">
          <strong>{author}</strong>
          <span>
            {role}, {city}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

function ProductShowcase() {
  const [tab, setTab] = useState<ShowcaseTabId>("checkin");
  const onMockMove = useSpotlight<HTMLDivElement>();

  return (
    <section className="section showcase-section reveal">
      <div className="wrap">
        <div className="section-head">
          <p className="section-eyebrow">A look inside</p>
          <h2>One app, three quiet rooms</h2>
          <p>Check in, look back, and watch your small steps add up.</p>
        </div>

        <div className="showcase" role="tablist" aria-label="Product views">
          {SHOWCASE_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`showcase-tab${tab === t.id ? " showcase-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mockup mock--big spot-card" onMouseMove={onMockMove}>
          <div className="mockup-bar">
            <span className="mockup-dot" />
            <span className="mockup-dot" />
            <span className="mockup-dot" />
            <span className="mockup-url">smallsteps.app/{tab}</span>
          </div>
          <div className="mockup-body pview" key={tab}>
            {tab === "checkin" && (
              <>
                <span className="mock-date">Today</span>
                <p className="mock-question">What did you do today?</p>
                <div className="mock-input">
                  <LeafIcon size={15} />
                  Write something small…
                  <span className="mock-caret" aria-hidden="true" />
                </div>
                <div className="mock-reply">
                  <strong>That counts.</strong> A shower and one email is a
                  full day after a hard season.
                </div>
              </>
            )}
            {tab === "journey" && (
              <div className="pjourney">
                {JOURNEY_ROWS.map((r) => (
                  <div className="pjourney-row" key={r.date}>
                    <span className="pjourney-date">{r.date}</span>
                    <span className="pjourney-text">{r.text}</span>
                    <LeafIcon size={15} className="pjourney-icon" />
                  </div>
                ))}
              </div>
            )}
            {tab === "progress" && (
              <div className="pprogress">
                <div className="pprogress-bars" aria-hidden="true">
                  {BAR_HEIGHTS.map((h, i) => (
                    <span
                      className="pbar"
                      key={i}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="pprogress-meta">
                  <span className="chip">14 small steps</span>
                  <span className="chip">7 days of noticing</span>
                  <span className="chip">0 streaks, 0 guilt</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { session } = useAuth();
  useRevealOnScroll();

  // Thin gradient bar at the very top while the page scrolls.
  const [scrollP, setScrollP] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const journalHref = session ? "/check-in" : "/auth?mode=up";
  const journalLabel = session ? "Open your journal" : "Start free";

  return (
    <div className="app landing">
      {scrollP > 0.02 && (
        <div
          className="scroll-progress"
          style={{ transform: `scaleX(${scrollP})` }}
          aria-hidden="true"
        />
      )}
      <header
        className={`app-header app-header--landing${
          scrolled ? " app-header--scrolled" : ""
        }`}
      >
        <div className="wrap">
          <Wordmark />
          <nav className="nav-links nav-links--landing" aria-label="Landing menu">
            <a href="#how" className="nav-link">
              How it works
            </a>
            <a href="#faq" className="nav-link">
              FAQ
            </a>
            <Link to="/pricing" className="nav-link">
              Pricing
            </Link>
            <Link to="/privacy" className="nav-link">
              Privacy
            </Link>
            {!session && (
              <Link to="/auth?mode=in" className="nav-link">
                Sign in
              </Link>
            )}
            <Link to={journalHref} className="btn btn--primary btn--sm nav-cta-btn">
              {journalLabel}
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {/* ------------------------------------------------ hero */}
        <section className="hero">
          <div className="wrap hero-wrap">
            <div className="hero-copy reveal">
              <p className="hero-eyebrow">For those coming back</p>
              <h1>
                Small steps
                <br />
                <span className="hero-title-accent text-grad">
                  back to life
                </span>
              </h1>
              <p className="hero-sub">
                A quiet place to notice what you did today — one question, one
                warm reply, no streaks and no guilt.
              </p>

              <div className="hero-actions">
                <Magnet>
                  <Link to={journalHref} className="btn btn--primary btn--lg">
                    {journalLabel}
                  </Link>
                </Magnet>
                <Magnet strength={5}>
                  <a href="#how" className="btn btn--ghost btn--lg">
                    See how it works
                  </a>
                </Magnet>
              </div>

              <p className="trustline">
                <span>
                  <span className="tick" aria-hidden="true">
                    ✓
                  </span>
                  No streaks, ever
                </span>
                <span>
                  <span className="tick" aria-hidden="true">
                    ✓
                  </span>
                  $0 to start
                </span>
                <span>
                  <span className="tick" aria-hidden="true">
                    ✓
                  </span>
                  Your pace, always
                </span>
              </p>
            </div>

            <ProductMockup />
          </div>
        </section>

        {/* ------------------------------------------------ how it works */}
        <section className="section reveal" id="how">
          <div className="wrap">
            <div className="section-head">
              <p className="section-eyebrow">How it works</p>
              <h2>Three small things, in this order</h2>
              <p>Simple, warm, and pressure-free. No gamification, ever.</p>
            </div>
            <div className="step-grid">
              {STEPS.map((s, i) => (
                <div
                  className="step-card reveal"
                  style={{ transitionDelay: `${i * 80}ms` }}
                  key={s.num}
                >
                  <span className="step-num">{s.num}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  {i < STEPS.length - 1 && (
                    <span className="step-arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ product showcase */}
        <ProductShowcase />

        {/* ------------------------------------------------ testimonials */}
        <section className="section reveal">
          <div className="wrap">
            <div className="section-head">
              <p className="section-eyebrow">From the journal</p>
              <h2>Quiet notes from people coming back</h2>
            </div>
            <div className="testimonial-grid">
              {TESTIMONIALS.map((t, i) => (
                <div
                  className="reveal"
                  style={{ transitionDelay: `${i * 80}ms` }}
                  key={t.author}
                >
                  <TestimonialCard
                    quote={t.quote}
                    author={t.author}
                    role={t.role}
                    city={t.city}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ comparison */}
        <section className="section reveal" id="compare">
          <div className="wrap">
            <div className="section-head">
              <p className="section-eyebrow">A different kind of tracker</p>
              <h2>Built calm, on purpose</h2>
              <p>
                Most habit apps compete for your attention. Small Steps is
                built to need as little of it as possible.
              </p>
            </div>
            <div className="compare-wrap spot-card">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="visually-hidden">Feature</span>
                    </th>
                    <th scope="col" className="compare-us">
                      Small Steps
                    </th>
                    <th scope="col" className="compare-them">
                      Typical habit trackers
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <th scope="row">{row.feature}</th>
                      <td className="compare-us">
                        {typeof row.us === "string" ? (
                          row.us
                        ) : row.us ? (
                          <span className="compare-yes" aria-label="Yes">
                            <LeafIcon size={13} />
                          </span>
                        ) : (
                          <span className="compare-no" aria-label="No">
                            —
                          </span>
                        )}
                      </td>
                      <td className="compare-them">
                        {typeof row.them === "string" ? (
                          row.them
                        ) : row.them ? (
                          <span className="compare-yes" aria-label="Yes">
                            <LeafIcon size={13} />
                          </span>
                        ) : (
                          <span className="compare-no" aria-label="No">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ pricing teaser */}
        <section className="section section--soft section--pricing-teaser reveal" id="pricing">
          <div className="wrap">
            <div className="section-head">
              <p className="section-eyebrow">Pricing</p>
              <h2>Start free. Stay free. Or go Private.</h2>
            </div>
            <div className="teaser-grid">
              <div className="teaser-card spot-card">
                <h3>The quiet journal</h3>
                <p className="teaser-price">$0 <span>forever</span></p>
                <ul>
                  <li><LeafIcon size={14} /> One gentle question a day</li>
                  <li><LeafIcon size={14} /> Warm, personal AI replies</li>
                  <li><LeafIcon size={14} /> Journey, progress and your plant</li>
                </ul>
                <Link to={journalHref} className="btn btn--ghost btn--block">
                  {session ? "Your current plan" : "Start for free"}
                </Link>
              </div>
              <div className="teaser-card teaser-card--featured spot-card">
                <span className="pricing-pop" aria-hidden="true">Most popular</span>
                <h3>Private</h3>
                <p className="teaser-price">
                  ${PRICE_MONTHLY}<span>/mo</span> · ${PRICE_YEARLY}<span>/yr</span>
                </p>
                <ul>
                  <li><LeafIcon size={14} /> Everything in the quiet journal</li>
                  <li><LeafIcon size={14} /> Private AI — never trains models</li>
                  <li><LeafIcon size={14} /> Gentle reminders & weekly notes</li>
                </ul>
                <Link to="/pricing" className="btn btn--primary btn--block">
                  See Private
                </Link>
              </div>
            </div>
            <p className="teaser-note">
              Secure checkout via Stripe · Cancel anytime · Your data stays yours
            </p>
          </div>
        </section>

        {/* ------------------------------------------------ quote */}
        <section className="quote-section reveal">
          <div className="wrap">
            <div className="quote-band">
              <blockquote>
                “Coming back to life isn't a feat. It's a hundred small steps,
                and no one is required to notice them. Except us.”
              </blockquote>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ FAQ */}
        <section className="section section--soft section--faq reveal" id="faq">
          <div className="wrap">
            <div className="section-head">
              <p className="section-eyebrow">Questions</p>
              <h2>Asked quietly, answered honestly</h2>
              <p>No pressure. Take what you need.</p>
            </div>
            <div className="faq-list">
              {FAQ.map((f, i) => (
                <details className="faq-item spot-card" key={i}>
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
            <FaqJsonLd items={FAQ} />
          </div>
        </section>

        {/* ------------------------------------------------ CTA */}
        <section className="section reveal">
          <div className="wrap">
            <div className="cta-band">
              <h2>Start when you're ready.</h2>
              <p>
                There's no rush. Begin with one small step — free, and forever
                quiet.
              </p>
              <Link to={journalHref} className="btn btn--primary btn--lg">
                {journalLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}