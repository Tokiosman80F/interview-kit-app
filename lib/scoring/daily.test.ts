import { describe, expect, it } from "vitest";
import { dhakaDay, nextDayType, streak } from "./daily";

// Dhaka is UTC+6.
const at = (iso: string) => new Date(iso);

describe("dhakaDay", () => {
  it("uses Dhaka time: 20:00 UTC is already the next day", () => {
    expect(dhakaDay(at("2026-11-24T20:00:00Z"))).toBe("2026-11-25");
  });
});

describe("streak", () => {
  const now = at("2026-11-25T10:00:00+06:00");
  it("is 0 with no tests", () => {
    expect(streak([], now)).toBe(0);
  });
  it("counts days in a row ending today", () => {
    const tests = ["2026-11-23T09:00:00+06:00", "2026-11-24T21:00:00+06:00", "2026-11-25T08:00:00+06:00"].map(at);
    expect(streak(tests, now)).toBe(3);
  });
  it("still counts when today has no test yet", () => {
    expect(streak([at("2026-11-24T09:00:00+06:00"), at("2026-11-23T09:00:00+06:00")], now)).toBe(2);
  });
  it("breaks on a missed day", () => {
    expect(streak([at("2026-11-25T09:00:00+06:00"), at("2026-11-23T09:00:00+06:00")], now)).toBe(1);
  });
  it("counts two tests on one day once", () => {
    expect(streak([at("2026-11-25T09:00:00+06:00"), at("2026-11-25T11:00:00+06:00")], now)).toBe(1);
  });
});

describe("nextDayType", () => {
  it("alternates and starts with a quiz", () => {
    expect(nextDayType(null)).toBe("quiz");
    expect(nextDayType("topic_quiz")).toBe("coding");
    expect(nextDayType("coding")).toBe("quiz");
  });
});
