import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { isPrivate } from "../lib/types";
import Wordmark from "./Wordmark";
import CommandPalette from "./CommandPalette";
import FallingLeaves from "./FallingLeaves";
import {
  BookIcon,
  GearIcon,
  LeafIcon,
  PencilIcon,
  SproutIcon,
  SunIcon,
} from "./icons";

const LINKS = [
  { to: "/check-in", label: "Check-in", icon: <PencilIcon size={15} /> },
  { to: "/journey", label: "Journey", icon: <BookIcon size={15} /> },
  { to: "/progress", label: "Progress", icon: <SunIcon size={15} /> },
  { to: "/growth", label: "Growth", icon: <SproutIcon size={15} /> },
];

function initialsOf(email?: string | null): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = (parts.length > 1 ? [parts[0], parts[1]] : [parts[0]])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return letters || email.slice(0, 2).toUpperCase();
}

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, profile } = useAuth();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const card = target?.closest?.<HTMLElement>(".spot-card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
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

  const [routeBusy, setRouteBusy] = useState(false);
  const [routeOut, setRouteOut] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setRouteBusy(true);
    setRouteOut(false);
    const t = setTimeout(() => setRouteOut(true), 550);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const signOut = () => {
    void supabase?.auth.signOut();
  };

  return (
    <div className="app app--tabbed">
      <FallingLeaves />
      {routeBusy && (
        <div
          className={`route-bar${routeOut ? " route-bar--out" : ""}`}
          onAnimationEnd={() => {
            if (routeOut) setRouteBusy(false);
          }}
          aria-hidden="true"
        />
      )}
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
                <span className="nav-link-icon" aria-hidden="true">
                  {l.icon}
                </span>
                {l.label}
              </NavLink>
            ))}
            <Link to="/settings" className="nav-link">
              <span className="nav-link-icon" aria-hidden="true">
                <GearIcon size={15} />
              </span>
              Settings
            </Link>
            <span className="header-cluster">
              <Link
                to="/pricing"
                className={`plan-pill${profile && isPrivate(profile) ? " plan-pill--private" : ""}`}
                title={
                  profile && isPrivate(profile)
                    ? "You're on Private"
                    : "Upgrade to Private"
                }
              >
                <LeafIcon size={12} />
                {profile && isPrivate(profile) ? "Private" : "Go Private"}
              </Link>
              <Link to="/settings" className="app-avatar" title="Settings">
                {initialsOf(user?.email)}
              </Link>
            </span>
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

      <nav className="app-tabbar" aria-label="Primary">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `tabbar-link${isActive ? " tabbar-link--active" : ""}`
            }
          >
            <span className="tabbar-icon" aria-hidden="true">
              {l.icon}
            </span>
            {l.label}
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `tabbar-link${isActive ? " tabbar-link--active" : ""}`
          }
        >
          <span className="tabbar-icon" aria-hidden="true">
            <GearIcon size={18} />
          </span>
          Settings
        </NavLink>
      </nav>

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