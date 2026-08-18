# Small Steps

Small steps back to life — a gentle, low-pressure journal for people recovering
from burnout or a long sick leave. The one daily question is “What's one small
thing you did today?”, and the answer gets a short, warm, personal response from
Google's Gemini. No streaks, no points, no guilt, no urgency.

## Product principles — what we never build

This project is trauma-informed: predictable, non-coercive, reversible, and with
a low cost of error. Before adding a feature, check it against this list. If a
change would add any of the following, it's off-limits — even if it seems small:

- No push notifications or re-engagement emails ("You haven't been in a while",
  "We miss you", "Come back!"). The daily reminder only exists when the user
  explicitly turns it on, and it never scolds.
- No productivity-tip newsletters, no "5 ways to stay motivated", no streaks to
  protect.
- No onboarding quiz with a progress bar ("What's your goal? Step 1 of 5"). The
  quiz-with-progress-bar mechanic itself contradicts "no streaks, ever".
- No comparisons with other users: no leaderboards, no "you're in the top 10%",
  no "average user" stats.
- No timers or deadlines ("Mark your step before midnight!").
- No punitive visual language for missed days or short entries: no red, no
  exclamation marks, no warning icons. Quiet days and tiny steps are neutral.
- No modals that appear without an explicit user action, and no content that
  jumps around and makes someone lose their place on the page.
- No confirmation dialogs with scary wording ("Are you sure?? This cannot be
  undone!!"). Destructive actions use gentle copy and are reversible — e.g.
  deleting a step soft-deletes with a 10-second Undo toast.

Micro-copy lives in `src/lib/copy.ts` so the tone can be audited in one place.

## Stack

- **Frontend**: React + TypeScript + Vite, hand-rolled minimal CSS (flat,
  warm-beige design, serif headlines, sage-green accent used only in the praise card)
- **Backend**: Supabase (email/password auth, RLS, `steps` table)
- **AI**: Google Gemini API (free tier, `gemini-3.5-flash-lite`) via the Supabase
  Edge Function `step-response` — the key never reaches the browser

## Structure

| Path | Purpose |
|---|---|
| `src/` | React app: landing, auth, onboarding, check-in + feed |
| `supabase/schema.sql` | DB schema: `waitlist`, `profiles`, `steps` + RLS and profile trigger |
| `supabase/functions/step-response/` | Edge function: saves a step and returns a warm Claude reply |
| `.env.example` | Environment variables |

## Routes

| Path | Screen |
|---|---|
| `/` | Landing + “be the first to know” waitlist form |
| `/auth` | Sign in / create account (email), plus “forgot password?” |
| `/reset-password` | Password reset page reached via the emailed link |
| `/onboarding` | Two gentle, skippable questions |
| `/check-in` | Today's question + optional category & mood + praise card + feed |
| `/journey` | One section with two tabs — **Timeline** (calendar + history + search) and **Overview** (stats, patterns, moments, gentle retrospectives). `/progress` redirects here |
| `/growth` | The plant metaphor — growth stages of your small steps |
| `/settings` | Recovering-from, reply length, reminders, weekly email, text size, delete data |

## Run locally

```bash
npm install
npm run dev
```

## Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL Editor.
3. Enable email auth: **Authentication → Providers → Email**. Password minimum
   length 6 works; confirmation emails are on by default.
4. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (dashboard → Settings → API).

### Edge Function `step-response` (Gemini)

**Option A — Supabase CLI:**

```bash
supabase functions deploy step-response
supabase secrets set GEMINI_API_KEY=...
# optional: supabase secrets set GEMINI_MODEL=gemini-3.5-flash-lite
```

**Option B — no CLI:** dashboard → **Edge Functions → Create New**, paste the
code from `supabase/functions/step-response/index.ts`, then add
`GEMINI_API_KEY` under **Settings → Secrets**. Get a free key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey).

The function verifies the user's JWT, stores the entry in `steps` (with optional
`category` and `mood`), and calls Gemini with the system prompt *“You are a
warm, empathetic companion…”*. The reply is context-aware: it includes the
entry's category and mood, the last ~12 entries, and how long it's been since
the user last checked in, so the response can gently notice returning or
repeated patterns without ever pressuring. It respects `reply_length`
(short = one sentence, long = 2–3 sentences), and retries with backoff on rate
limits.

It also handles the “I showed up today” button: when the check-in is submitted
with `showed_up_only: true`, the prompt explicitly tells Gemini to acknowledge
that simply showing up matters, **without** asking what they did.

> If the function isn't deployed, no API key is set, or Gemini is rate-limited,
> the frontend still works: the step is saved directly and the praise card shows
> a gentle fallback — “Thank you for sharing that — sit with it for a moment.”
> A raw error is never shown to someone in a vulnerable state.

