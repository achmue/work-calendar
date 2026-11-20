import { useEffect, useState } from "react";
import { VU_MAX_ANGLE, VU_MIN_ANGLE, polar, vuAngle } from "../lib/vu";

const CX = 50;
const CY = 54;
const TICKS = 9;

/**
 * A little analogue VU meter. The needle springs from rest to the value (with a bit of
 * overshoot, like a real one). Purely decorative: the number beside it says the same thing.
 */
export default function VuMeter({ value, max = 10 }: { value: number; max?: number }) {
  const [shown, setShown] = useState(0);

  // Start at rest, then swing to the value so the needle visibly moves on load and on every change.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const ticks = Array.from({ length: TICKS }, (_, i) => VU_MIN_ANGLE + (i * (VU_MAX_ANGLE - VU_MIN_ANGLE)) / (TICKS - 1));
  const zoneStart = polar(CX, CY, 41, vuAngle(7, 10));
  const zoneEnd = polar(CX, CY, 41, VU_MAX_ANGLE);

  return (
    <svg className="vu" viewBox="0 0 100 58" aria-hidden="true">
      <rect className="vu-face" x="1" y="1" width="98" height="56" rx="7" />
      <path className="vu-zone" d={`M ${zoneStart.x} ${zoneStart.y} A 41 41 0 0 1 ${zoneEnd.x} ${zoneEnd.y}`} />
      {ticks.map((angle) => {
        const from = polar(CX, CY, 35, angle);
        const to = polar(CX, CY, 39, angle);
        return <line key={angle} className="vu-tick" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
      })}
      <text className="vu-label" x="50" y="38" textAnchor="middle">
        VU
      </text>
      <line
        className="vu-needle"
        x1={CX}
        y1={CY}
        x2={CX}
        y2="14"
        style={{ transform: `rotate(${vuAngle(shown, max)}deg)` }}
      />
      <circle className="vu-pivot" cx={CX} cy={CY} r="4" />
    </svg>
  );
}
