import { useEffect, useId, useRef, type ReactNode } from "react";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "normal" | "wide";
}

/**
 * A modal dialog on the native <dialog> element: Esc closes it, focus stays
 * inside, and the page behind is inert. Render it only while it should be open.
 * Put data-autofocus on the element that should get focus first.
 */
export default function Dialog({ title, onClose, children, size = "normal" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Remember what had focus so we can give it back. The browser can't do this
    // itself because React removes the <dialog> from the page when it closes.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`dialog dialog-${size}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // React lets a nested dialog's cancel bubble up to this one. Only react to our own.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      // A press on the dim backdrop lands on the <dialog> itself (the body fills the rest).
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-body">
        <header className="dialog-header">
          <h2 id={titleId} className="dialog-title">
            {title}
          </h2>
          <button type="button" className="btn btn-quiet" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
