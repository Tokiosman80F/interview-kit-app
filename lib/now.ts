// The current time for exam rules. In development only, DEV_NOW in .env.local
// (an ISO date like 2026-12-01T10:00:00+06:00) pretends it is another time, to
// test the 3-day review and 24-hour retake rules. Production ignores it.
export function now(): Date {
  const override = process.env.NODE_ENV !== "production" ? process.env.DEV_NOW : undefined;
  return override ? new Date(override) : new Date();
}
