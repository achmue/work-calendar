import { useMemo, type CSSProperties } from "react";
import { skinCssVars, skinDataAttributes } from "../state/useSkin";
import type { Skin } from "../types";

// Which of the little calendar cells carry a marker (and what kind).
const MARKS: Record<number, "dot" | "diamond" | "done"> = { 3: "dot", 9: "diamond", 12: "dot", 16: "done" };
const TODAY = 10;

/** A small mini-calendar drawn with a skin's own tokens, so you see the look before choosing it. */
export default function SkinPreview({ skin }: { skin: Skin }) {
  const style = useMemo(() => {
    // Only the custom properties; the page-level extras (like color-scheme) don't apply to a card.
    const vars = Object.entries(skinCssVars(skin)).filter(([name]) => name.startsWith("--"));
    return Object.fromEntries(vars) as CSSProperties;
  }, [skin]);
  const attributes = skinDataAttributes(skin);

  return (
    <div
      className="skin-preview"
      style={style}
      data-pattern={attributes.pattern}
      data-border-style={attributes.borderStyle}
      aria-hidden="true"
    >
      <div className="sp-head">
        <span className="sp-title">November</span>
        <span className="sp-chip">Today</span>
      </div>
      <div className="sp-grid">
        {Array.from({ length: 21 }, (_, i) => {
          const day = i + 1;
          const mark = MARKS[day];
          return (
            <span key={day} className="sp-cell" data-today={day === TODAY || undefined}>
              <span className="sp-num">{day}</span>
              {mark && <span className="sp-mark" data-kind={mark} />}
            </span>
          );
        })}
      </div>
      <div className="sp-bar">
        <i />
      </div>
      <div className="sp-row">
        <span className="sp-badge">3 days left</span>
        <span className="sp-readout">2/5</span>
      </div>
    </div>
  );
}
