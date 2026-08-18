import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash-lite";
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const RESEND_URL = "https://api.resend.com/emails";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "Small Steps <onboarding@resend.dev>";
const APP_URL = Deno.env.get("APP_URL") || Deno.env.get("SUPABASE_URL") || "";

// Вызывается по расписанию (pg_cron или внешний cron). Защищаем служебным ключом:
// в заголовке Authorization должен прийти Bearer <WEEKLY_SUMMARY_SECRET>.
const SERVICE_SECRET = Deno.env.get("WEEKLY_SUMMARY_SECRET") || "";

const SUMMARY_PROMPT = `Write a short, warm weekly summary (3-5 sentences) reflecting on these small steps
the user marked this week: {list of entries}.
Notice patterns gently if there are any, but don't turn it into a performance review.
No metrics, no comparisons to other weeks, no encouragement to do more next week.
Sign it warmly, without clichés.`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function callGemini(userMessage: string): Promise<string | null> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return null;

  const url =
    `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=` +
    encodeURIComponent(key);

  const payload = {
    systemInstruction: {
      parts: [{ text: "You write warm, gentle weekly summaries for a journaling app." }],
    },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;

  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((part: { text?: string }) => part.text ?? "")
    .join(" ")
    .trim();
  return text || null;
}

async function sendEmail(to: string, summary: string, entries: string[], token: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return;

  const unsubscribe = `${APP_URL}/functions/v1/weekly-summary?action=unsubscribe&token=${token}&email=${encodeURIComponent(to)}`;
  const list = entries.length
    ? `<ul style="margin:0;padding:0;list-style:none;">${entries
        .map((e) => `<li style="padding:3px 0;color:#6f675b;">· ${e}</li>`)
        .join("")}</ul>`
    : "";

  await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: "A gentle look back at your week",
      html: `
        <div style="font-family:Georgia,'Times New Roman',serif;color:#2c2a26;max-width:520px;margin:0 auto;line-height:1.7;">
          <p style="font-size:19px;margin:0 0 18px;">${summary}</p>
          ${list}
          <p style="color:#9a9384;font-size:12px;margin-top:32px;border-top:1px solid #e6e0d3;padding-top:12px;">
            Small Steps · a place with no grades.
            <br /><a href="${unsubscribe}" style="color:#9a9384;">Unsubscribe from these weekly notes</a>
          </p>
        </div>
      `,
    }),
  });
}

async function handleUnsubscribe(url: URL): Promise<Response> {
  const token = url.searchParams.get("token") ?? "";
  const email = url.searchParams.get("email") ?? "";
  if (!token || !email) {
    return html(
      "<body style=\"font-family:Georgia,serif;background:#faf8f4;color:#2c2a26;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;\"><p>That link looks incomplete. Write to us and we'll sort it out.</p></body>",
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email_lookup", email.toLowerCase())
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!profile) {
    return html(
      "<body style=\"font-family:Georgia,serif;background:#faf8f4;color:#2c2a26;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;\"><p>We couldn't find that address. You can also turn these off in Settings inside the app.</p></body>",
    );
  }

  await supabase
    .from("profiles")
    .update({ weekly_email: false })
    .eq("id", profile.id);

  return html(
    "<body style=\"font-family:Georgia,serif;background:#faf8f4;color:#2c2a26;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;\"><div><h1 style=\"font-weight:normal;\">You're all set.</h1><p>No more weekly notes will arrive. If you ever change your mind, they're easy to turn back on in Settings.</p></div></body>",
  );
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (url.searchParams.get("action") === "unsubscribe") {
    return await handleUnsubscribe(url);
  }

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!SERVICE_SECRET || authHeader !== `Bearer ${SERVICE_SECRET}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, unsubscribe_token")
    .not("email_lookup", "is", null)
    .eq("weekly_email", true);

  let sent = 0;
  for (const profile of profiles ?? []) {
    const { data: user } = await supabase.auth.admin.getUserById(profile.id);
    const email = user?.user?.email;
    if (!email) continue;

    const { data: steps } = await supabase
      .from("steps")
      .select("note, created_at")
      .eq("user_id", profile.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (!steps || steps.length === 0) continue;

    const entries = steps.map((s) => s.note);
    const prompt = SUMMARY_PROMPT.replace("{list of entries}", entries.map((n) => `"${n}"`).join(", "));
    const summary = await callGemini(prompt);
    if (!summary) continue;

    await sendEmail(email, summary, entries, profile.unsubscribe_token);
    sent++;
  }

  return json({ sent });
});
