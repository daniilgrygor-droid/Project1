import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import Calendar from "../components/Calendar";
import EntryCard from "../components/EntryCard";
import { LeafIcon, SearchIcon, SproutIcon } from "../components/icons";
import type { Category, Step } from "../lib/types";
import { CATEGORIES, MOODS, groupDayLabel } from "../lib/constants";
import { fetchSteps } from "../lib/steps";
import { groupByDay } from "../lib/stats";
import { registerUndoRestore } from "../lib/undoStore";

interface DayGroup {
  key: string;
  label: string;
  entries: Step[];
}

/* #42 — an empty journal is a page waiting for its first memory, not a
   missing asset. A faint timeline with one gently breathing marker. */
function EmptyJourney({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`steps-empty steps-empty--story journey-empty${
        compact ? " journey-empty--compact" : ""
      }`}
    >
      <div className="journey-empty-line" aria-hidden="true">
        <span className="journey-empty-line-rail" />
        <span className="journey-empty-line-marker">
          <LeafIcon size={13} />
        </span>
        <span className="journey-empty-line-rail" />
      </div>
      <p>
        {compact
          ? "Nothing recorded here yet. Whenever you're ready, the first small step can go in."
          : "Your days will slowly fill with little signs of showing up."}
      </p>
      <Link className="btn btn--primary btn--sm steps-empty-cta" to="/check-in">
        Mark your first step
      </Link>
    </div>
  );
}

