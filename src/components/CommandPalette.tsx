import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { applyTheme, readThemePreference, writeThemePreference } from "../lib/theme";
import { applyTextSize, readTextSize, TEXT_SIZES } from "../lib/textSize";
import {
  BookIcon,
  GearIcon,
  HeartIcon,
  LeafIcon,
  MoonIcon,
  PencilIcon,
  SearchIcon,
  SproutIcon,
  SunIcon,
} from "./icons";

function themeLabel(): string {
  const t = readThemePreference();
  if (t === "light") return "Light";
  if (t === "dark") return "Dark";
  return "Auto";
}

function textSizeLabel(): string {
  const id = readTextSize();
  return TEXT_SIZES.find((t) => t.id === id)?.label ?? "Default";
}

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  keywords: string;
  icon: ReactNode;
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const curTheme = themeLabel();
  const curTextSize = textSizeLabel();

  const items = useMemo<PaletteItem[]>(() => {
    const go = (to: string) => () => {
      navigate(to);
      onClose();
    };
    const cycleTheme = () => {
      const cur = readThemePreference();
      const next = cur === "light" ? "dark" : cur === "dark" ? "auto" : "light";
      writeThemePreference(next);
      applyTheme(next);
      onClose();
    };
    const cycleTextSize = () => {
      const cur = readTextSize();
      const idx = TEXT_SIZES.findIndex((t) => t.id === cur);
      const next = TEXT_SIZES[(idx + 1) % TEXT_SIZES.length];
      applyTextSize(next.id);
      onClose();
    };
    const signOut = () => {
      void supabase?.auth.signOut();
      onClose();
    };
    return [
      { id: "checkin", group: "Go to", label: "Check-in", keywords: "mark note today entry", icon: <PencilIcon size={15} />, run: go("/check-in") },
      { id: "journey", group: "Go to", label: "Journey", keywords: "history calendar days timeline", icon: <BookIcon size={15} />, run: go("/journey") },
      { id: "progress", group: "Go to", label: "Progress", keywords: "stats patterns mood analytics reflection", icon: <LeafIcon size={15} />, run: go("/progress") },
      { id: "growth", group: "Go to", label: "Growth", keywords: "plant tree milestones stage", icon: <SproutIcon size={15} />, run: go("/growth") },
      { id: "settings", group: "Go to", label: "Settings", keywords: "preferences theme text size account", icon: <GearIcon size={15} />, run: go("/settings") },
      { id: "privacy", group: "Go to", label: "Privacy", keywords: "policy data", icon: <HeartIcon size={15} />, run: go("/privacy") },
      { id: "theme", group: "Actions", label: "Switch theme", keywords: "dark light auto appearance", icon: <SunIcon size={15} />, hint: curTheme, run: cycleTheme },
      { id: "textsize", group: "Actions", label: "Change text size", keywords: "font larger smaller reading", icon: <MoonIcon size={15} />, hint: curTextSize, run: cycleTextSize },
      { id: "signout", group: "Actions", label: "Sign out", keywords: "logout exit", icon: <SunIcon size={15} />, run: signOut },
    ];
  }, [navigate, onClose, curTheme, curTextSize]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      `${i.label} ${i.keywords}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const move = (dir: 1 | -1) => {
    setActive((cur) => {
      const len = filtered.length;
      if (len === 0) return 0;
      return (cur + dir + len) % len;
    });
  };

  const pick = (item: PaletteItem) => item.run();

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    }
  };

  let lastGroup = "";

  return (
    <div
      className="cmd-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={onClose}
      onKeyDown={onKeyDown}
    >
      <div className="cmd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-row">
          <span className="cmd-item-icon">
            <SearchIcon size={16} />
          </span>
          <input
            ref={inputRef}
            className="cmd-input"
            type="text"
            placeholder="Where do you want to go?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search commands"
          />
        </div>

        <div className="cmd-list" ref={listRef} role="listbox">
          {filtered.length === 0 && (
            <p className="cmd-empty">Nothing found for “{query}”.</p>
          )}
          {filtered.map((item, i) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={item.id} role="presentation">
                {showGroup && (
                  <span className="cmd-group-label" role="presentation">
                    {item.group}
                  </span>
                )}
                <button
                  ref={i === active ? activeRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  className={`cmd-item${i === active ? " cmd-item--active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(item)}
                >
                  <span className="cmd-item-icon">{item.icon}</span>
                  {item.label}
                  {item.hint && (
                    <span className="cmd-item-desc">{item.hint}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="cmd-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>↵</kbd> to choose
          </span>
          <span>
            <kbd>esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
