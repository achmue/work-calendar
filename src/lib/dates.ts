import { addDays, differenceInCalendarDays, format } from "date-fns";
import type { ISODate } from "../types";

// All dates in the app are local "YYYY-MM-DD" strings.
// Never call new Date("2026-11-19"): that is read as UTC and can land on the
// wrong day. Use these helpers instead.

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse "YYYY-MM-DD" as a LOCAL date. Returns null if it isn't a real date. */
export function parseISODate(value: string): Date | null {
  const match = ISO_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month - 1, day); // setFullYear keeps years < 100 intact
  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return isRealDate ? date : null;
}

/** True for a real "YYYY-MM-DD" date (so "2026-02-30" is false). */
export function isISODate(value: unknown): value is ISODate {
  return typeof value === "string" && parseISODate(value) !== null;
}

function mustParse(value: ISODate): Date {
  const date = parseISODate(value);
  if (!date) throw new RangeError(`Not a valid YYYY-MM-DD date: "${value}"`);
  return date;
}

/** A Date to "YYYY-MM-DD" using its local year/month/day. */
export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

/** Today (local) as "YYYY-MM-DD". `now` is a parameter so tests can fix the date. */
export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

/** Add (or subtract, if negative) whole days. */
export function addDaysISO(date: ISODate, days: number): ISODate {
  return toISODate(addDays(mustParse(date), days));
}

/** Whole calendar days from `from` to `to`. Positive if `to` is later. */
export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(mustParse(to), mustParse(from));
}
