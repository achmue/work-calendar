import { useLayoutEffect } from "react";
import { DEFAULT_SKIN } from "../skins/presets";
import type { Skin } from "../types";

/** The bits of an element applySkin needs. Lets tests pass a simple stand-in. */
export interface SkinTarget {
  style: Pick<CSSStyleDeclaration, "setProperty">;
  dataset: DOMStringMap;
}

// Only inline raster images are allowed as a background (CLAUDE.md 7.6).
// Full skin validation arrives in M7/M9; this keeps url() safe in the meantime.
const SAFE_IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

/** "surfaceAlt" -> "--surface-alt" */
export function tokenVarName(key: string): string {
  return "--" + key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

/**
 * Apply a skin to an element (normally <html>) as CSS custom properties.
 * Values go through style.setProperty. We never build a <style> string.
 */
export function applySkin(skin: Skin, root: SkinTarget): void {
  const { bgImage, bgPattern, density, ...plain } = skin.tokens;

  for (const [key, value] of Object.entries(plain)) {
    root.style.setProperty(tokenVarName(key), value);
  }

  root.style.setProperty(
    "--bg-image",
    bgImage && SAFE_IMAGE.test(bgImage) ? `url("${bgImage}")` : "none",
  );
  root.dataset.pattern = bgPattern ?? "none";
  root.dataset.density = density ?? "comfortable";
}

/** Applies the active skin to the page. Choosing and remembering skins comes in M7. */
export function useSkin(skin: Skin = DEFAULT_SKIN): Skin {
  useLayoutEffect(() => {
    applySkin(skin, document.documentElement);
  }, [skin]);
  return skin;
}
