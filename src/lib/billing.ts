import type { Payment, Plan } from "./types";

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

/** Payment details shown on the invoice. Set VITE_PAYMENT_DETAILS to real ones. */
export function paymentDetails(): string {
  return (
    (import.meta.env.VITE_PAYMENT_DETAILS as string | undefined)?.trim() ||
    "Transfer $48 once a year — details will be added here soon."
  );
}

/** Records a pending manual payment request for the current user. */
export async function requestPrivatePayment(
  userId: string,
  email: string,
): Promise<Payment | null> {
  const { supabase } = await import("./supabase");
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      email,
      amount: PRICE_YEARLY,
      currency: "USD",
    })
    .select()
    .single();
  if (error) return null;
  return data as Payment;
}

/** Latest payments for the current user (pending first). */
export async function fetchMyPayments(userId: string): Promise<Payment[]> {
  const { supabase } = await import("./supabase");
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as Payment[]) ?? [];
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