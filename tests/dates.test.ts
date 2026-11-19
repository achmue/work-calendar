import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  formatISO,
  formatLong,
  formatMedium,
  formatShort,
  daysBetween,
  isISODate,
  parseISODate,
  toISODate,
  todayISO,
} from "../src/lib/dates";

describe("parseISODate", () => {
  it("reads a date as LOCAL time, not UTC", () => {
    const date = parseISODate("2026-11-19");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10); // November
    expect(date?.getDate()).toBe(19);
    expect(date?.getHours()).toBe(0);
  });

  it("rejects things that aren't real dates", () => {
    for (const bad of [
      "", "2026-11-1", "2026-1-19", "26-11-19", "2026/11/19", "2026-11-19T00:00:00",
      " 2026-11-19", "2026-13-01", "2026-00-10", "2026-11-31", "2026-02-30", "2027-02-29",
      "not a date",
    ]) {
      expect(parseISODate(bad), bad).toBeNull();
    }
  });

  it("knows about leap years", () => {
    expect(parseISODate("2028-02-29")).not.toBeNull();
    expect(parseISODate("2100-02-29")).toBeNull(); // 2100 is not a leap year
  });
});

describe("isISODate", () => {
  it("accepts real dates and rejects everything else", () => {
    expect(isISODate("2026-11-19")).toBe(true);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("")).toBe(false);
    expect(isISODate(20261119)).toBe(false);
    expect(isISODate(null)).toBe(false);
    expect(isISODate(undefined)).toBe(false);
  });
});

describe("toISODate / todayISO", () => {
  it("formats using the local year, month and day", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toISODate(new Date(2026, 11, 31, 23, 59, 59))).toBe("2026-12-31");
  });

  it("round-trips with parseISODate", () => {
    const date = parseISODate("2026-03-08");
    expect(date && toISODate(date)).toBe("2026-03-08");
  });

  it("todayISO uses the date it is given", () => {
    expect(todayISO(new Date(2026, 10, 19, 23, 30))).toBe("2026-11-19");
    expect(todayISO(new Date(2026, 10, 20, 0, 5))).toBe("2026-11-20");
  });
});

describe("addDaysISO", () => {
  it("moves forward and back across month and year ends", () => {
    expect(addDaysISO("2026-11-19", 1)).toBe("2026-11-20");
    expect(addDaysISO("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysISO("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDaysISO("2026-11-19", 0)).toBe("2026-11-19");
  });

  it("throws on an invalid date instead of guessing", () => {
    expect(() => addDaysISO("nope", 1)).toThrow(RangeError);
  });
});

describe("daysBetween", () => {
  it("counts whole days, positive when the second date is later", () => {
    expect(daysBetween("2026-11-19", "2026-11-19")).toBe(0);
    expect(daysBetween("2026-11-19", "2026-11-24")).toBe(5);
    expect(daysBetween("2026-11-24", "2026-11-19")).toBe(-5);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("is not thrown off by daylight saving changes", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2); // EU spring forward
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2); // US spring forward
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2); // EU/US fall back
  });

  it("throws on an invalid date", () => {
    expect(() => daysBetween("2026-11-19", "2026-02-30")).toThrow(RangeError);
  });
});

describe("display formats", () => {
  it("formats dates for people", () => {
    expect(formatShort("2026-11-19")).toBe("19 Nov");
    expect(formatMedium("2026-11-19")).toBe("19 Nov 2026");
    expect(formatLong("2026-11-19")).toBe("Thursday 19 November 2026");
    expect(formatISO("2026-01-05", "yyyy/MM/dd")).toBe("2026/01/05");
  });
});
