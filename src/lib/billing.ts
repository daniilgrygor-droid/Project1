import type { Plan } from "./types";

export const PRICE_YEARLY = 48;
export const PRICE_MONTHLY = 5;

export const PLANS: Record<
  Plan,
  { label: string; tagline: string; features: string[] }
> = {
  free: {
    label: "The quiet journal",
    tagline:
      "Everything you need to notice your small steps — warm replies included.",
    features: [
      "One gentle question a day",
      "Warm, personal AI replies",
      "Mood and category markers",
      "Your plant, journey and progress",
    ],
  },
  private: {
    label: "Private",
    tagline: "The same journal — with your words kept closer.",
    features: [
      "Everything in the quiet journal",
      "AI replies processed privately — never used to train models",
      "Gentle daily reminders and weekly notes",
      "Yearly $48 or monthly $5 — cancel anytime",
    ],
  },
};

export function planLabel(plan: Plan): string {
  return PLANS[plan].label;
}
