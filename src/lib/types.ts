export type Category =
  | "body"
  | "work"
  | "study"
  | "home"
  | "rest"
  | "people"
  | "other";

export type Plan = "free" | "private";

export interface Profile {
  id: string;
  name: string | null;
  context: string | null;
  reply_length: "short" | "long";
  weekly_email: boolean;
  reminder_enabled: boolean;
  reminder_time: string;
  reminder_days: string;
  onboarded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  plan: Plan;
  is_admin: boolean;
  plan_updated_at: string | null;
}

export function isPrivate(profile: Pick<Profile, "plan">): boolean {
  return profile.plan === "private";
}

export interface Payment {
  id: string;
  user_id: string;
  email: string;
  amount: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled";
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface Step {
  id: string;
  user_id: string;
  note: string;
  category: Category | null;
  mood: number | null;
  showed_up_only: boolean;
  ai_response: string | null;
  created_at: string;
}

export function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000,
  );

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "last week";
  if (diffDays < 21) return "2 weeks ago";
  if (diffDays < 30) return "3 weeks ago";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export interface SaveStepResult {
  ok: boolean;
  step?: Step;
  aiFailed?: boolean;
  reason?: "not-configured" | "error";
  message?: string;
}