export function JourneyTimeline() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<Category | null>(null);
  const [filterMood, setFilterMood] = useState<number | null>(null);
  const [tlIntro, setTlIntro] = useState(false);
  const [switching, setSwitching] = useState(false);
  const timelineRef = useRef<HTMLElement>(null);
  const prevDay = useRef<string | null>(null);

  useEffect(() => {
    void fetchSteps().then(setSteps);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(
    () =>
      registerUndoRestore((restored) => {
        setSteps((prev) => {
          if (!prev) return prev;
          if (prev.some((s) => s.id === restored.id)) return prev;
          return [...prev, restored].sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
        });
      }),
    [],
  );

  const groups = useMemo<DayGroup[]>(() => {
    if (!steps) return [];
    const byDay = groupByDay(steps);
    return [...byDay.entries()].map(([key, entries]) => ({
      key,
      label: groupDayLabel(entries[0].created_at),
      entries,
    }));
  }, [steps]);

  const filteredGroups = useMemo<DayGroup[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let source = groups;
    if (selectedDay) source = groups.filter((g) => g.key === selectedDay);
    if (!q && !filterCat && !filterMood) return source;
    return source
      .map((g) => ({
        ...g,
        entries: g.entries.filter((s) => {
          const matchQ = !q || s.note.toLowerCase().includes(q);
          const matchCat = !filterCat || s.category === filterCat;
          const matchMood = !filterMood || s.mood === filterMood;
          return matchQ && matchCat && matchMood;
        }),
      }))
      .filter((g) => g.entries.length > 0);
  }, [groups, debouncedQuery, selectedDay, filterCat, filterMood]);

  useEffect(() => {
    if (debouncedQuery) (window as any).plausible?.("search", { props: { query: debouncedQuery } });
  }, [debouncedQuery]);

  useEffect(() => {
    if (filterCat) (window as any).plausible?.("filter", { props: { type: "category", value: filterCat } });
  }, [filterCat]);

  useEffect(() => {
    if (filterMood) (window as any).plausible?.("filter", { props: { type: "mood", value: String(filterMood) } });
  }, [filterMood]);

  useEffect(() => {
    if (selectedDay && !groups.some((g) => g.key === selectedDay)) {
      setSelectedDay(null);
    }
  }, [groups, selectedDay]);

  useEffect(() => {
    const day = selectedDay ?? "all";
    if (prevDay.current !== null && prevDay.current !== day) {
      setSwitching(true);
      window.setTimeout(() => setSwitching(false), 220);
    }
    prevDay.current = day;
  }, [selectedDay]);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTlIntro(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const loading = steps === null;
  const emptyAll = !loading && steps.length === 0;
  const activeDays = groups.length;
  const weekCount = steps
    ? steps.filter(
        (s) => Date.now() - new Date(s.created_at).getTime() < 7 * 86400000,
      ).length
    : 0;
  const selectedLabel = selectedDay
    ? (groups.find((g) => g.key === selectedDay)?.label ?? selectedDay)
    : "";

  const updateStep = (updated: Step) =>
    setSteps((prev) => (prev ?? []).map((s) => (s.id === updated.id ? updated : s)));

  const removeStep = (id: string) =>
    setSteps((prev) => (prev ?? []).filter((s) => s.id !== id));

  return (
    <div className="journey">
        <div className="journey-head">
          <span className="head-eyebrow">
            <LeafIcon size={13} />
            Your days
          </span>
          <h1>Your Journey</h1>
          <p>
            Everything you've noticed — spread across days, ready to look back
            on.
          </p>
        </div>

        {steps && !emptyAll && (
          <div className="journey-stats" aria-label="A quick summary">
            <span className="chip">
              <SproutIcon size={13} />
              {steps.length} small step{steps.length === 1 ? "" : "s"}
            </span>
            <span className="chip">
              {activeDays} active day{activeDays === 1 ? "" : "s"}
            </span>
            <span className="chip">
              {weekCount} this week
            </span>
          </div>
        )}

        <section className="journey-calendar spot-card">
          {loading ? (
            <div
              className="sk-calendar"
              aria-busy="true"
              aria-label="Loading your calendar"
            >
              <div className="sk-cal-head">
                <span className="skeleton skeleton--sub" />
                <span className="skeleton skeleton--mini" />
              </div>
              <div className="sk-cal-grid">
                {Array.from({ length: 35 }).map((_, i) => (
                  <span key={i} className="skeleton sk-cal-cell" />
                ))}
              </div>
            </div>
          ) : emptyAll ? (
            <EmptyJourney />
          ) : (
            <Calendar
              steps={steps}
              selectedDay={selectedDay}
              onPickDay={(key) =>
                setSelectedDay((cur) => (cur === key ? null : key))
              }
            />
          )}
        </section>

        <section
          ref={timelineRef}
          className="journey-timeline"
          aria-label="Timeline of your steps"
        >
          <div className="journey-timeline-head">
            <div>
              <h2>{selectedDay ? selectedLabel : "Your days"}</h2>
              <p>
                {selectedDay
                  ? "Pick another day on the calendar to move around."
                  : "The line of things you chose to notice."}
              </p>
            </div>
            <div className="search-field">
              <span className="search-icon">
                <SearchIcon size={16} />
              </span>
              <input
                className="input"
                type="search"
                placeholder="Search your steps…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search your steps"
              />
            </div>
          </div>

          <div className="journey-filters" aria-label="Filter your steps">
            <div className="journey-filter-group">
              <span className="journey-filter-label">Category</span>
              <button
                type="button"
                className={`chip chip--filter${!filterCat ? " chip--on" : ""}`}
                onClick={() => setFilterCat(null)}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip chip--filter${filterCat === c.id ? " chip--on" : ""}`}
                  onClick={() => setFilterCat(filterCat === c.id ? null : (c.id as Category))}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="journey-filter-group">
              <span className="journey-filter-label">Mood</span>
              <button
                type="button"
                className={`chip chip--filter${!filterMood ? " chip--on" : ""}`}
                onClick={() => setFilterMood(null)}
              >
                All
              </button>
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`chip chip--filter${filterMood === m.value ? " chip--on" : ""}`}
                  onClick={() => setFilterMood(filterMood === m.value ? null : m.value)}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
            {(filterCat || filterMood) && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setFilterCat(null); setFilterMood(null); }}>
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <div
              className="sk-timeline"
              aria-busy="true"
              aria-label="Loading your timeline"
            >
              {Array.from({ length: 2 }).map((_, g) => (
                <div key={g} className="sk-group">
                  <div className="sk-group-head">
                    <span className="skeleton skeleton--tag" />
                    <span className="skeleton skeleton--mini" />
                  </div>
                  <div className="sk-entry">
                    <span className="sk-entry-dot" />
                    <div className="sk-entry-lines">
                      <span className="skeleton skeleton--text" />
                      <span className="skeleton skeleton--text skeleton--w60" />
                    </div>
                  </div>
                  <div className="sk-entry">
                    <span className="sk-entry-dot" />
                    <div className="sk-entry-lines">
                      <span className="skeleton skeleton--text" />
                      <span className="skeleton skeleton--text skeleton--w40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : emptyAll ? (
            <EmptyJourney compact />
          ) : filteredGroups.length === 0 ? (
            <div className="steps-empty steps-empty--story">
              {query || filterCat || filterMood ? (
                <>
                  <SearchIcon size={32} />
                  <p>
                    {query ? (
                      <>
                        No steps match "<strong>{query}</strong>".
                      </>
                    ) : (
                      "No steps match your filters."
                    )}
                  </p>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => { setQuery(""); setFilterCat(null); setFilterMood(null); }}
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <p>Nothing here yet.</p>
              )}
            </div>
          ) : (
            <ol
              className={`timeline-list${tlIntro ? " tl-intro" : ""}${
                switching ? " tl-fading" : ""
              }`}
            >
              {(() => {
                let idx = 0;
                return filteredGroups.map((g) => (
                  <Fragment key={g.key}>
                    <li className="timeline-group-head">
                      <span className="timeline-group-label">{g.label}</span>
                      <span className="timeline-group-count">
                        {g.entries.length === 1
                          ? "1 small step"
                          : `${g.entries.length} small steps`}
                      </span>
                    </li>
                    {g.entries.map((step) => {
                      const delay = Math.min(idx, 10) * 0.05;
                      idx += 1;
                      return (
                        <EntryCard
                          key={step.id}
                          step={step}
                          showTime
                          inlineReply
                          highlight={debouncedQuery}
                          className="timeline-entry"
                          style={{ animationDelay: `${delay}s` }}
                          onChanged={updateStep}
                          onDeleted={removeStep}
                        />
                      );
                    })}
                  </Fragment>
                ));
              })()}
            </ol>
          )}
        </section>

      <p className="steps-reassure">
        Every entry here is something you chose to notice. That's what counts.
      </p>
    </div>
  );
}

export default function Journey() {
  return (
    <AppShell>
      <JourneyTimeline />
    </AppShell>
  );
}