### Edge Function `weekly-summary` (weekly warm email)

Deploy alongside `step-response`:

```bash
supabase functions deploy weekly-summary
supabase secrets set WEEKLY_SUMMARY_SECRET=some-long-random-string
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set RESEND_API_KEY=...
supabase secrets set EMAIL_FROM="Small Steps <onboarding@yourdomain.com>"
supabase secrets set APP_URL=https://your-app.example.com
```

- Once a week it gathers each user's entries from the past 7 days, asks Gemini
  for a short warm summary, and sends it via [Resend](https://resend.com).
- Each email includes a plain unsubscribe link that turns off `weekly_email`
  for that user (no account needed) — required for deliverability.
- It runs **only if** a `WEEKLY_SUMMARY_SECRET` is set; the caller must present
  `Authorization: Bearer <WEEKLY_SUMMARY_SECRET>`.

**Scheduling** (pick one):

- **Supabase + pg_cron:** enable the `pg_cron` and `pg_net` extensions, then run
  the schedule snippet at the bottom of `supabase/schema.sql` (it calls the
  function once a week with the service-role key).
- **External cron:** any cron service that can POST to
  `…/functions/v1/weekly-summary` with the `Authorization` header set.

### Edge Function `daily-reminder` (optional gentle nudges)

Deploy alongside the others (uses the same `WEEKLY_SUMMARY_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` and `APP_URL`):

```bash
supabase functions deploy daily-reminder
```

Every 5 minutes it checks which users have reminders enabled and whose
`reminder_time` / `reminder_days` match right now, then emails them
“A small check-in whenever you're ready.” See the schedule snippet in
`supabase/schema.sql`. Users control it fully from Settings.

### Password reset

Supabase's built-in email reset is used. In the dashboard set
**Authentication → URL Configuration → Redirect URLs** to include
`https://your-app.example.com/reset-password` (and
`http://localhost:5173/reset-password` for local dev).

## Privacy

Your entries are processed by Google's Gemini API to generate the responses.
On Gemini's free tier, that data may be used to improve Google's models. This is
stated honestly in the app footer.

## Behavior notes

- You can mark a step at any time; multiple marks per day are fine.
- On low-energy days there's an “I showed up today” button — no text needed.
  Those entries show a sun icon and “showed up today” in the feed.
- Each step can carry an optional **category** (Body / Work / Study / Home /
  Rest / People / Other) and an optional **mood** (1–5). Both are optional.
- Each feed entry has a subtle “···” on hover (or always visible on touch) to
  expand it — from there you can **edit** the text/category/mood or **delete**
  it. Deleting is a soft delete: the entry leaves the page and a quiet toast at
  the bottom offers **Undo** for 10 seconds before the step is removed for good.
- Marking a step flows quietly: the button turns into “Noticed.” for a moment,
  the new entry slides into the feed, the counter eases up, and a tiny
  “One small step counts.” appears before the personal reply settles in below.
  No confetti, no flashes, no full-screen takeover.
- **Journey** shows a calendar (dot = empty day, leaf = one step, sprout = a
  few) plus a **visual timeline** of your steps grouped by day
  (Today / Yesterday / date), each entry on a thin vertical line with its time.
  Click a day on the calendar to focus the timeline on that day; search filters
  it too.
- **Progress** leads with a quiet hero number (total steps), a soft 28-day
  activity overview (hover a bar for the day and count), then categories and a
  mood section (including your mood across this week's days), gentle
  **patterns** (repeated actions, most common category and day, a time-of-day
  rhythm, and mood–category connections — up to three, each clickable to show
  the matching entries), a **weekly recap** block with a mini week chart and
  what the week mostly held, a monthly reflection, and soft achievements.
- **Growth** is the plant metaphor: seed → sprout → small plant → growing plant
  → flower → mature plant as your step count grows. The plant is larger, gently
  sways, and rises as it appears; the history below shows each stage on a
  timeline — reached stages are lit, future ones stay quiet.
- You can edit “what you're recovering from”, reply length, reminders, and the
  weekly email in Settings.
- Missing a day changes nothing — the feed ends with *“Missed a day? That's
  okay. There's no rush here.”*
- Palette: warm cream `#FCFBF8` background, warm beige surfaces `#F4EFE6`,
  organic green `#718B70`, deep warm green `#5E775F`, charcoal buttons
  `#2B2823`, warm text `#2C2925` — a single shared token system in
  `src/index.css`. No cold white, no pure black, no bright green, no gradients,
  no gamification, no analytics.
