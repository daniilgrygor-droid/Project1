import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_URL = "https://api.resend.com/emails";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "Small Steps <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_URL") || Deno.env.get("SUPABASE_URL") || "";
const SERVICE_SECRET = Deno.env.get("WEEKLY_SUMMARY_SECRET") || "";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function sendReminder(to: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;

  await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: "A small check-in whenever you're ready",
      html: `
        <div style="font-family:Georgia,'Times New Roman',serif;color:#2c2a26;max-width:480px;margin:0 auto;line-height:1.7;">
          <p style="font-size:17px;margin:0 0 8px;">What's one small thing you did today?</p>
          <p style="color:#6f675b;font-size:14px;margin:0 0 24px;">
            If today's been quiet, that's fine too. No pressure — this is just a gentle nudge,
            whenever you're ready.
          </p>
          <a href="${APP_URL}/check-in" style="display:inline-block;background:#2c2a26;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">
            Check in
          </a>
          <p style="color:#9a9384;font-size:12px;margin-top:28px;border-top:1px solid #e6e0d3;padding-top:12px;">
            Small Steps · a place with no grades.
            <br />You can turn these reminders off in Settings at any time.
          </p>
        </div>
      `,
    }),
  });
}

function matchesDay(now: Date, daysCsv: string): boolean {
  const today = now.getUTCDay(); // 0 = Sunday
  const iso = today === 0 ? 7 : today; // 1..7 (Mon..Sun)
  return daysCsv
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .some((d) => Number(d) === iso);
}

function matchesTime(now: Date, time: string): boolean {
  const [hh, mm] = time.split(":").map((n) => Number(n) || 0);
  return now.getUTCHours() === hh && now.getUTCMinutes() >= mm && now.getUTCMinutes() < mm + 5;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!SERVICE_SECRET || authHeader !== `Bearer ${SERVICE_SECRET}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, reminder_enabled, reminder_time, reminder_days")
    .eq("reminder_enabled", true);

  let sent = 0;
  for (const profile of profiles ?? []) {
    if (!matchesDay(now, profile.reminder_days ?? "1,2,3,4,5,6,7")) continue;
    if (!matchesTime(now, profile.reminder_time ?? "19:00")) continue;

    const { data: user } = await supabase.auth.admin.getUserById(profile.id);
    const email = user?.user?.email;
    if (!email) continue;

    await sendReminder(email);
    sent++;
  }

  return json({ sent, at: now.toISOString() });
});