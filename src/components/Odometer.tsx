import { useEffect, useState } from "react";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * A mechanical counter: each digit is a little wheel that rolls to its number.
 * Screen readers get the plain text; the wheels are decoration.
 */
export default function Odometer({ value }: { value: string }) {
  // Start every wheel at zero, then roll, so the counter visibly spins up on load.
  const [rolled, setRolled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setRolled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span className="odo">
      <span className="sr-only">{value}</span>
      <span className="odo-wheels" aria-hidden="true">
        {[...value].map((char, i) =>
          /\d/.test(char) ? (
            <span key={i} className="odo-wheel">
              <span className="odo-strip" style={{ transform: `translateY(${rolled ? -Number(char) : 0}em)` }}>
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i} className="odo-sep">
              {char}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
