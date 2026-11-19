import { useEffect, useId } from "react";
import { requestFonts } from "../lib/fonts";
import { isBuiltInSkin } from "../skins/presets";
import type { SkinApi } from "../state/useSkin";
import Dialog from "./Dialog";
import SkinPreview from "./SkinPreview";

interface SkinPickerProps {
  skinApi: SkinApi;
  onClose: () => void;
}

export default function SkinPicker({ skinApi, onClose }: SkinPickerProps) {
  const ids = useId();
  const { skins, activeSkin, choice, systemDark } = skinApi;

  // Load the fonts of every skin so each preview looks right.
  useEffect(() => {
    for (const skin of skins) {
      requestFonts([skin.tokens.fontBody, skin.tokens.fontDisplay, skin.tokens.fontMono]);
    }
  }, [skins]);

  return (
    <Dialog title="Skins" size="wide" onClose={onClose}>
      <p className="muted">Pick a look for the whole app. It's applied straight away and remembered.</p>

      <ul className="skin-grid">
        {skins.map((skin) => {
          const active = skin.id === activeSkin.id;
          const builtIn = isBuiltInSkin(skin.id);
          return (
            <li key={skin.id} className="skin-card" data-active={active || undefined}>
              <button
                type="button"
                className="skin-select"
                aria-pressed={active}
                onClick={() => skinApi.chooseSkin(skin.id)}
              >
                <SkinPreview skin={skin} />
                <span className="skin-name">{skin.name}</span>
                <span className="muted skin-meta">
                  {builtIn ? "Built-in" : "Yours"}
                  {skin.author ? ` · by ${skin.author}` : ""}
                  {active ? " · in use" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <fieldset className="follow-system">
        <legend className="sr-only">Follow the system setting</legend>
        <label className="check">
          <input
            type="checkbox"
            checked={choice.mode === "system"}
            onChange={(e) => skinApi.setFollowSystem(e.target.checked)}
          />
          Follow system light/dark
        </label>

        {choice.mode === "system" && (
          <>
            <p className="muted">
              Your device is in {systemDark ? "dark" : "light"} mode right now, so you're seeing the{" "}
              {systemDark ? "dark" : "light"} skin. Picking a skin above changes that one.
            </p>
            <div className="form-row">
              <div className="field">
                <label htmlFor={`${ids}-light`}>Skin for light mode</label>
                <select
                  id={`${ids}-light`}
                  value={choice.lightId}
                  onChange={(e) => skinApi.setSystemSkin("light", e.target.value)}
                >
                  {skins.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`${ids}-dark`}>Skin for dark mode</label>
                <select
                  id={`${ids}-dark`}
                  value={choice.darkId}
                  onChange={(e) => skinApi.setSystemSkin("dark", e.target.value)}
                >
                  {skins.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </fieldset>

      <div className="dialog-actions">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Dialog>
  );
}
