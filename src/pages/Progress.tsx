import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EntryCard from "../components/EntryCard";
import {
  CategoryIcon,
  DotIcon,
  HeartIcon,
  LeafIcon,
  MoonIcon,
  SproutIcon,
  SunIcon,
} from "../components/icons";
import { relativeDate, type Category, type Step } from "../lib/types";
import {
  CATEGORY_LABEL,
  dayKey,
  MOODS,
  moodEmoji,
  MOOD_LABEL,
  WEEKDAY_SHORT,
} from "../lib/constants";
import { fetchSteps } from "../lib/steps";
import {
  ACHIEVEMENT_PROGRESS,
  MOMENTS_TITLE,
  thisWeekNoticed,
} from "../lib/copy";
import { registerUndoRestore } from "../lib/undoStore";
import {
  activityLastDays,
  buildMonthlyReflection,
  buildPatterns,
  categoryCounts,
  computeAchievements,
  computeStats,
  moodByCategory,
  moodByDayThisWeek,
  moodChangeOverMonth,
  moodDistribution,
  moodThisWeek,
  showedUpDaysThisMonth,
  type Pattern,
  weekSeries,
  weekSteps,
} from "../lib/stats";
import { useCountUp } from "../lib/useCountUp";

function patternIcon(kind: Pattern["kind"], size = 15) {
  switch (kind) {
    case "theme":
      return <LeafIcon size={size} />;
    case "category":
      return <SproutIcon size={size} />;
    case "weekday":
      return <SunIcon size={size} />;
    case "time":
      return <MoonIcon size={size} />;
    case "mood":
      return <HeartIcon size={size} />;
  }
}

function patternCount(kind: Pattern["kind"], count: number): string {
  if (kind === "theme") return `${count} time${count === 1 ? "" : "s"}`;
  return `${count} small step${count === 1 ? "" : "s"}`;
}

