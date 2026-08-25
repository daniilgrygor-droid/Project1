import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { isPrivate } from "../lib/types";
import Wordmark from "./Wordmark";
import CommandPalette from "./CommandPalette";
import {
  BookIcon,
  GearIcon,
  LeafIcon,
  PencilIcon,
  SearchIcon,
  SignOutIcon,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
              <button
                type="button"
                className="search-pill"
                onClick={() => setPaletteOpen(true)}
                aria-label="Search (Ctrl+K)"
              >
                <SearchIcon size={14} />
                <span className="search-pill-text">Search…</span>
                <kbd>Ctrl K</kbd>
              </button>
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
              <div className="avatar-menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="app-avatar"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  title="Account"
                >
                  {initialsOf(user?.email)}
                </button>
                {menuOpen && (
                  <div className="avatar-menu spot-card" role="menu">
                    <div className="avatar-menu-head">
                      <span className="avatar avatar--menu">
                        {initialsOf(user?.email)}
                      </span>
                      <span className="avatar-menu-id">
                        <strong>{profile?.name || "Your journal"}</strong>
                        <span>{user?.email}</span>
                      </span>
                    </div>
                    <div className="avatar-menu-sep" aria-hidden="true" />
                    <Link to="/settings" className="avatar-menu-item" role="menuitem">
                      <GearIcon size={15} />
                      Settings
                    </Link>
                    <Link to="/pricing" className="avatar-menu-item" role="menuitem">
                      <LeafIcon size={15} />
                      {profile && isPrivate(profile) ? "Manage plan" : "Upgrade to Private"}
                    </Link>
                    <div className="avatar-menu-sep" aria-hidden="true" />
                    <button
                      type="button"
                      className="avatar-menu-item avatar-menu-item--danger"
                      role="menuitem"
                      onClick={signOut}
                    >
                      <SignOutIcon size={15} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </span>
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