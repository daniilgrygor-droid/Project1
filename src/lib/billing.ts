import type { Plan } from "./types";

export const PRICE_YEARLY = 48;

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
      "One quiet payment a year — no recurring charges",
    ],
  },
};

export function planLabel(plan: Plan): string {
  return PLANS[plan].label;
}

/** Owner revokes their own Private plan (no guilt, no refunds talk). */
export async function cancelPrivate(userId: string): Promise<boolean> {
  const { supabase } = await import("./supabase");
  if (!supabase) return false;
  const { error } = await supabase
    .from("profiles")
    .update({ plan: "free", plan_updated_at: new Date().toISOString() })
    .eq("id", userId);
  return !error;
}
