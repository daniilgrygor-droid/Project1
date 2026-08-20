import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { JourneyTimeline } from "./Journey";
import EntryCard from "../components/EntryCard";
import { fetchSteps } from "../lib/steps";
import { dayKey, CATEGORY_LABEL, MOOD_LABEL, moodEmoji } from "../lib/constants";
import { CategoryIcon, LeafIcon, SproutIcon } from "../components/icons";
import type { Category, Step } from "../lib/types";

type JourneyTab = "timeline" | "overview";

interface MonthGroup {
  key: string;
  label: string;
  entries: Step[];
  activeDays: number;
  dayCells: boolean[];
  first?: Step;
  last?: Step;
  topCategory: Category | null;
  topMood: number | null;
}

function buildMonths(steps: Step[]): MonthGroup[] {
  const byMonth = new Map<string, Step[]>();
  for (const s of steps) {
    const key = s.created_at.slice(0, 7);
    const arr = byMonth.get(key) ?? [];
    arr.push(s);
    byMonth.set(key, arr);
  }

  const months: MonthGroup[] = [];
  for (const [key, entries] of byMonth) {
    entries.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const [y, m] = key.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const daySet = new Set(entries.map((s) => dayKey(s.created_at)));
    const dayCells: boolean[] = [];
    for (let d = 1; d <= daysInMonth; d += 1) {
      const day = `${key}-${String(d).padStart(2, "0")}`;
      dayCells.push(daySet.has(day));
    }

    const cats = new Map<string, number>();
    const moods = new Map<number, number>();
    for (const s of entries) {
      if (s.category) cats.set(s.category, (cats.get(s.category) ?? 0) + 1);
      if (s.mood != null) moods.set(s.mood, (moods.get(s.mood) ?? 0) + 1);
    }
    let topCategory: Category | null = null;
    let catBest = 0;
    for (const [c, n] of cats) {
      if (n > catBest) {
        catBest = n;
        topCategory = c as Category;
      }
    }
    let topMood: number | null = null;
    let moodBest = 0;
    for (const [mm, n] of moods) {
      if (n > moodBest) {
        moodBest = n;
        topMood = mm;
      }
    }

    months.push({
      key,
      label: new Date(y, m - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      entries,
      activeDays: daySet.size,
      dayCells,
      first: entries[0],
      last: entries[entries.length - 1],
      topCategory,
      topMood,
    });
  }

  months.sort((a, b) => (a.key < b.key ? 1 : -1));
  return months;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function MonthOverview() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    void fetchSteps().then(setSteps);
  }, []);

  const months = useMemo(() => (steps ? buildMonths(steps) : []), [steps]);

  const update = (updated: Step) => {
    setSteps((prev) =>
      prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev,
    );
  };

  const remove = (id: string) => {
    setSteps((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
  };

  if (!steps) {
    return (
      <div className="progress">
        <div
          className="progress-skeleton"
          aria-busy="true"
          aria-label="Loading your months"
        >
          <span className="skeleton skeleton--head" />
          <span className="skeleton skeleton--sub" />
          <span className="skeleton skeleton--panel" />
          <span className="skeleton skeleton--panel" />
          <span className="skeleton skeleton--text" />
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="months">
        <div className="months-head">
          <span className="head-eyebrow">
            <SproutIcon size={13} />
            Months
          </span>
          <h1>Your months</h1>
          <p>Your journal, month by month. Open one to re-read its small steps.</p>
        </div>
        <div className="steps-empty steps-empty--story">
          <span className="steps-empty-plant">
            <LeafIcon size={20} />
          </span>
          <p>Your first month will appear here after a few small steps.</p>
          <Link className="btn btn--primary btn--sm steps-empty-cta" to="/check-in">
            Mark your first step
          </Link>
        </div>
      </div>
    );
  }

  const totalSteps = months.reduce((acc, m) => acc + m.entries.length, 0);
  const totalDays = months.reduce((acc, m) => acc + m.activeDays, 0);

  return (
    <div className="months">
      <div className="months-head">
        <span className="head-eyebrow">
          <SproutIcon size={13} />
          Months
        </span>
        <h1>Your months</h1>
        <p>
          {totalSteps} small step{totalSteps === 1 ? "" : "s"} across{" "}
          {totalDays} active day{totalDays === 1 ? "" : "s"} — open a month to
          re-read it.
        </p>
      </div>

      <div className="months-grid">
        {months.map((m) => {
          const open = expanded === m.key;
          return (
            <section
              key={m.key}
              className={`month-card spot-card${open ? " month-card--open" : ""}`}
            >
              <button
                type="button"
                className="month-card-head"
                onClick={() => setExpanded((cur) => (cur === m.key ? null : m.key))}
                aria-expanded={open}
              >
                <span className="month-card-title">
                  <strong>{m.label}</strong>
                  <span>
                    {m.entries.length} small step{m.entries.length === 1 ? "" : "s"}
                    {m.activeDays !== m.entries.length &&
                      ` · ${m.activeDays} active day${m.activeDays === 1 ? "" : "s"}`}
                  </span>
                </span>
                <span className="month-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>

              <div className="month-dots" aria-hidden="true">
                {m.dayCells.map((on, i) => (
                  <span key={i} className={`month-dot${on ? " month-dot--on" : ""}`} />
                ))}
              </div>

              {(m.topCategory || m.topMood != null) && (
                <div className="month-chips">
                  {m.topCategory && (
                    <span className="chip">
                      <CategoryIcon category={m.topCategory} size={13} />
                      {CATEGORY_LABEL[m.topCategory]}
                    </span>
                  )}
                  {m.topMood != null && (
                    <span className="chip">
                      {moodEmoji(m.topMood)} {MOOD_LABEL[m.topMood]}
                    </span>
                  )}
                </div>
              )}

              {(m.first?.note || (m.last && m.last !== m.first && m.last.note)) && (
                <div className="month-moments">
                  {m.first?.note && (
                    <p className="month-moment">
                      <span>First</span> {truncate(m.first.note, 90)}
                    </p>
                  )}
                  {m.last && m.last !== m.first && m.last.note && (
                    <p className="month-moment">
                      <span>Last</span> {truncate(m.last.note, 90)}
                    </p>
                  )}
                </div>
              )}

              {open && (
                <div className="month-entries">
                  {m.entries.map((s) => (
                    <EntryCard
                      key={s.id}
                      step={s}
                      showTime
                      inlineReply
                      onChanged={update}
                      onDeleted={remove}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function JourneyOverview() {
  const [tab, setTab] = useState<JourneyTab>("timeline");

  return (
    <AppShell>
      <div className="journey-merged">
        <div className="page-tabs" role="tablist" aria-label="Journey views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "timeline"}
            className={`page-tab${tab === "timeline" ? " page-tab--on" : ""}`}
            onClick={() => setTab("timeline")}
          >
            Timeline
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "overview"}
            className={`page-tab${tab === "overview" ? " page-tab--on" : ""}`}
            onClick={() => setTab("overview")}
          >
            Months
          </button>
        </div>
        <div
          className={`journey-tab-pane${
            tab === "timeline" ? " journey-tab-pane--active" : ""
          }`}
          role="tabpanel"
        >
          <JourneyTimeline />
        </div>
        <div
          className={`journey-tab-pane${
            tab === "overview" ? " journey-tab-pane--active" : ""
          }`}
          role="tabpanel"
        >
          <MonthOverview />
        </div>
      </div>
    </AppShell>
  );
}