function activityLabel(key: string, count: number): string {
  const d = new Date(`${key}T12:00:00`);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${date} · ${count} small step${count === 1 ? "" : "s"}`;
}

function activityDateLabel(key: string): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ProgressOverview() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activePattern, setActivePattern] = useState<Pattern | null>(null);

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

  const stats = useMemo(() => (steps ? computeStats(steps) : null), [steps]);
  const reflection = useMemo(
    () => (steps ? buildMonthlyReflection(steps) : null),
    [steps],
  );
  const cats = useMemo(() => (steps ? categoryCounts(steps) : []), [steps]);
  const moods = useMemo(() => (steps ? moodDistribution(steps) : []), [steps]);
  const weekMoods = useMemo(() => (steps ? moodThisWeek(steps) : []), [steps]);
  const moodByDay = useMemo(
    () => (steps ? moodByDayThisWeek(steps) : []),
    [steps],
  );
  const moodDelta = useMemo(() => (steps ? moodChangeOverMonth(steps) : null), [steps]);
  const moodCats = useMemo(() => (steps ? moodByCategory(steps) : []), [steps]);
  const achievements = useMemo(() => (steps ? computeAchievements(steps) : []), [steps]);
  const patterns = useMemo(() => (steps ? buildPatterns(steps) : []), [steps]);
  const daysThisMonth = useMemo(
    () => (steps ? showedUpDaysThisMonth(steps) : 0),
    [steps],
  );
  const activity = useMemo(() => (steps ? activityLastDays(steps) : []), [steps]);
  const week = useMemo(() => (steps ? weekSeries(steps) : []), [steps]);
  const weekData = useMemo(() => (steps ? weekSteps(steps) : []), [steps]);
  const weekEntryCount = weekData.length;
  const weekActiveDays = useMemo(
    () => new Set(weekData.map((s) => dayKey(s.created_at))).size,
    [weekData],
  );
  const weekCats = useMemo(() => categoryCounts(weekData), [weekData]);
  const weekAvgMood = useMemo(() => {
    if (!weekMoods.length) return null;
    return Math.round(weekMoods.reduce((a, b) => a + b, 0) / weekMoods.length);
  }, [weekMoods]);

  const catSteps = useMemo(
    () =>
      steps && activeCategory
        ? steps.filter((s) => s.category === activeCategory)
        : [],
    [steps, activeCategory],
  );

  const maxCat = cats.length ? cats[0].count : 1;
  const maxActivity = Math.max(1, ...activity.map((d) => d.count));
  const activeDays28 = activity.filter((d) => d.count > 0).length;
  const todayKey = dayKey(new Date().toISOString());

  const animatedTotal = useCountUp(stats?.total ?? 0);
  const animatedWeek = useCountUp(weekEntryCount);
  const animatedActive = useCountUp(stats?.activeDays ?? 0);
  const animatedWeekActive = useCountUp(weekActiveDays);
  const animatedMonth = useCountUp(daysThisMonth);

  // A quiet look back: one entry from about a month ago, picked once per week.
  const monthAgoEntry = useMemo(() => {
    if (!steps || steps.length === 0) return null;
    const DAY = 86400000;
    const now = Date.now();
    const candidates = steps.filter((s) => {
      if (s.showed_up_only || !s.note) return false;
      const age = now - new Date(s.created_at).getTime();
      return age >= 26 * DAY && age <= 40 * DAY;
    });
    if (candidates.length === 0) return null;
    const d = new Date();
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / DAY + yearStart.getDay() + 1) / 7,
    );
    const key = `${d.getFullYear()}-${week}`;
    let h = 0;
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return candidates[h % candidates.length];
  }, [steps]);

  if (!steps) {
    return (
      <div className="progress">
        <div className="progress-skeleton" aria-busy="true" aria-label="Loading your progress">
          <span className="skeleton skeleton--head" />
          <span className="skeleton skeleton--sub" />
          <span className="skeleton skeleton--tiles" />
          <span className="skeleton skeleton--panel" />
          <span className="skeleton skeleton--text" />
          <span className="skeleton skeleton--text" />
        </div>
      </div>
    );
  }

  const empty = steps.length === 0;

  const recapLine =
    weekEntryCount === 0
      ? "This week is still unwritten."
      : weekEntryCount <= 2
        ? "A quiet week so far. Even the smallest steps count."
        : `You showed up on ${weekActiveDays} day${
            weekActiveDays === 1 ? "" : "s"
          } this week. All of these count.`;

  const commonCat = weekCats[0]?.category ?? null;
  const commonMood = weekAvgMood;

  return (
    <div className="progress">
      <div className="progress-head">
        <span className="head-eyebrow">
          <LeafIcon size={13} />
          Reflection
        </span>
        <h1>Your Progress</h1>
          <p>A gentle look at what you've already done — not a report card.</p>
        </div>

        {empty && (
          <div className="steps-empty steps-empty--story">
            <span className="steps-empty-plant">
              <LeafIcon size={20} />
            </span>
            <p>
              Your story starts with one small step. Patterns will appear as
              you keep noticing.
            </p>
            <Link className="btn btn--primary btn--sm steps-empty-cta" to="/check-in">
              Mark your first step
            </Link>
          </div>
        )}

        {!empty && stats && (
          <>
            <section className="progress-hero">
              <span className="progress-hero-eyebrow">So far</span>
              <div className="progress-hero-number">{animatedTotal}</div>
              <p className="progress-hero-line">
                small step{stats.total === 1 ? "" : "s"} across{" "}
                {stats.activeDays} active day{stats.activeDays === 1 ? "" : "s"}.
              </p>
              <div className="progress-hero-meta">
                {thisWeekNoticed(stats.weekCount)}
              </div>
            </section>

            <section className="reflect-grid" aria-label="A quiet summary">
              <div className="reflect-tile spot-card">
                <span className="reflect-tile-icon">
                  <SproutIcon size={15} />
                </span>
                <span className="reflect-tile-number">{animatedActive}</span>
                <span className="reflect-tile-label">Active days</span>
              </div>
              <div className="reflect-tile spot-card">
                <span className="reflect-tile-icon">
                  <SunIcon size={15} />
                </span>
                <span className="reflect-tile-number">{animatedWeekActive}</span>
                <span className="reflect-tile-label">Days this week</span>
              </div>
              <div className="reflect-tile spot-card">
                <span className="reflect-tile-icon">
                  <MoonIcon size={15} />
                </span>
                <span className="reflect-tile-number">{animatedMonth}</span>
                <span className="reflect-tile-label">Days this month</span>
              </div>
              <div className="reflect-tile spot-card">
                <span className="reflect-tile-icon">
                  <HeartIcon size={15} />
                </span>
                {commonCat ? (
                  <span className="reflect-tile-number reflect-tile-number--text">
                    {CATEGORY_LABEL[commonCat]}
                  </span>
                ) : commonMood != null ? (
                  <span className="reflect-tile-number reflect-tile-number--text">
                    {moodEmoji(commonMood)} {MOOD_LABEL[commonMood]}
                  </span>
                ) : (
                  <span className="reflect-tile-number reflect-tile-number--text">
                    —
                  </span>
                )}
                <span className="reflect-tile-label">Most often</span>
              </div>
            </section>

            <section className="progress-overview spot-card">
              <div className="progress-overview-head">
                <h2>Last 28 days</h2>
                <span className="progress-overview-note">one bar per day</span>
              </div>
              {activeDays28 < 5 && (
                <p className="progress-gentle progress-gentle--chart">
                  {activeDays28 === 0
                    ? "The chart will appear with your first few entries."
                    : "The chart will become more visible over the next few days."}
                </p>
              )}
              <div className="activity-chart">
                <div className="activity-bars">
                  {activity.map((d, i) => (
                    <div
                      key={d.key}
                      className={`activity-col${
                        d.key === todayKey ? " activity-col--today" : ""
                      }`}
                      data-tooltip={activityLabel(d.key, d.count)}
                    >
                      <span
                        className={`activity-bar${
                          d.count ? "" : " activity-bar--off"
                        }`}
                        style={{
                          height: d.count
                            ? `${Math.max(10, (d.count / maxActivity) * 100)}%`
                            : "2px",
                          animationDelay: `${i * 0.015}s`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="activity-labels" aria-hidden="true">
                  {activity.map((d, i) => (
                    <span key={d.key} className="activity-label">
                      {i % 7 === 0 ? activityDateLabel(d.key) : ""}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <div className="progress-cols">
              <section className="progress-block">
                <h2>Your categories</h2>
                {cats.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon">
                      <SproutIcon size={20} />
                    </span>
                    <p>Pick a category on the check-in to start seeing this.</p>
                  </div>
                ) : (
                  <>
                    <div className="cat-bars">
                      {cats.map((c) => (
                        <button
                          key={c.category}
                          type="button"
                          className="cat-bar"
                          onClick={() =>
                            setActiveCategory((cur) =>
                              cur === c.category ? null : c.category,
                            )
                          }
                        >
                          <span className="cat-bar-label">
                            <CategoryIcon category={c.category} size={15} />
                            {CATEGORY_LABEL[c.category]}
                          </span>
                          <span className="cat-bar-track">
                            <span
                              className="cat-bar-fill"
                              style={{ width: `${(c.count / maxCat) * 100}%` }}
                            />
                          </span>
                          <span className="cat-bar-count">{c.count}</span>
                        </button>
                      ))}
                    </div>

                    {activeCategory && (
                      <div className="cat-entries">
                        <div className="cat-entries-head">
                          <h3>{CATEGORY_LABEL[activeCategory]}</h3>
                          <span>
                            {catSteps.length} small step
                            {catSteps.length === 1 ? "" : "s"}
                          </span>
                          <button
                            type="button"
                            className="auth-inline-link"
                            onClick={() => setActiveCategory(null)}
                          >
                            Close
                          </button>
                        </div>
                        <ul className="steps-list">
                          {catSteps.map((step) => (
                            <EntryCard
                              key={step.id}
                              step={step}
                              onChanged={(updated) =>
                                setSteps((prev) =>
                                  (prev ?? []).map((s) =>
                                    s.id === updated.id ? updated : s,
                                  ),
                                )
                              }
                              onDeleted={(id) =>
                                setSteps((prev) =>
                                  (prev ?? []).filter((s) => s.id !== id),
                                )
                              }
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="progress-block">
                <h2>Your mood</h2>
                {moods.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state-icon">
                      <HeartIcon size={20} />
                    </span>
                    <p>If you add a mood to a step, patterns will appear here.</p>
                  </div>
                ) : (
                  <>
                    {weekMoods.length > 0 && (
                      <div className="mood-days">
                        {WEEKDAY_SHORT.map((label, i) => {
                          const m = moodByDay[i];
                          return (
                            <div
                              key={i}
                              className={`mood-day${
                                m != null ? " mood-day--set" : ""
                              }`}
                            >
                              <span className="mood-day-label">{label}</span>
                              <span className="mood-day-marker">
                                {m != null ? moodEmoji(m) : "·"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mood-grid">
                      {MOODS.map((m) => {
                        const count =
                          moods.find((x) => x.mood === m.value)?.count ?? 0;
                        return (
                          <div key={m.value} className="mood-stat">
                            <span className="mood-stat-emoji">{m.emoji}</span>
                            <span className="mood-stat-count">{count}</span>
                            <span className="mood-stat-label">{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {moodDelta != null && (
                      <p className="progress-gentle">
                        {moodDelta > 0.3
                          ? "Your mood has been trending upward this month."
                          : moodDelta < -0.3
                            ? "This month has felt a little harder — and that's part of the journey too."
                            : "Your mood has been steady this month."}
                      </p>
                    )}
                    {moodCats.length > 0 && (
                      <div className="mood-cats">
                        <span className="mood-cats-label">Mood by category</span>
                        <div className="mood-cats-row">
                          {moodCats.map((mc) => (
                            <span key={mc.category} className="mood-cat">
                              <CategoryIcon category={mc.category} size={14} />
                              {CATEGORY_LABEL[mc.category]}{" "}
                              {moodEmoji(Math.round(mc.avg))}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            <section className="progress-open spot-card">
              <h2>Patterns</h2>
              {patterns.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">
                    <LeafIcon size={20} />
                  </span>
                  <p>
                    More patterns will appear as you keep noticing your small
                    steps.
                  </p>
                </div>
              ) : (
                <>
                  <div className="patterns-grid">
                    {patterns.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`pattern-card${
                          activePattern?.id === p.id
                            ? " pattern-card--active"
                            : ""
                        }`}
                        onClick={() =>
                          setActivePattern((cur) => (cur?.id === p.id ? null : p))
                        }
                      >
                        <span className="pattern-icon">
                          {patternIcon(p.kind)}
                        </span>
                        <span className="pattern-title">{p.title}</span>
                        <span className="pattern-detail">{p.detail}</span>
                        <span className="pattern-count">
                          {patternCount(p.kind, p.count)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {activePattern && (
                    <div className="cat-entries">
                      <div className="cat-entries-head">
                        <h3>{activePattern.title}</h3>
                        <span>
                          {activePattern.refSteps.length} entry
                          {activePattern.refSteps.length === 1 ? "" : "s"}
                        </span>
                        <button
                          type="button"
                          className="auth-inline-link"
                          onClick={() => setActivePattern(null)}
                        >
                          Close
                        </button>
                      </div>
                      <ul className="steps-list">
                        {activePattern.refSteps.map((step) => (
                          <EntryCard
                            key={step.id}
                            step={step}
                            onChanged={(updated) =>
                              setSteps((prev) =>
                                (prev ?? []).map((s) =>
                                  s.id === updated.id ? updated : s,
                                ),
                              )
                            }
                            onDeleted={(id) =>
                              setSteps((prev) =>
                                (prev ?? []).filter((s) => s.id !== id),
                              )
                            }
                          />
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="recap-hero spot-card" aria-label="This week">
              <div className="recap-hero-top">
                <span className="recap-hero-eyebrow">This week</span>
                <div className="recap-mini" aria-hidden="true">
                  {week.map((d) => (
                    <span
                      key={d.key}
                      className={`recap-mini-day${
                        d.count ? " recap-mini-day--on" : ""
                      }`}
                      title={`${d.key}: ${d.count}`}
                    />
                  ))}
                </div>
              </div>
              <div className="recap-hero-count">{animatedWeek}</div>
              <p className="recap-hero-line">{recapLine}</p>
              {(commonCat || commonMood != null) && (
                <div className="recap-hero-tags">
                  {commonCat && (
                    <span className="recap-tag">
                      <CategoryIcon category={commonCat} size={13} />
                      Mostly {CATEGORY_LABEL[commonCat].toLowerCase()}
                    </span>
                  )}
                  {commonMood != null && (
                    <span className="recap-tag">
                      {moodEmoji(commonMood)} mostly{" "}
                      {MOOD_LABEL[commonMood].toLowerCase()}
                    </span>
                  )}
                </div>
              )}
              {weekCats.length > 0 && (
                <div className="week-topics">
                  <span className="week-topics-label">
                    This week you wrote about
                  </span>
                  <span className="week-topics-items">
                    {weekCats.map((c) => (
                      <span key={c.category} className="week-topic">
                        <CategoryIcon category={c.category} size={13} />
                        {CATEGORY_LABEL[c.category].toLowerCase()}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              <p className="progress-gentle">
                You showed up on {daysThisMonth} day
                {daysThisMonth === 1 ? "" : "s"} this month. Yesterday was
                quiet? Today still counts.
              </p>
            </section>

            <section className="progress-open spot-card progress-looking">
              <h2>Looking back</h2>
              {reflection && (
                <div className="monthly-reflection">
                  <p className="reflection-count">
                    {reflection.count} small step
                    {reflection.count === 1 ? "" : "s"} across{" "}
                    {reflection.activeDays} day
                    {reflection.activeDays === 1 ? "" : "s"} this month.
                  </p>
                  {reflection.text.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </section>

            <section className="progress-open spot-card">
              <h2>{MOMENTS_TITLE}</h2>
              <ul className="achievements-list">
                {achievements.map((a) => (
                  <li
                    key={a.id}
                    className={`achievement${a.earned ? " achievement--earned" : ""}`}
                  >
                    <span className="achievement-marker">
                      {a.earned ? (
                        <SproutIcon size={18} />
                      ) : (
                        <DotIcon size={11} />
                      )}
                    </span>
                    <div className="achievement-body">
                      <span className="achievement-title">{a.title}</span>
                      <span className="achievement-desc">{a.description}</span>
                      {a.earned ? (
                        <span className="achievement-progress achievement-progress--earned">
                          Unlocked
                        </span>
                      ) : a.progress != null && a.target != null ? (
                        <span className="achievement-progress">
                          <span className="achievement-track">
                            <span
                              className="achievement-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (a.progress / a.target) * 100,
                                )}%`,
                              }}
                            />
                          </span>
                          <span className="achievement-progress-text">
                            {ACHIEVEMENT_PROGRESS[a.id]?.(a.progress, a.target) ?? ""}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {monthAgoEntry && (
              <section className="progress-open spot-card progress-month-ago">
                <h2>A month ago, you wrote…</h2>
                <div className="month-ago-card">
                  <p className="month-ago-note">“{monthAgoEntry.note}”</p>
                  {monthAgoEntry.ai_response && (
                    <p className="month-ago-ai">
                      <em>{monthAgoEntry.ai_response}</em>
                    </p>
                  )}
                  <p className="month-ago-date">
                    {relativeDate(monthAgoEntry.created_at)}
                  </p>
                </div>
              </section>
            )}
          </>
        )}
    </div>
  );
}

export default function Progress() {
  return (
    <AppShell>
      <ProgressOverview />
    </AppShell>
  );
}