import { useRef } from "react";
import { useDismissableDetails } from "../state/useDismissableDetails";
import { DownloadIcon, KeyboardIcon, LogOutIcon, SpeakerIcon } from "./icons";
import type { WorkspaceProps } from "./workspace";

interface ToolMenuProps {
  onOpenBackup: () => void;
  onOpenHelp: () => void;
  sound: { on: boolean; onToggle: () => void };
  account: WorkspaceProps["account"];
}

/** The less-used things, tucked behind one "⋯" sticker beside the Skin label. */
export default function ToolMenu({ onOpenBackup, onOpenHelp, sound, account }: ToolMenuProps) {
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
      <summary className="ck-sticker" title="Backup, shortcuts, sound and log out" aria-label="More: backup, keyboard shortcuts, sound and log out">
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
        <li className="ck-more-who">
          {account.demo ? "You're in the demo. Its changes are cleared when you leave." : `Signed in as ${account.email}`}
        </li>
        <li>
          <button type="button" data-logout-button onClick={account.onLogOut}>
            <LogOutIcon /> {account.demo ? "Leave the demo" : "Log out"}
          </button>
        </li>
      </ul>
    </details>
  );
}
