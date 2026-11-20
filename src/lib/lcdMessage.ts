// A tiny message channel for the LCD: other parts of the app "flash" a short message
// ("TRACK DONE") and the deck's display shows it for a moment, then goes back to the ticker.

export interface LcdMessage {
  text: string;
  /** Changes with every message, so the display can restart its blink. */
  id: number;
}

let current: LcdMessage | null = null;
let counter = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function flashLcd(text: string, milliseconds = 2400): void {
  counter += 1;
  current = { text, id: counter };
  emit();
  if (timer !== undefined) clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, milliseconds);
}

export function subscribeLcd(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getLcdMessage = (): LcdMessage | null => current;
