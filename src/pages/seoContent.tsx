import SeoLanding, { type SeoPageProps } from "./SeoLanding";

export function ForBurnout() {
  return (
    <SeoLanding {...BURNOUT} />
  );
}

const BURNOUT: SeoPageProps = {
  eyebrow: "For burnout recovery",
  title: "Recovering from burnout? Track the smallest wins — not your productivity.",
  lead: (
    "When everything takes more energy than it should, productivity apps make it worse. " +
    "Small Steps asks one gentle question a day and answers with warmth — never a grade, " +
    "never a streak, never pressure to do more."
  ),
  sections: [
    {
      heading: "Why habit trackers fail after burnout",
      body: [
        "Most productivity apps are built for people with energy to spare. Streaks, " +
        "points, red 'missed day' marks — for someone recovering from burnout, these " +
        "aren't motivators. They're another source of guilt.",
        "After burnout, a shower can be a genuine achievement. An app that answers it " +
        "with 'you broke your streak' misses the point entirely — and quietly tells you " +
        "your effort doesn't count.",
      ],
    },
    {
      heading: "A different model: notice, don't measure",
      body: [
        "Small Steps flips the model. Each day, one question: what's one small thing " +
        "you did today? You write anything — 'got out of bed', 'replied to one email', " +
        "'sat outside for ten minutes'.",
        "A warm, personal reply comes back — written for your exact words, not a " +
        "canned 'great job'. Over weeks, your journal becomes a quiet record of " +
        "showing up, on the hardest days and the easier ones alike.",
      ],
    },
    {
      heading: "Built for the bad days, not just the good ones",
      body: [
        "Disappearing for two weeks changes nothing here. No red marks, no broken " +
        "streaks, no catch-up pressure. Coming back after a pause is treated as " +
        "exactly what it is: another small step.",
        "There's also 'I showed up today' — a one-tap check-in for days when even " +
        "writing feels like too much. It counts. That's the whole point.",
      ],
    },
  ],
  faq: [
    {
      q: "Is this a habit tracker?",
      a: "No. There are no streaks, points, or scores anywhere in Small Steps. The only metric is the one you feel. It's a journal that responds warmly, not a dashboard that grades you.",
    },
    {
      q: "What if I can't write anything some days?",
      a: "Use 'I showed up today' — one tap, and the day is noted kindly. Nothing breaks, nothing is missed, nothing is scored.",
    },
    {
      q: "How much does it cost?",
      a: "The journal and warm replies are free forever. Private — $5/month or $48/year — adds private AI processing, gentle reminders, and weekly notes. Cancel anytime, no retention flows.",
    },
    {
      q: "Is my data private?",
      a: "Your journal is never sold or shared. On the free tier, entries are processed by Google's Gemini API to write your reply. On Private, replies are processed privately — never used to train models.",
    },
  ],
};

export function ForSickLeave() {
  return <SeoLanding {...SICK} />;
}

const SICK: SeoPageProps = {
  eyebrow: "After a long sick leave",
  title: "Coming back after a long sick leave? One small step a day is enough.",
  lead: (
    "Returning to life after weeks or months of illness is not a productivity challenge — " +
    "it's a gentle, uneven process. Small Steps gives you a quiet place to notice every " +
    "bit of progress, at whatever pace your recovery actually goes."
  ),
  sections: [
    {
      heading: "The comeback nobody prepares you for",
      body: [
        "After a long sick leave, the world expects you to be 'back'. But energy is " +
        "limited, routines are gone, and the old pace isn't there yet — maybe never " +
        "again in the same form.",
        "Standard advice says 'start small'. Almost no tool actually supports that. " +
        "They want 5am routines and 30-day streaks. Recovery wants patience.",
      ],
    },
    {
      heading: "One question, one honest reply",
      body: [
        "Each day, Small Steps asks what one small thing you did. A walk to the " +
        "corner. One phone call answered. Cooking a real meal. You write it in a " +
        "sentence, and a warm, personal reply comes back — one that hears what you " +
        "actually said.",
        "Days add up into a timeline you can look back on: proof, in your own words, " +
        "that you kept showing up through a hard season.",
      ],
    },
    {
      heading: "Your pace is the only pace",
      body: [
        "Some days you'll write three entries. Some weeks you won't open the app at " +
        "all. Both are fine — your journal waits without judgment, and your plant " +
        "grows with every step, however irregular.",
        "When you're ready for more, Private adds gentle daily reminders and weekly " +
        "notes — quiet support, never nagging.",
      ],
    },
  ],
  faq: [
    {
      q: "I'm still on sick leave. Is this too soon?",
      a: "It's designed for exactly this phase. If all you did today was rest, that counts too — rest is a step when you're recovering.",
    },
    {
      q: "What if I disappear for weeks?",
      a: "Nothing breaks. No red marks, no lost progress. When you come back, you're welcomed back — that's it.",
    },
    {
      q: "How much does it cost?",
      a: "Free forever for the journal and replies. Private — $5/month or $48/year — adds reminders, weekly notes, and private AI processing. Cancel anytime.",
    },
    {
      q: "Can I export my journal?",
      a: "Yes — full JSON and CSV export anytime from Settings. Your words belong to you.",
    },
  ],
};
