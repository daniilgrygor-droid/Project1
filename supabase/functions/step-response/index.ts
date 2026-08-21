import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash-lite";
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_PROMPT = `You are a warm, empathetic companion for someone recovering from burnout.
The user just shared one small thing they did today.
Respond in 2-3 short sentences.
Be warm and specific to exactly what they described — never generic.
Do not use toxic positivity, do not encourage them to do more, avoid clichés like "great job" without context.
Acknowledge that this step may have taken real effort.
Never mention productivity, streaks, or goals.
Never tell them what to do tomorrow, never pressure them to keep a streak, never make them feel guilty for quiet days.

If the user only indicated they showed up today without describing what they did,
respond warmly acknowledging that simply showing up matters, without asking what
they did or implying more detail was expected.

You will also receive a short "Context" section about their recent history.
Use it gently:
- If they've been away for a while, acknowledge returning without asking them to catch up.
- If they've repeated a similar action before, you may quietly notice that pattern.
- If they have few or no entries, keep it simple and present-tense.
Never list their history back at them and never turn observations into demands.`;

const LENGTH_GUIDANCE = {
  short: {
    system: "Keep your reply to a single short, warm sentence.",
    maxOutputTokens: 80,
  },
  long: {
    system: "Keep your reply to 2-3 short, warm sentences.",
    maxOutputTokens: 180,
  },
} as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

// --- Rate limiting (in-memory, per-user, 30 req/min) ---
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;
const hits = new Map<string, number[]>();

function rateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = hits.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  hits.set(userId, recent);
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(
  userMessage: string,
  replyLength: "short" | "long" = "short",
  isPrivate = false,
): Promise<string | null> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return null;

  const url =
    `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=` +
    encodeURIComponent(key);

  const guidance = LENGTH_GUIDANCE[replyLength];
  const privateNote = isPrivate
    ? "\nThis user has a Private plan. Their data is processed privately and never used to improve models. You may gently acknowledge this trust if it fits naturally — e.g. 'Your words stay yours.' — but never make it the focus."
    : "";
  const payload = {
    systemInstruction: {
      parts: [
        { text: SYSTEM_PROMPT + privateNote },
        { text: guidance.system },
      ],
    },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { maxOutputTokens: guidance.maxOutputTokens, temperature: 0.8 },
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Rate limit (429) or a transient server error: back off and retry.
    if (res.status === 429 || res.status >= 500) {
      if (attempt < 2) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      return null;
    }

    if (!res.ok) return null;

    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((part: { text?: string }) => part.text ?? "")
      .join(" ")
      .trim();
    return text || null;
  }

  return null;
}

const CATEGORY_LABELS: Record<string, string> = {
  body: "Body",
  work: "Work",
  study: "Study",
  home: "Home",
  rest: "Rest",
  people: "People",
  other: "Other",
};

const MOOD_LABELS: Record<number, string> = {
  1: "very low",
  2: "low",
  3: "neutral",
  4: "good",
  5: "very good",
};

function buildUserMessage(
  note: string,
  name: string | null,
  context: string | null,
  category: string | null,
  mood: number | null,
  recentSteps: { note: string; created_at: string }[],
  showedUpOnly: boolean,
): string {
  const greeting = name
    ? `Address them as "${name}".`
    : 'Address them as "you", no name.';
  const ctx = context
    ? `\nWhat they're recovering from: ${context}`
    : "";
  const categoryPart = category
    ? `\nCategory they chose: ${CATEGORY_LABELS[category] ?? category}`
    : "";
  const moodPart = mood
    ? `\nHow they're feeling: ${MOOD_LABELS[mood] ?? mood}`
    : "";
  const what = showedUpOnly
    ? "They only indicated that they showed up today, without describing what they did."
    : `They just shared the one small thing they did today: "${note}".`;

  // Build a gentle context from recent history, newest first.
  const history = recentSteps.length
    ? recentSteps
        .slice(0, 12)
        .map((s) => `- ${s.note}`)
        .join("\n")
    : "none yet";

  const lastEntry = recentSteps[0];
  let rhythm = "";
  if (recentSteps.length > 0 && lastEntry) {
    const days = Math.round(
      (Date.now() - new Date(lastEntry.created_at).getTime()) / 86400000,
    );
    if (days >= 4) rhythm = `\nThey last checked in ${days} days ago.`;
  }

  return `${greeting}${ctx}${categoryPart}${moodPart}

${what}

Context:
Recent things they shared (newest first):
${history}${rhythm}

Use the context to sound like someone who remembers them, but keep the reply
focused on today. Never pressure or guilt them.`;

}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "missing authorization header" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) return json({ error: "unauthorized" }, 401);

  if (!rateLimit(data.user.id)) {
    return json({ error: "too many requests — try again in a minute" }, 429);
  }

  let body: { note?: unknown; showed_up_only?: unknown; category?: unknown; mood?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const note = typeof body.note === "string" ? body.note.trim() : "";
  const showedUpOnly = body.showed_up_only === true;
  const category = typeof body.category === "string" ? body.category : null;
  const mood = typeof body.mood === "number" ? body.mood : null;
  if (!note && !showedUpOnly) return json({ error: "note is required" }, 400);
  const trimmed = note.slice(0, 2000);

  const { data: step, error: insertError } = await supabase
    .from("steps")
    .insert({
      note: showedUpOnly ? "I showed up today" : trimmed,
      showed_up_only: showedUpOnly,
      category,
      mood,
      user_id: data.user.id,
    })
    .select()
    .single();
  if (insertError) return json({ error: insertError.message }, 500);

  const [{ data: profile }, { data: recent }] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, context, reply_length, plan")
      .eq("id", data.user.id)
      .maybeSingle(),
    supabase
      .from("steps")
      .select("note, created_at")
      .eq("user_id", data.user.id)
      .neq("id", step.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const replyLength: "short" | "long" =
    profile?.reply_length === "long" ? "long" : "short";

  const isPrivate = profile?.plan === "private";

  const aiResponse = await callGemini(
    buildUserMessage(
      trimmed,
      profile?.name?.trim() ?? null,
      profile?.context?.trim() ?? null,
      category,
      mood,
      (recent ?? []) as { note: string; created_at: string }[],
      showedUpOnly,
    ),
    replyLength,
    isPrivate,
  );

  if (aiResponse) {
    await supabase
      .from("steps")
      .update({ ai_response: aiResponse })
      .eq("id", step.id);
    step.ai_response = aiResponse;
  }

  return json({ step });
});
