import { useRef } from "react";
import { useDismissableDetails } from "../state/useDismissableDetails";

export interface SkinMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

/** A small "⋯" menu. Closes when you pick something, press Esc, or click elsewhere. */
export default function SkinMenu({ name, items }: { name: string; items: SkinMenuItem[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useDismissableDetails(ref);

  return (
    <details ref={ref} className="skin-menu">
      <summary className="skin-menu-button" aria-label={`Options for ${name}`}>
        <span aria-hidden="true">⋯</span>
      </summary>
      <ul className="skin-menu-list" role="group" aria-label={`${name} options`}>
        {items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className={item.danger ? "skin-menu-item danger" : "skin-menu-item"}
              onClick={() => {
                if (ref.current) ref.current.open = false;
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
