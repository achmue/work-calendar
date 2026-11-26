import type { ISODate } from "../types";
import { daysBetween } from "./dates";

export interface DateSpan {
  start: ISODate;
  end: ISODate;
}

/**
 * Packs date spans into as few rows ("lanes") as possible so the timeline stays short:
 * a span goes into the first lane whose previous span ended at least `gap` days before it starts.
 * Returns the lane number (0 = top) for each input span, in the order they were given.
 */
export function assignLanes(spans: readonly DateSpan[], gap = 2): number[] {
  const order = spans
    .map((span, index) => ({ span, index }))
    .sort((a, b) => a.span.start.localeCompare(b.span.start) || a.span.end.localeCompare(b.span.end) || a.index - b.index);
  const laneEnds: ISODate[] = [];
  const lanes = new Array<number>(spans.length).fill(0);
  for (const { span, index } of order) {
    let lane = laneEnds.findIndex((end) => daysBetween(end, span.start) >= gap);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = span.end;
    lanes[index] = lane;
  }
  return lanes;
}
