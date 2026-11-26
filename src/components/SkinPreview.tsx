import { useMemo, type CSSProperties } from "react";
import { skinCssVars, skinDataAttributes } from "../state/useSkin";
import type { Skin } from "../types";

// Which of the little calendar cells carry a marker.
const MARKS: Record<number, "dot" | "diamond" | "done"> = { 3: "dot", 6: "diamond", 9: "dot", 12: "done" };
const TODAY = 8;

/** A tiny board drawn with a skin's own tokens, so you see the colours and fonts before choosing it. */
export default function SkinPreview({ skin }: { skin: Skin }) {
  const style = useMemo(() => {
    // Only the custom properties; the page-level extras (like color-scheme) don't apply to a card.
    const vars = Object.entries(skinCssVars(skin)).filter(([name]) => name.startsWith("--"));
    return Object.fromEntries(vars) as CSSProperties;
  }, [skin]);
  const attributes = skinDataAttributes(skin);

  return (
    <div className="skin-preview" style={style} data-pattern={attributes.pattern} data-border-style={attributes.borderStyle} aria-hidden="true">
      <div className="sp-paper">
        <span className="sp-title">November</span>
        <div className="sp-grid">
          {Array.from({ length: 14 }, (_, i) => {
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
      </div>
      <div className="sp-side">
        <div className="sp-card">
          <span className="sp-card-title">Project</span>
          <span className="sp-hand">To do</span>
          <span className="sp-badge">3 days left</span>
        </div>
        <span className="sp-drawer" />
      </div>
    </div>
  );
}
