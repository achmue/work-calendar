// Optional sound effects, made on the spot with the browser's audio engine (no sound files).
// Off by default. They only play after a click or key press, which browsers require anyway.

let context: AudioContext | null = null;
let enabled = false;

export function setSfxEnabled(on: boolean): void {
  enabled = on;
}

export const isSfxEnabled = (): boolean => enabled;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!context) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

interface Blip {
  from: number;
  to?: number;
  seconds: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function play({ from, to, seconds, type = "square", gain = 0.05, delay = 0 }: Blip): void {
  if (!enabled) return;
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + seconds);
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

export const sfx = {
  /** A light button click. */
  click: () => play({ from: 1900, to: 700, seconds: 0.035 }),
  /** The heavier click of a transport key. */
  key: () => {
    play({ from: 260, to: 90, seconds: 0.09, type: "triangle", gain: 0.18 });
    play({ from: 2200, to: 800, seconds: 0.03, gain: 0.04 });
  },
  /** Ticking a box off. */
  tick: () => play({ from: 1300, to: 2300, seconds: 0.06, type: "triangle", gain: 0.07 }),
  /** The thunk of a cassette ejecting. */
  clunk: () => {
    play({ from: 150, to: 55, seconds: 0.22, type: "sine", gain: 0.3 });
    play({ from: 900, to: 300, seconds: 0.05, gain: 0.05, delay: 0.02 });
  },
  /** A two-note chime. */
  done: () => {
    play({ from: 880, seconds: 0.12, type: "sine", gain: 0.08 });
    play({ from: 1320, seconds: 0.2, type: "sine", gain: 0.08, delay: 0.1 });
  },
};
