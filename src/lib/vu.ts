// The analogue VU meter's needle: a value from 0 to `max` swings the needle across an arc.

export const VU_MIN_ANGLE = -52;
export const VU_MAX_ANGLE = 52;

/** Needle angle in degrees (0 = straight up) for a value from 0 to `max`. Out-of-range values are clamped. */
export function vuAngle(value: number, max = 10): number {
  const share = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  return VU_MIN_ANGLE + share * (VU_MAX_ANGLE - VU_MIN_ANGLE);
}

/** A point on a circle, with the angle measured from straight up (clockwise). */
export function polar(cx: number, cy: number, radius: number, degrees: number): { x: number; y: number } {
  const rad = (degrees * Math.PI) / 180;
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) };
}
