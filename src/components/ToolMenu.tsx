import { useRef } from "react";
import { useDismissableDetails } from "../state/useDismissableDetails";
import { DownloadIcon, KeyboardIcon, SpeakerIcon } from "./icons";

interface ToolMenuProps {
  onOpenBackup: () => void;
  onOpenHelp: () => void;
  sound: { on: boolean; onToggle: () => void };
}

/** The less-used things, tucked behind one "⋯" sticker beside the Skin label. */
export default function ToolMenu({ onOpenBackup, onOpenHelp, sound }: ToolMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  useDismissableDetails(ref);

  // Close first and move to the "⋯" button, so a pop-up has somewhere to give the focus back to.
  const openThen = (action: () => void) => () => {
    const menu = ref.current;
    if (menu) {
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }
    action();
  };

  return (
    <details ref={ref} className="ck-more">
      <summary className="ck-sticker" title="Backup, shortcuts and sound" aria-label="More: backup, keyboard shortcuts and sound">
        <span aria-hidden="true">⋯</span>
      </summary>
      <ul className="ck-more-list" role="group" aria-label="More">
        <li>
          <button type="button" data-backup-button onClick={openThen(onOpenBackup)}>
            <DownloadIcon /> Backup
          </button>
        </li>
        <li>
          <button type="button" data-help-button onClick={openThen(onOpenHelp)}>
            <KeyboardIcon /> Keyboard shortcuts
          </button>
        </li>
        <li>
          <button type="button" aria-pressed={sound.on} data-sound-button onClick={sound.onToggle}>
            <SpeakerIcon on={sound.on} /> Sound effects
            <span className="ck-more-state" aria-hidden="true">
              {sound.on ? "on" : "off"}
            </span>
          </button>
        </li>
      </ul>
    </details>
  );
}
