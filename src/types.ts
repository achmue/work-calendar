// Shared types.

/** "YYYY-MM-DD", a local date with no time. Use the helpers in lib/dates.ts. */
export type ISODate = string;

export interface Task {
  id: string;
  text: string;
  due: ISODate | "";
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  details: string;
  color: string; // hex, e.g. "#1F8A8A"
  start: ISODate | "";
  deadline: ISODate; // required
  done: boolean; // manual "project finished"
  tasks: Task[];
  createdAt: string; // ISO timestamp
}

/** Which main view is showing. */
export type ViewId = "calendar" | "timeline" | "projects";

export type BorderStyle =
  | "solid"
  | "dashed"
  | "double"
  | "outset"
  | "inset"
  | "ridge"
  | "groove";

export type BgPattern = "none" | "grid" | "dots" | "scanlines";
export type Density = "compact" | "comfortable";

export interface SkinTokens {
  // colours
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentText: string;
  danger: string;
  warning: string;
  success: string;
  // type
  fontBody: string;
  fontDisplay: string;
  fontMono: string;
  fontSize: string; // base, e.g. "15px"
  // shape
  radius: string; // e.g. "10px", "0px" for a square retro look
  borderWidth: string; // e.g. "1px", "2px"
  borderStyle: BorderStyle;
  shadow: string; // e.g. "none" or "0 2px 6px rgba(0,0,0,.2)"
  // extras
  bgImage?: string; // data: URL only, max ~500 KB
  bgPattern?: BgPattern;
  density?: Density;
}

export interface Skin {
  id: string;
  name: string;
  author?: string;
  version: 1;
  tokens: SkinTokens;
}
