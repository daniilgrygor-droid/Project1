// Central copy file for user-facing strings. Audit product text here.

export function smallStepsNoticed(count: number): string {
  return `${count} small step${count === 1 ? "" : "s"}, noticed so far.`;
}

export function smallStepsNoticedThisWeek(count: number): string {
  return `You noticed ${count} small step${
    count === 1 ? "" : "s"
  } this week.`;
}

export function thisWeekNoticed(count: number): string {
  return `This week you noticed ${count} small thing${
    count === 1 ? "" : "s"
  } — that's enough.`;
}

export const MOMENTS_TITLE = "Moments";

export const ACHIEVEMENT_PROGRESS: Record<
  string,
  (progress: number, target: number) => string
> = {
  "first-step": () => "The first one, whenever you're ready.",
  "came-back": () => "The path back is always open.",
  week: (progress, target) =>
    `You've noticed steps on ${Math.min(
      progress,
      target,
    )} of 7 days so far. Whenever you're ready for more.`,
  rest: (progress) =>
    `You've noticed ${progress} moment${
      progress === 1 ? "" : "s"
    } of rest so far.`,
  "showing-up": (progress) =>
    `You've collected ${progress} small step${
      progress === 1 ? "" : "s"
    } so far. No hurry.`,
};
