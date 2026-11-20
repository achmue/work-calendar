// How far through the working day we are, for the progress bar on the deck's LCD.

export const WORKDAY_START = 9; // 9:00
export const WORKDAY_END = 17; // 17:00

/** 0 before the day starts, 1 after it ends, and a steady fill in between. */
export function dayProgress(now: Date, start = WORKDAY_START, end = WORKDAY_END): number {
  const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  return Math.min(1, Math.max(0, (hours - start) / (end - start)));
}

/** "09:05" (24-hour clock, local time). */
export function clockText(now: Date): string {
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(now.getHours())}:${two(now.getMinutes())}`;
}
