import type { Category } from "./types";

export const MIN_PASSWORD_LENGTH = 8;

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "body", label: "Body" },
  { id: "work", label: "Work" },
  { id: "study", label: "Study" },
  { id: "home", label: "Home" },
  { id: "rest", label: "Rest" },
  { id: "people", label: "People" },
  { id: "other", label: "Other" },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  body: "Body",
  work: "Work",
  study: "Study",
  home: "Home",
  rest: "Rest",
  people: "People",
  other: "Other",
};

export const MOODS: { value: number; label: string; emoji: string }[] = [
  { value: 1, label: "Very low", emoji: "🥺" },
  { value: 2, label: "Low", emoji: "😔" },
  { value: 3, label: "Neutral", emoji: "😐" },
  { value: 4, label: "Good", emoji: "😊" },
  { value: 5, label: "Very good", emoji: "🥰" },
];

export const MOOD_LABEL: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Neutral",
  4: "Good",
  5: "Very good",
};

export function moodEmoji(mood: number | null | undefined): string {
  return MOODS.find((m) => m.value === mood)?.emoji ?? "😐";
}

export interface PlantStage {
  minSteps: number;
  label: string;
  description: string;
}

export const PLANT_STAGES: PlantStage[] = [
  { minSteps: 1, label: "A seed", description: "Something is beginning." },
  { minSteps: 3, label: "A sprout", description: "A little growth is showing." },
  { minSteps: 7, label: "A small plant", description: "It's taking root." },
  { minSteps: 15, label: "A growing plant", description: "Small things are becoming visible." },
  { minSteps: 30, label: "A flower", description: "Something has begun to bloom." },
  { minSteps: 50, label: "A mature plant", description: "Quietly thriving." },
  { minSteps: 75, label: "A blooming garden", description: "More blooms appear." },
  { minSteps: 100, label: "A thriving garden", description: "A hundred small steps." },
  { minSteps: 150, label: "A small forest", description: "Your steps became a forest." },
  { minSteps: 200, label: "An enduring grove", description: "Two hundred — and still gentle." },
  { minSteps: 300, label: "A wild meadow", description: "Beyond counting, still growing." },
];

export function plantStageFor(steps: number): PlantStage | null {
  if (steps <= 0) return null;
  let stage = PLANT_STAGES[0];
  for (const s of PLANT_STAGES) {
    if (steps >= s.minSteps) stage = s;
  }
  return stage;
}

export function plantStageIndexFor(steps: number): number {
  if (steps <= 0) return -1;
  let idx = 0;
  for (let i = 0; i < PLANT_STAGES.length; i++) {
    if (steps >= PLANT_STAGES[i].minSteps) idx = i;
  }
  return idx;
}

// Local-day key: "YYYY-MM-DD" in the user's local timezone.
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diff = (day === 0 ? 6 : day - 1); // days since Monday
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diff);
  return monday;
}

export function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

// Header label for a timeline group: Today / Yesterday / "August 11".
export function groupDayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.round(
    (startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000,
  );
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}