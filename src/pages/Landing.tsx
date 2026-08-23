import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useRevealOnScroll } from "../lib/useRevealOnScroll";
import { CountUp } from "../lib/useCountUp";
import Wordmark from "../components/Wordmark";
import MarketingFooter from "../components/MarketingFooter";
import Tree from "../components/Tree";
import Magnet from "../components/Magnet";
import { useSpotlight } from "../lib/useSpotlight";
import { LeafIcon } from "../components/icons";

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
      {/* Branch */}
      <path
        d="M4 46 C 26 38 52 24 84 6"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Small twigs */}
      <path d="M30 36 C 36 30 42 27 48 25" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M52 24 C 58 20 64 17 70 15" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Flower at 32,35 — 5 petals + center */}
      <g transform="translate(32 35) rotate(-30)">
        <ellipse cx="0" cy="-4.2" rx="2.1" ry="2.8" fill="currentColor" opacity="0.95" />
        <ellipse cx="3.9" cy="-1.3" rx="2.1" ry="2.8" fill="currentColor" opacity="0.95" transform="rotate(72 3.9 -1.3)" />
        <ellipse cx="2.4" cy="3.4" rx="2.1" ry="2.8" fill="currentColor" opacity="0.95" transform="rotate(144 2.4 3.4)" />
        <ellipse cx="-2.4" cy="3.4" rx="2.1" ry="2.8" fill="currentColor" opacity="0.95" transform="rotate(216 -2.4 3.4)" />
        <ellipse cx="-3.9" cy="-1.3" rx="2.1" ry="2.8" fill="currentColor" opacity="0.95" transform="rotate(288 -3.9 -1.3)" />
        <circle cx="0" cy="0" r="1.6" fill="var(--bg)" />
        <circle cx="0" cy="0" r="0.9" fill="var(--accent-ochre)" />
      </g>
      {/* Leaf at 50,24 */}
      <g transform="translate(50 24) rotate(-18)">
        <path d="M-7 0 C -2 -4 2 -4 7 0 C 2 4 -2 4 -7 0 Z" fill="currentColor" />
        <path d="M-7 0 C -1 0 1 0 7 0" stroke="var(--bg)" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.5" />
      </g>
      {/* Flower at 72,13 */}
      <g transform="translate(72 13) rotate(-12)">
        <ellipse cx="0" cy="-3.8" rx="1.9" ry="2.5" fill="currentColor" opacity="0.95" />
        <ellipse cx="3.5" cy="-1.1" rx="1.9" ry="2.5" fill="currentColor" opacity="0.95" transform="rotate(72 3.5 -1.1)" />
        <ellipse cx="2.2" cy="3.1" rx="1.9" ry="2.5" fill="currentColor" opacity="0.95" transform="rotate(144 2.2 3.1)" />
        <ellipse cx="-2.2" cy="3.1" rx="1.9" ry="2.5" fill="currentColor" opacity="0.95" transform="rotate(216 -2.2 3.1)" />
        <ellipse cx="-3.5" cy="-1.1" rx="1.9" ry="2.5" fill="currentColor" opacity="0.95" transform="rotate(288 -3.5 -1.1)" />
        <circle cx="0" cy="0" r="1.4" fill="var(--bg)" />
        <circle cx="0" cy="0" r="0.8" fill="var(--accent-rose)" />
      </g>
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
    a: "Really. A journal and a warm reply after every entry, free forever. Private adds private AI processing and a few quiet extras for $48 a year — one human decision, not a subscription maze.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Small Steps runs in your browser, on any device. Your journal is saved in the cloud and follows you.",
  },
  {
    q: "Who is this for?",
    a: "People recovering from burnout, a long sick leave, or just a hard season. It's also for anyone who'd rather be a person than a productivity dashboard.",
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

const MARQUEE = [
  "No streaks",
  "No guilt",
  "No rush",
  "Your pace",
  "Small steps",
  "Come back anytime",
];

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
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");

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

              <div className="hero-proof">
                <span className="avatar-stack" aria-hidden="true">
                  <Avatar name="Anna" className="avatar--anna" />
                  <Avatar name="Maksym" className="avatar--maksym" />
                  <Avatar name="Olena" className="avatar--olena" />
                  <span className="avatar avatar--plus">+</span>
                </span>
                <p>
                  Quiet notes from people coming back — no streaks, no scores.
                </p>
              </div>
            </div>

            <ProductMockup />
          </div>
        </section>

        {/* ------------------------------------------------ proof strip */}
        <section className="section section--proof reveal">
          <div className="wrap">
            <div className="stat-strip">
              <div className="stat-chip reveal">
                <strong>
                  <CountUp value={0} />
                </strong>
                <span>streaks, points or guilt</span>
              </div>
              <div className="stat-chip reveal" style={{ transitionDelay: "80ms" }}>
                <strong>
                  <CountUp prefix="$" value={0} />
                </strong>
                <span>to start your journal</span>
              </div>
              <div className="stat-chip reveal" style={{ transitionDelay: "160ms" }}>
                <strong>
                  <CountUp value={100} suffix="%" />
                </strong>
                <span>your pace, always</span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ marquee */}
        <section className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((w, i) => (
              <span key={i}>
                {w}
                <LeafIcon size={13} className="mq-dot" />
              </span>
            ))}
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

        {/* ------------------------------------------------ waitlist */}
        <section className="section section--soft section--waitlist reveal" id="waitlist">
          <div className="wrap">
            <div className="section-head">
              <p className="section-eyebrow">Not ready yet?</p>
              <h2>Leave an email — one note when something new arrives</h2>
            </div>
            <form className="waitlist waitlist--center" onSubmit={submit}>
              {state === "done" ? (
                <div className="waitlist-thanks" role="status">
                  Thank you. If something genuinely new happens, we'll write —
                  no reminders, no rush.
                </div>
              ) : (
                <>
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
                      className="btn btn--primary"
                      disabled={state === "sending"}
                    >
                      {state === "sending" ? "Writing it down…" : "Let me know"}
                    </button>
                  </div>
                  {state === "error" && (
                    <p className="form-error">
                      That didn't work. Try again a little later.
                    </p>
                  )}
                  <p className="hero-note">
                    One email if something genuinely new happens. No
                    newsletters, no “last chance”.
                  </p>
                </>
              )}
            </form>
          </div>
        </section>

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

        {/* ------------------------------------------------ product showcase */}
        <ProductShowcase />

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
              <div className="quote-foliage" aria-hidden="true">
                <button type="button" className="foliage-item" style={{ top: "-8px", left: "2%", fontSize: "16px" }} onClick={(e) => e.currentTarget.classList.toggle("foliage-popped")}>🌸</button>
                <button type="button" className="foliage-item" style={{ top: "12px", right: "4%", fontSize: "14px" }} onClick={(e) => e.currentTarget.classList.toggle("foliage-popped")}>🍃</button>
                <button type="button" className="foliage-item" style={{ bottom: "-6px", left: "18%", fontSize: "13px" }} onClick={(e) => e.currentTarget.classList.toggle("foliage-popped")}>🌼</button>
                <button type="button" className="foliage-item" style={{ bottom: "8px", right: "16%", fontSize: "15px" }} onClick={(e) => e.currentTarget.classList.toggle("foliage-popped")}>🍂</button>
                <button type="button" className="foliage-item" style={{ top: "42%", left: "-6px", fontSize: "12px" }} onClick={(e) => e.currentTarget.classList.toggle("foliage-popped")}>🌿</button>
                <button type="button" className="foliage-item" style={{ top: "48%", right: "-8px", fontSize: "13px" }} onClick={(e) => e.currentTarget.classList.toggle("foliage-popped")}>🌷</button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ why this exists */}
        <section className="section reveal" id="why">
          <div className="wrap">
            <div className="section-head">
              <p className="section-eyebrow">Why this exists</p>
              <h2>A quieter way to look at what's already true</h2>
              <p>After burnout, the hardest thing is rarely the big plan — it's the first small one.</p>
            </div>
            <div className="about-text">
              <p>
                A shower. One email. Ten minutes outside. Most tools answer
                that with streaks and scores. Small Steps answers with one
                question and a warm reply: what did you do today — and isn't
                that enough.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ how we use your entries */}
        <section className="section section--soft section--privacy reveal">
          <div className="wrap">
            <div className="section-head">
              <p className="section-eyebrow">Privacy</p>
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
                improve its models. On Private, replies are processed
                privately.
              </p>
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

      <MarketingFooter />
    </div>
  );
}