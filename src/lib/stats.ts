import type { Category, Step } from "./types";
import {
  CATEGORY_LABEL,
  dayKey,
  MOOD_LABEL,
  moodEmoji,
  startOfMonth,
  startOfWeek,
  WEEKDAY_NAMES,
} from "./constants";
import { smallStepsNoticedThisWeek } from "./copy";

// ---------------------------------------------------------------- grouping

export function groupByDay(steps: Step[]): Map<string, Step[]> {
  const map = new Map<string, Step[]>();
  for (const s of steps) {
    const key = dayKey(s.created_at);
    const arr = map.get(key);
    if (arr) arr.push(s);
    else map.set(key, [s]);
  }
  return map;
}

// ---------------------------------------------------------------- gentle stats

export interface ProgressStats {
  total: number;
  activeDays: number;
  weekCount: number;
  monthCount: number;
  mostActiveDay: { day: string; count: number } | null;
  topCategory: { category: Category; count: number } | null;
  avgPerActiveDay: number | null;
}

export function computeStats(steps: Step[]): ProgressStats {
  const total = steps.length;
  const byDay = groupByDay(steps);
  const activeDays = byDay.size;

  const weekStart = startOfWeek().getTime();
  const monthStart = startOfMonth().getTime();
  let weekCount = 0;
  let monthCount = 0;
  for (const s of steps) {
    const t = new Date(s.created_at).getTime();
    if (t >= weekStart) weekCount++;
    if (t >= monthStart) monthCount++;
  }

  let mostActiveDay: ProgressStats["mostActiveDay"] = null;
  for (const [day, arr] of byDay) {
    if (!mostActiveDay || arr.length > mostActiveDay.count) {
      mostActiveDay = { day, count: arr.length };
    }
  }

  const catCounts = new Map<Category, number>();
  for (const s of steps) {
    if (!s.category) continue;
    catCounts.set(s.category, (catCounts.get(s.category) ?? 0) + 1);
  }
  let topCategory: ProgressStats["topCategory"] = null;
  for (const [category, count] of catCounts) {
    if (!topCategory || count > topCategory.count) {
      topCategory = { category, count };
    }
  }

  const avgPerActiveDay = activeDays > 0 ? total / activeDays : null;

  return { total, activeDays, weekCount, monthCount, mostActiveDay, topCategory, avgPerActiveDay };
}

