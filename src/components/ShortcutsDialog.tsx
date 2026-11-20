import { SHORTCUT_LIST } from "../lib/shortcuts";
import Dialog from "./Dialog";

export default function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose}>
      <p className="muted">They work anywhere except while you're typing in a box.</p>
      <dl className="shortcut-list">
        {SHORTCUT_LIST.map(({ keys, label }) => (
          <div key={keys} className="shortcut-row">
            <dt>
              {keys.split("  ").map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
      <div className="dialog-actions">
        <button type="button" className="btn btn-primary" data-autofocus onClick={onClose}>
          Got it
        </button>
      </div>
    </Dialog>
  );
}
