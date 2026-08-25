export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  tag: string;
  body: { h?: string; p?: string }[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "why-streaks-hurt-recovery",
    title: "Why streaks hurt recovery (and what helps instead)",
    description:
      "Streak mechanics are great for habits — and quietly cruel for anyone recovering from burnout or illness. Here's the psychology, and the alternative.",
    date: "2026-08-20",
    readMinutes: 5,
    tag: "Recovery",
    body: [
      {
        p: "Streaks work. That's the uncomfortable truth behind every habit app with a fire emoji. The fear of breaking a chain is a genuine motivator — for people whose baseline energy can sustain the habit in the first place.",
      },
      {
        p: "But recovery doesn't work on a streak's schedule. Energy arrives in uneven waves. A day spent mostly in bed can be a victory over yesterday. A streak counts it as zero — or worse, as a broken chain, a red X, a loss.",
      },
      { h: "What a streak actually measures" },
      {
        p: "A streak measures consistency. Recovery is not consistent. Treating a fluctuating resource with a consistency metric doesn't create accountability — it creates evidence of failure, daily, in red.",
      },
      {
        p: "The research on self-compassion points the other way: people who respond to setbacks kindly return to the behavior faster than those who self-punish. The streak is a self-punishment machine with a friendly interface.",
      },
      { h: "What helps instead: noticing" },
      {
        p: "The alternative isn't lowering the bar. It's removing the bar entirely and replacing it with a question: what did you do today? Anything counts. The answer becomes a record of showing up — and showing up is the actual skill recovery is made of.",
      },
      {
        p: "This is the model Small Steps is built on. No streaks anywhere in the app. No red marks. If you disappear for two weeks, the journal simply waits. When you return, that return is a step too.",
      },
      {
        p: "If you're recovering right now: delete the tracker with the fire emoji for one week. Write down one small thing you did each day instead. Notice the difference in how the week feels.",
      },
    ],
  },
  {
    slug: "smallest-step-counts",
    title: "The smallest step counts: a field guide to tiny wins",
    description:
      "Got out of bed. Drank water. Replied to one email. Why naming tiny wins out loud rewires how a hard season feels.",
    date: "2026-08-12",
    readMinutes: 4,
    tag: "Practice",
    body: [
      {
        p: "There's a specific kind of day during recovery: you did technically function, and it cost everything. And the world — including your own inner voice — files it under 'nothing happened today'.",
      },
      {
        p: "The practice of naming one small win a day is not about positive thinking. It's about correcting a recording error. The day did have content. It just wasn't the kind that gets applause.",
      },
      { h: "What counts as a small step" },
      {
        p: "More than you'd think. Got out of bed before noon. Ate a real meal. Opened the scary email. Texted a friend back. Walked to the end of the street. Said no to something. Rested on purpose instead of by collapse.",
      },
      {
        p: "The test is simple: did it take effort today? If yes, it counts. Not 'would it take effort for a healthy person' — for you, today.",
      },
      { h: "Why writing beats thinking" },
      {
        p: "A win that stays in your head is negotiable. Written down, it becomes evidence. After thirty entries, you have a document your inner critic can't easily argue with: thirty days of showing up, in your own words.",
      },
      {
        p: "This is why Small Steps is a journal and not a checklist. The point isn't the streak of wins. It's the accumulated, undeniable record that you kept participating in your own life during a hard season.",
      },
    ],
  },
  {
    slug: "returning-after-sick-leave",
    title: "Returning after long sick leave: a pace-first guide",
    description:
      "The world expects you to be 'back' on day one. Your energy disagrees. Here's how to structure a return that doesn't re-break you.",
    date: "2026-08-05",
    readMinutes: 6,
    tag: "Work & health",
    body: [
      {
        p: "Long sick leave ends with a date on a calendar, as if recovery follows HR paperwork. It doesn't. The return is its own season — often harder than the leave itself, because the support structures drop away exactly when the demands return.",
      },
      { h: "Pace first, schedule second" },
      {
        p: "The standard advice is to 'ease back in'. Almost nobody says what that means operationally. Here's a version that works: decide your daily energy budget before deciding your schedule. Not the other way around.",
      },
      {
        p: "If your honest budget is four focused hours, a full-time schedule with 'boundaries' is a plan to fail by Thursday. A four-hour plan with hard edges is a plan to still be standing in a month.",
      },
      { h: "Track energy, not output" },
      {
        p: "During the return, output is a lagging indicator. Energy is the leading one. Note each day what you did and how it cost you. Patterns appear within two weeks: which meetings drain, which tasks restore, where the real limits are.",
      },
      {
        p: "This is the exact use case Small Steps was built for. One question a day — what did you do, how did you feel. Over a month, you get a map of your actual capacity, written in your own words, without a dashboard grading you.",
      },
      { h: "The uncomfortable part" },
      {
        p: "Some people around you will treat your pace as an opinion you're holding, rather than a constraint you're managing. You don't owe anyone your energy ledger. 'I'm at capacity today' is a complete sentence.",
      },
      {
        p: "Recovery is not a detour from your life. Handled gently, the return can become the foundation of a pace you can actually keep — one small step at a time.",
      },
    ],
  },
];
