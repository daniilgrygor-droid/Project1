import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Wordmark from "./Wordmark";
import CommandPalette from "./CommandPalette";

const LINKS = [
  { to: "/check-in", label: "Check-in" },
  { to: "/journey", label: "Journey" },
  { to: "/progress", label: "Progress" },
  { to: "/growth", label: "Growth" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState({ x: 0, y: 0, w: 0, h: 0, visible: false });
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const updatePill = useCallback(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLAnchorElement>(".nav-link--active");
    if (!nav || !active) {
      setPill((p) => (p.visible ? { ...p, visible: false } : p));
      return;
    }
    setPill({
      x: active.offsetLeft,
      y: active.offsetTop,
      w: active.offsetWidth,
      h: active.offsetHeight,
      visible: true,
    });
  }, []);

  useEffect(() => {
    updatePill();
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [updatePill, location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const signOut = () => {
    void supabase?.auth.signOut();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="wrap">
          <Wordmark />
          <nav ref={navRef} className="nav-links nav-links--main" aria-label="Main menu">
            {pill.visible && (
              <span
                className="nav-pill"
                style={{
                  transform: `translate(${pill.x}px, ${pill.y}px)`,
                  width: pill.w,
                  height: pill.h,
                }}
                aria-hidden="true"
              />
            )}
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " nav-link--active" : ""}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/settings" className="nav-link">
              Settings
            </Link>
            <button
              type="button"
              className="cmd-hint"
              onClick={() => setPaletteOpen(true)}
              title="Open command palette (Ctrl+K)"
            >
              <kbd>Ctrl K</kbd>
            </button>
            <button
              type="button"
              className="nav-signout"
              onClick={signOut}
              title="Sign out"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <div key={location.pathname} className="page-fade">
          {children}
        </div>
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
            replies. On the free tier, that data may be used to improve Google's
            models.
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

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}