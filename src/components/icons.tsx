// Small line icons shared by the layouts. They take their colour from the text around them.

const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export function PaletteIcon() {
  return (
    <svg {...base}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.4-1.2.4-2.1 1.6-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="15" cy="7" r="1" />
    </svg>
  );
}

export function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg {...base}>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6m0-6-5 6" />}
    </svg>
  );
}

export function KeyboardIcon() {
  return (
    <svg {...base}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg {...base}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** Filled transport symbols (like the keys on a tape deck). */
export function TransportIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="tp-icon">
      <path d={path} />
    </svg>
  );
}

export const TRANSPORT = {
  prevMonth: "M4 5h2v14H4zM19 5v14L8 12z",
  rewind: "M11 5v14L2 12zM21 5v14l-9-7z",
  play: "M8 5v14l11-7z",
  forward: "M3 5v14l9-7zM13 5v14l9-7z",
  nextMonth: "M5 5l11 7-11 7zM18 5h2v14h-2z",
  record: "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z",
  eject: "M12 4 3 15h18zM4 18h16v2H4z",
} as const;
