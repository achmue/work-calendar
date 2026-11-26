// The physical materials the layouts are "made of": smoked glass, recording tape, metal, paper, cork.
// They are the same in every skin of a layout (a skin's own colours go on top of them), so they live
// here as data, like project colours, rather than in the stylesheets.

/** CSS custom properties set on <html> next to the skin's tokens. */
export const MATERIALS: Readonly<Record<string, string>> = {
  // smoked glass of the tape deck's window, and the ink printed on it
  "--m-glass-0": "#0B0C0F",
  "--m-glass-1": "#16181D",
  "--m-glass-2": "#20242B",
  "--m-glass-line": "#3A3F48",
  "--m-ink": "#ECE7DC",
  "--m-ink-muted": "#B4B0A5",
  "--m-amber": "#FFB84A",
  // recording tape and the reels
  "--m-tape-0": "#4A3A30",
  "--m-tape-1": "#33271F",
  "--m-tape-2": "#2C2119",
  "--m-reel-pack": "#3B2D24",
  "--m-hub": "#ECEBE6",
  "--m-hub-dark": "#121212",
  // cork board, wood and card stock (the cork layout)
  "--m-cork-0": "#B9874F",
  "--m-cork-1": "#A9783F",
  "--m-wood-0": "#8A5A2E",
  "--m-wood-1": "#5A3A1F",
  "--m-brass-0": "#F1DC98",
  "--m-brass-1": "#C9A44F",
  "--m-card": "#FFFEFA",
  "--m-card-line": "#C6D8EB",
  "--m-card-rule": "#E7787A",
  "--m-calendar": "#FBF7EC",
  "--m-calendar-ink": "#26303F",
};