export function categoryCounts(steps: Step[]): { category: Category; count: number }[] {
  const counts = new Map<Category, number>();
  for (const s of steps) {
    if (!s.category) continue;
    counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------- mood

export function moodDistribution(steps: Step[]): { mood: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const s of steps) {
    if (s.mood == null) continue;
    counts.set(s.mood, (counts.get(s.mood) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => a.mood - b.mood);
}

export function averageMood(steps: Step[]): number | null {
  const withMood = steps.filter((s) => s.mood != null);
  if (!withMood.length) return null;
  return (
    withMood.reduce((sum, s) => sum + (s.mood as number), 0) / withMood.length
  );
}

export function moodThisWeek(steps: Step[]): number[] {
  const weekStart = startOfWeek().getTime();
  return steps
    .filter((s) => s.mood != null && new Date(s.created_at).getTime() >= weekStart)
    .map((s) => s.mood as number);
}

// Average mood per day of the current week (Monday-first); null = no mood that day.
export function moodByDayThisWeek(steps: Step[]): (number | null)[] {
  const monday = startOfWeek();
  const out: (number | null)[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = dayKey(d.toISOString());
    const dayMoods = steps
      .filter((s) => s.mood != null && dayKey(s.created_at) === key)
      .map((s) => s.mood as number);
    if (!dayMoods.length) {
      out.push(null);
    } else {
      out.push(
        Math.round(dayMoods.reduce((sum, m) => sum + m, 0) / dayMoods.length),
      );
    }
  }
  return out;
}

export function moodChangeOverMonth(steps: Step[]): number | null {
  const monthStart = startOfMonth().getTime();
  const now = new Date();
  const midMonth = new Date(now.getFullYear(), now.getMonth(), 15).getTime();
  const firstHalf = steps.filter(
    (s) => s.mood != null &&
      new Date(s.created_at).getTime() >= monthStart &&
      new Date(s.created_at).getTime() < midMonth,
  );
  const secondHalf = steps.filter(
    (s) => s.mood != null &&
      new Date(s.created_at).getTime() >= midMonth,
  );
  if (!firstHalf.length || !secondHalf.length) return null;
  const avg = (arr: Step[]) =>
    arr.reduce((sum, s) => sum + (s.mood as number), 0) / arr.length;
  return avg(secondHalf) - avg(firstHalf);
}

export function moodByCategory(steps: Step[]): {
  category: Category;
  avg: number;
  count: number;
}[] {
  const buckets = new Map<Category, { sum: number; count: number }>();
  for (const s of steps) {
    if (!s.category || s.mood == null) continue;
    const b = buckets.get(s.category) ?? { sum: 0, count: 0 };
    b.sum += s.mood;
    b.count += 1;
    buckets.set(s.category, b);
  }
  return [...buckets.entries()]
    .map(([category, b]) => ({ category, avg: b.sum / b.count, count: b.count }))
    .sort((a, b) => b.avg - a.avg);
}

// ---------------------------------------------------------------- weeks / recap

export function stepsByWeek(steps: Step[]): number {
  const weekStart = startOfWeek().getTime();
  return steps.filter((s) => new Date(s.created_at).getTime() >= weekStart).length;
}

export function activeDaysByWeek(steps: Step[]): number {
  const weekStart = startOfWeek().getTime();
  return new Set(
    steps
      .filter((s) => new Date(s.created_at).getTime() >= weekStart)
      .map((s) => dayKey(s.created_at)),
  ).size;
}

// Steps for the current week (Monday-first), oldest entry first.
export function weekSteps(steps: Step[]): Step[] {
  const weekStart = startOfWeek().getTime();
  return steps
    .filter((s) => new Date(s.created_at).getTime() >= weekStart)
    .sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
}

// One entry per day of the current week (Monday-first) — for the recap mini-chart.
export function weekSeries(steps: Step[]): { key: string; count: number }[] {
  const monday = startOfWeek();
  const byDay = groupByDay(steps);
  const out: { key: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = dayKey(d.toISOString());
    out.push({ key, count: byDay.get(key)?.length ?? 0 });
  }
  return out;
}

// Soft activity series for the "last N days" overview chart.
export function activityLastDays(
  steps: Step[],
  days = 28,
): { key: string; count: number; day: number }[] {
  const byDay = groupByDay(steps);
  const out: { key: string; count: number; day: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = dayKey(d.toISOString());
    out.push({ key, count: byDay.get(key)?.length ?? 0, day: d.getDate() });
  }
  return out;
}

export interface WeekRecap {
  text: string[];
  hasData: boolean;
}

export function buildWeekRecap(steps: Step[]): WeekRecap {
  const weekSteps = steps.filter(
    (s) => new Date(s.created_at).getTime() >= startOfWeek().getTime(),
  );
  if (weekSteps.length === 0) {
    return {
      hasData: false,
      text: [
        "This week was quiet here.",
        "You don't need to make up for it.",
      ],
    };
  }

  const lines: string[] = [];
  lines.push(smallStepsNoticedThisWeek(weekSteps.length));
  lines.push(`You showed up on ${activeDaysByWeek(steps)} day${activeDaysByWeek(steps) === 1 ? "" : "s"}.`);

  const cats = categoryCounts(weekSteps);
  if (cats.length >= 2) {
    const top = cats[0];
    const second = cats[1];
    lines.push(`Most of your steps were related to ${cap(top.category)} and ${cap(second.category)}.`);
  } else if (cats.length === 1) {
    lines.push(`Most of your steps were related to ${cap(cats[0].category)}.`);
  }

  const moods = moodThisWeek(steps);
  if (moods.length) {
    const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
    lines.push(`Your most common mood was ${moodEmoji(Math.round(avg))}.`);
  }

  if (weekSteps.length <= 3) {
    lines.push(`That's still ${weekSteps.length} thing${weekSteps.length === 1 ? "" : "s"} you chose to notice.`);
  } else {
    lines.push("All of these count.");
  }

  return { hasData: true, text: lines };
}

// ---------------------------------------------------------------- monthly reflection

export interface MonthlyReflection {
  count: number;
  activeDays: number;
  text: string[];
  hasData: boolean;
}

export function buildMonthlyReflection(steps: Step[]): MonthlyReflection {
  const monthStart = startOfMonth().getTime();
  const monthSteps = steps.filter((s) => new Date(s.created_at).getTime() >= monthStart);
  if (monthSteps.length === 0) {
    return {
      count: 0,
      activeDays: 0,
      hasData: false,
      text: ["No entries this month yet — and that's okay. There's no rush."],
    };
  }

  const active = new Set(monthSteps.map((s) => dayKey(s.created_at))).size;
  const cats = categoryCounts(monthSteps);
  const line1 =
    cats.length >= 2
      ? `This month you kept coming back to small acts of ${cap(cats[0].category)} and ${cap(cats[1].category)}.`
      : cats.length === 1
        ? `This month, many of your steps were connected to ${cap(cats[0].category)}.`
        : "This month, your steps were your own — and that's the point.";

  const lines = [line1];
  if (monthSteps.length < 5) {
    lines.push(`You had ${monthSteps.length} entr${monthSteps.length === 1 ? "y" : "ies"} — every one of them counts.`);
  }

  return { count: monthSteps.length, activeDays: active, hasData: true, text: lines };
}

function cap(c: string): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

// ---------------------------------------------------------------- repetitions

const THEMES: { key: string; words: string[] }[] = [
  { key: "walking", words: ["walk", "walked", "walking", "stroll", "outside", "hike", "park", "run", "ran"] },
  { key: "rest", words: ["rest", "rested", "nap", "sleep", "slept", "bed", "break"] },
  { key: "water", words: ["shower", "wash", "washed", "bath", "brush", "teeth", "glass of water", "hydrate"] },
  { key: "reading", words: ["read", "reading", "book", "chapter"] },
  { key: "cooking", words: ["cook", "cooked", "meal", "breakfast", "lunch", "dinner", "tea", "coffee"] },
  { key: "cleaning", words: ["clean", "cleaned", "tidy", "dishes", "laundry", "made bed", "vacuum"] },
  { key: "connecting", words: ["call", "called", "friend", "message", "messaged", "text", "talked", "met"] },
  { key: "study", words: ["study", "studied", "learn", "learned", "homework", "lesson"] },
];

export function repeatedThemes(steps: Step[]): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of steps) {
    const t = s.note.toLowerCase();
    for (const theme of THEMES) {
      if (theme.words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(t))) {
        counts.set(theme.key, (counts.get(theme.key) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export const THEME_LABEL: Record<string, string> = {
  walking: "walking",
  rest: "rest",
  water: "taking care of yourself",
  reading: "reading",
  cooking: "cooking or food",
  cleaning: "tidying up",
  connecting: "connecting with people",
  study: "learning",
};

// ---------------------------------------------------------------- patterns

export interface Pattern {
  id: string;
  kind: "theme" | "category" | "weekday" | "mood" | "time";
  title: string;
  detail: string;
  count: number;
  refSteps: Step[];
}

function matchesTheme(note: string, key: string): boolean {
  const theme = THEMES.find((t) => t.key === key);
  if (!theme) return false;
  const t = note.toLowerCase();
  return theme.words.some((w) => new RegExp(`\\b${w}\\b`, "i").test(t));
}

function mostCommonWeekday(steps: Step[]): {
  index: number;
  name: string;
  count: number;
} | null {
  const counts = new Map<number, number>();
  for (const s of steps) {
    const wd = new Date(s.created_at).getDay();
    counts.set(wd, (counts.get(wd) ?? 0) + 1);
  }
  let best: { index: number; name: string; count: number } | null = null;
  for (const [index, count] of counts) {
    if (!best || count > best.count) {
      best = { index, name: WEEKDAY_NAMES[index], count };
    }
  }
  return best;
}

// Gentle observations, never a diagnosis. Max three, chosen by support.
export function buildPatterns(steps: Step[]): Pattern[] {
  const candidates: Pattern[] = [];

  const themes = repeatedThemes(steps);
  if (themes.length) {
    const t = themes[0];
    candidates.push({
      id: `theme-${t.key}`,
      kind: "theme",
      title: `You keep coming back to ${THEME_LABEL[t.key] ?? t.key}.`,
      detail: "A small act that repeats is worth noticing.",
      count: t.count,
      refSteps: steps.filter((s) => matchesTheme(s.note, t.key)),
    });
  }

  const cats = categoryCounts(steps);
  if (cats.length && cats[0].count >= 3) {
    const c = cats[0];
    candidates.push({
      id: `category-${c.category}`,
      kind: "category",
      title: `${CATEGORY_LABEL[c.category]} shows up most often.`,
      detail: "Many of your steps are connected to this area.",
      count: c.count,
      refSteps: steps.filter((s) => s.category === c.category),
    });
  }

  const distinctWeekdays = new Set(steps.map((s) => new Date(s.created_at).getDay()));
  if (steps.length >= 3 && distinctWeekdays.size >= 2) {
    const wd = mostCommonWeekday(steps);
    if (wd && wd.count >= 2) {
      candidates.push({
        id: `weekday-${wd.index}`,
        kind: "weekday",
        title: `${wd.name} tends to be your day.`,
        detail: "That's when you checked in most often.",
        count: wd.count,
        refSteps: steps.filter((s) => new Date(s.created_at).getDay() === wd.index),
      });
    }
  }

  const moodCat = moodByCategory(steps).find((mc) => mc.avg >= 4 && mc.count >= 2);
  if (moodCat) {
    const rounded = Math.round(moodCat.avg);
    candidates.push({
      id: `mood-${moodCat.category}`,
      kind: "mood",
      title: `Your mood was usually ${MOOD_LABEL[rounded].toLowerCase()} on ${CATEGORY_LABEL[moodCat.category].toLowerCase()} days.`,
      detail: "A quiet connection between what you did and how you felt.",
      count: moodCat.count,
      refSteps: steps.filter(
        (s) => s.category === moodCat.category && s.mood != null,
      ),
    });
  }

  // Time of day: a gentle "context" rhythm, shown only with enough entries.
  if (steps.length >= 4) {
    const buckets = { night: 0, morning: 0, afternoon: 0, evening: 0 };
    for (const s of steps) {
      const h = new Date(s.created_at).getHours();
      if (h >= 5 && h < 12) buckets.morning += 1;
      else if (h >= 12 && h < 17) buckets.afternoon += 1;
      else if (h >= 17 && h < 23) buckets.evening += 1;
      else buckets.night += 1;
    }
    const [bucket, count] = Object.entries(buckets).reduce<[string, number]>(
      (best, [name, n]) => (n > best[1] ? [name, n] : best),
      ["night", 0],
    );
    const majority = count >= 3 && count / steps.length >= 0.5;
    if (majority) {
      const inBucket = (s: Step) => {
        const h = new Date(s.created_at).getHours();
        if (bucket === "morning") return h >= 5 && h < 12;
        if (bucket === "afternoon") return h >= 12 && h < 17;
        if (bucket === "evening") return h >= 17 && h < 23;
        return h >= 23 || h < 5;
      };
      candidates.push({
        id: `time-${bucket}`,
        kind: "time",
        title: `Your steps mostly happen in the ${bucket}.`,
        detail: "A quiet rhythm, not a rule.",
        count,
        refSteps: steps.filter(inBucket),
      });
    }
  }

  return candidates
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

// ---------------------------------------------------------------- gentle streak

export function showedUpDaysThisMonth(steps: Step[]): number {
  const monthStart = startOfMonth().getTime();
  return new Set(
    steps
      .filter((s) => new Date(s.created_at).getTime() >= monthStart)
      .map((s) => dayKey(s.created_at)),
  ).size;
}

// ---------------------------------------------------------------- achievements

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progress?: number;
  target?: number;
}

export function computeAchievements(steps: Step[]): Achievement[] {
  const total = steps.length;
  const byDay = groupByDay(steps);
  const activeDays = byDay.size;

  // You Came Back: at least one gap of 3+ days between entries.
  const sorted = [...steps].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  let cameBack = false;
  for (let i = 1; i < sorted.length; i++) {
    const gapDays = Math.round(
      (new Date(sorted[i].created_at).getTime() -
        new Date(sorted[i - 1].created_at).getTime()) /
        86400000,
    );
    if (gapDays >= 3) {
      cameBack = true;
      break;
    }
  }

  const restCount = categoryCounts(steps).find((c) => c.category === "rest")?.count ?? 0;

  return [
    {
      id: "first-step",
      title: "First Step",
      description: "The very first small step you noticed.",
      earned: total >= 1,
      progress: Math.min(total, 1),
      target: 1,
    },
    {
      id: "came-back",
      title: "You Came Back",
      description: "You returned after a quiet break.",
      earned: cameBack,
      progress: cameBack ? 1 : 0,
      target: 1,
    },
    {
      id: "week",
      title: "A Week of Small Steps",
      description: "Entries on 7 different days.",
      earned: activeDays >= 7,
      progress: Math.min(activeDays, 7),
      target: 7,
    },
    {
      id: "rest",
      title: "You Notice Rest",
      description: "A few entries about resting.",
      earned: restCount >= 3,
      progress: Math.min(restCount, 3),
      target: 3,
    },
    {
      id: "showing-up",
      title: "You Keep Showing Up",
      description: "25 small steps, quietly collected.",
      earned: total >= 25,
      progress: Math.min(total, 25),
      target: 25,
    },
  ];
}