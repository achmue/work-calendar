// The board's fixed materials: label tape, metal, brass, manila and ruled lines. A skin's own colours (board,
// frame, paper, ink, marker...) go on top of them, so these live here as data, like project colours,
// rather than in the stylesheets.

/** The wood of the frame and drawer, used when a skin doesn't choose its own. */
export const DEFAULT_FRAME = "#5C3C21";

/** CSS custom properties set on <html> next to the skin's tokens. */
export const MATERIALS: Readonly<Record<string, string>> = {
  // shadows, and the black label-maker tape with its embossed letters
  "--m-shadow": "#0B0C0F",
  "--m-label": "#16171B",
  "--m-label-hi": "#2A2D33",
  "--m-label-ink": "#F2EFE6",
  "--m-label-alert": "#FFB84A",
  // spiral rings
  "--m-metal-hi": "#ECEBE6",
  "--m-metal-lo": "#4A505A",
  // brass nameplate, drawer plate and pegs, and the dark lettering on it
  "--m-brass-0": "#F1DC98",
  "--m-brass-1": "#C9A44F",
  "--m-brass-ink": "#4A3510",
  // the folder of finished projects, and the brown-paper "more" tag
  "--m-manila-0": "#E8C987",
  "--m-manila-1": "#D7B36C",
  "--m-manila-ink": "#3F3014",
  // index card rules
  "--m-card-line": "#8FB4DC",
  "--m-card-rule": "#E7787A",
};
