import { useEffect, useRef } from "react";

export interface SkinMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

/** A small "⋯" menu. Closes when you pick something, press Esc, or click elsewhere. */
export default function SkinMenu({ name, items }: { name: string; items: SkinMenuItem[] }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = () => {
      if (ref.current) ref.current.open = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current?.open && event.target instanceof Node && !ref.current.contains(event.target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        // Close just the menu: cancelling the key stops the dialog around it from closing too.
        event.preventDefault();
        event.stopPropagation();
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

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
