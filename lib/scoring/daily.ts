// Streak and today's task. Days are counted in the owner's time zone.

const ZONE = "Asia/Dhaka";

// "2026-11-24" for a moment, in Asia/Dhaka.
export function dhakaDay(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: ZONE });
}

function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Days in a row with at least one finished test. Today without a test yet does
// not break the streak: it counts back from yesterday.
export function streak(finishedAt: Date[], now: Date): number {
  const days = new Set(finishedAt.map(dhakaDay));
  let day = dhakaDay(now);
  if (!days.has(day)) day = previousDay(day);
  let n = 0;
  while (days.has(day)) {
    n++;
    day = previousDay(day);
  }
  return n;
}

export type DayType = "quiz" | "coding";

// Quiz and coding days alternate: the next is the opposite of the last daily
// task done (a topic quiz or a coding submit). With none yet, start with a quiz.
export function nextDayType(lastDailyKind: "topic_quiz" | "coding" | null): DayType {
  return lastDailyKind === "topic_quiz" ? "coding" : "quiz";
}
