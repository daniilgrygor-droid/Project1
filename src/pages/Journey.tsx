import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import Calendar from "../components/Calendar";
import EntryCard from "../components/EntryCard";
import SproutLoader from "../components/SproutLoader";
import { LeafIcon, SearchIcon } from "../components/icons";
import type { Step } from "../lib/types";
import { groupDayLabel } from "../lib/constants";
import { fetchSteps } from "../lib/steps";
import { groupByDay } from "../lib/stats";
import { registerUndoRestore } from "../lib/undoStore";

interface DayGroup {
  key: string;
  label: string;
  entries: Step[];
}

export function JourneyTimeline() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [query, setQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [tlIntro, setTlIntro] = useState(false);
  const [switching, setSwitching] = useState(false);
  const timelineRef = useRef<HTMLElement>(null);
  const prevDay = useRef<string | null>(null);

  useEffect(() => {
    void fetchSteps().then(setSteps);
  }, []);

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
    const q = query.trim().toLowerCase();
    let source = groups;
    if (selectedDay) source = groups.filter((g) => g.key === selectedDay);
    if (!q) return source;
    return source
      .map((g) => ({
        ...g,
        entries: g.entries.filter((s) => s.note.toLowerCase().includes(q)),
      }))
      .filter((g) => g.entries.length > 0);
  }, [groups, query, selectedDay]);

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

        <section className="journey-calendar">
          {loading ? (
            <SproutLoader />
          ) : emptyAll ? (
            <div className="steps-empty steps-empty--story">
              <span className="steps-empty-plant">
                <LeafIcon size={20} />
              </span>
              <p>Your days will slowly fill with little signs of showing up.</p>
              <Link className="btn btn--primary btn--sm steps-empty-cta" to="/check-in">
                Mark your first step
              </Link>
            </div>
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

          {loading ? (
            <SproutLoader />
          ) : emptyAll ? (
            <div className="steps-empty steps-empty--story">
              <span className="steps-empty-plant">
                <LeafIcon size={20} />
              </span>
              <p>
                Nothing recorded here yet. Whenever you're ready, the first
                small step can go in.
              </p>
              <Link className="btn btn--primary btn--sm steps-empty-cta" to="/check-in">
                Mark your first step
              </Link>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="steps-empty steps-empty--story">
              <p>
                {query
                  ? "No small steps found here yet."
                  : "Nothing here yet."}
              </p>
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