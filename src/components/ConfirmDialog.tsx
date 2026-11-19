import Dialog from "./Dialog";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** Style the confirm button as a warning (for deleting things). */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-app "are you sure?" step. Cancel is focused first so Enter can't delete by accident. */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="dialog-actions">
        <button type="button" className="btn" data-autofocus onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? "btn btn-danger-solid" : "btn btn-primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
