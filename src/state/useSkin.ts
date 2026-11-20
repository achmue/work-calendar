import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { isDarkColor } from "../lib/color";
import { requestFonts } from "../lib/fonts";
import { isSafeImageDataUrl } from "../lib/skinSchema";
import { DEFAULT_SKIN, FIRST_RUN_SKIN, presets } from "../skins/presets";
import { loadSkinChoice, loadUserSkins, saveSkinChoice, saveUserSkins } from "../storage/storage";
import type { Skin, SkinChoice } from "../types";

/** The bits of an element applySkin needs. Lets tests pass a simple stand-in. */
export interface SkinTarget {
  style: Pick<CSSStyleDeclaration, "setProperty">;
  dataset: DOMStringMap;
}

/** "surfaceAlt" -> "--surface-alt" */
export function tokenVarName(key: string): string {
  return "--" + key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

/**
 * Every CSS custom property a skin sets. Used for the whole page (applySkin)
 * and for the small live previews in the skin picker.
 */
export function skinCssVars(skin: Skin): Record<string, string> {
  const { bgImage, bgPattern: _pattern, density: _density, chrome: _chrome, lcdBg, lcdText, ...plain } = skin.tokens;
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(plain)) vars[tokenVarName(key)] = value;

  // The LCD display falls back to the usual panel colours, so any skin gets a sensible one
  vars["--lcd-bg"] = lcdBg ?? skin.tokens.surfaceAlt;
  vars["--lcd-text"] = lcdText ?? skin.tokens.accent;
  vars["--bg-image"] = bgImage && isSafeImageDataUrl(bgImage) ? `url("${bgImage}")` : "none";
  // Lets native controls (date pickers, scrollbars) match a dark or light skin.
  vars["color-scheme"] = isDarkColor(skin.tokens.bg) ? "dark" : "light";
  return vars;
}

/** The data-* attributes that switch on a skin's pattern, density and border look. */
export function skinDataAttributes(skin: Skin) {
  return {
    pattern: skin.tokens.bgPattern ?? "none",
    density: skin.tokens.density ?? "comfortable",
    borderStyle: skin.tokens.borderStyle,
    chrome: skin.tokens.chrome ?? "plain",
  };
}

/**
 * Apply a skin to an element (normally <html>) as CSS custom properties.
 * Values go through style.setProperty. We never build a <style> string.
 */
export function applySkin(skin: Skin, root: SkinTarget): void {
  for (const [name, value] of Object.entries(skinCssVars(skin))) {
    root.style.setProperty(name, value);
  }
  const attributes = skinDataAttributes(skin);
  root.dataset.pattern = attributes.pattern;
  root.dataset.density = attributes.density;
  root.dataset.borderStyle = attributes.borderStyle;
  root.dataset.chrome = attributes.chrome;
}

/** After a skin is deleted, anything that pointed at it goes back to a built-in. */
export function choiceWithoutSkin(choice: SkinChoice, id: string): SkinChoice {
  if (choice.mode === "fixed") {
    return choice.id === id ? { mode: "fixed", id: DEFAULT_SKIN.id } : choice;
  }
  return {
    mode: "system",
    lightId: choice.lightId === id ? "clean-light" : choice.lightId,
    darkId: choice.darkId === id ? "clean-dark" : choice.darkId,
  };
}

function useSystemDark(): boolean {
  const query = "(prefers-color-scheme: dark)";
  const [dark, setDark] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia(query);
    const update = () => setDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return dark;
}

/**
 * Skins: the built-in presets plus the user's own, which one is in use (saved
 * in the browser), "follow the system" light/dark, and a temporary preview
 * (used by the skin editor) that overrides what's shown without saving.
 */
export function useSkin() {
  const [userSkins, setUserSkins] = useState<Skin[]>(() => loadUserSkins());
  // Until the person picks a skin we don't save one, so they keep getting the current default.
  const saved = useRef<SkinChoice | null | undefined>(undefined);
  if (saved.current === undefined) saved.current = loadSkinChoice();
  const touched = useRef(saved.current !== null);
  const [choice, setChoiceState] = useState<SkinChoice>(
    () => saved.current ?? { mode: "fixed", id: FIRST_RUN_SKIN.id },
  );
  const setChoice: typeof setChoiceState = (next) => {
    touched.current = true;
    setChoiceState(next);
  };
  const [preview, setPreview] = useState<Skin | null>(null);
  const systemDark = useSystemDark();

  const skins = useMemo(() => [...presets, ...userSkins], [userSkins]);
  const activeId =
    choice.mode === "fixed" ? choice.id : systemDark ? choice.darkId : choice.lightId;
  const activeSkin = skins.find((s) => s.id === activeId) ?? DEFAULT_SKIN;
  const shownSkin = preview ?? activeSkin;

  useLayoutEffect(() => {
    applySkin(shownSkin, document.documentElement);
    requestFonts([shownSkin.tokens.fontBody, shownSkin.tokens.fontDisplay, shownSkin.tokens.fontMono]);
  }, [shownSkin]);

  useEffect(() => {
    if (touched.current) saveSkinChoice(choice);
  }, [choice]);

  useEffect(() => {
    saveUserSkins(userSkins);
  }, [userSkins]);

  const actions = useMemo(
    () => ({
      /** Use this skin. When following the system, it's the skin for the current light/dark mode. */
      chooseSkin(id: string) {
        setChoice((c) => {
          if (c.mode === "fixed") return { mode: "fixed", id };
          return systemDark ? { ...c, darkId: id } : { ...c, lightId: id };
        });
      },
      setFollowSystem(on: boolean) {
        setChoice((c) => {
          if (on === (c.mode === "system")) return c;
          if (!on) return { mode: "fixed", id: activeSkin.id };
          const activeIsDark = isDarkColor(activeSkin.tokens.bg);
          return {
            mode: "system",
            lightId: activeIsDark ? "clean-light" : activeSkin.id,
            darkId: activeIsDark ? activeSkin.id : "clean-dark",
          };
        });
      },
      setSystemSkin(slot: "light" | "dark", id: string) {
        setChoice((c) =>
          c.mode !== "system" ? c : slot === "light" ? { ...c, lightId: id } : { ...c, darkId: id },
        );
      },
      /** Show this skin everywhere without saving it. Pass null to go back to the chosen one. */
      setPreview,
      /** Add a skin of the user's own, or replace it if its id is already saved. */
      saveUserSkin(skin: Skin) {
        setUserSkins((list) =>
          list.some((s) => s.id === skin.id)
            ? list.map((s) => (s.id === skin.id ? skin : s))
            : [...list, skin],
        );
      },
      deleteUserSkin(id: string) {
        setUserSkins((list) => list.filter((s) => s.id !== id));
        setChoice((c) => choiceWithoutSkin(c, id));
      },
      /** Replace all of the user's skins at once (used by backup import). */
      replaceUserSkins(list: Skin[]) {
        setUserSkins(list);
      },
    }),
    [activeSkin, systemDark],
  );

  return { skins, userSkins, choice, activeSkin, shownSkin, systemDark, ...actions };
}

export type SkinApi = ReturnType<typeof useSkin>;
