import { useEffect, useId, useState } from "react";
import { requestFonts, skinFonts } from "../lib/fonts";
import { newId } from "../lib/id";
import { isBuiltInSkin } from "../skins/presets";
import type { SkinApi } from "../state/useSkin";
import type { Skin } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import Dialog from "./Dialog";
import SkinMenu, { type SkinMenuItem } from "./SkinMenu";
import SkinPreview from "./SkinPreview";

interface SkinPickerProps {
  skinApi: SkinApi;
  /** Open the editor: with a copy of a skin (isNew) or with one of the user's own skins. */
  onEdit: (skin: Skin, isNew: boolean) => void;
  onClose: () => void;
}

/** A copy of a skin to start a new one from (the built-in skins can't be changed directly). */
function duplicateOf(skin: Skin): Skin {
  return {
    id: `user-${newId()}`,
    name: `${skin.name} copy`,
    version: 1,
    tokens: { ...skin.tokens },
  };
}

export default function SkinPicker({ skinApi, onEdit, onClose }: SkinPickerProps) {
  const ids = useId();
  const [deleting, setDeleting] = useState<Skin | null>(null);
  const { skins, activeSkin, choice, systemDark } = skinApi;

  // Load the fonts of every skin so each preview looks right.
  useEffect(() => {
    for (const skin of skins) {
      requestFonts(skinFonts(skin.tokens));
    }
  }, [skins]);

  const menuFor = (skin: Skin): SkinMenuItem[] =>
    isBuiltInSkin(skin.id)
      ? [{ label: "Duplicate & edit", onSelect: () => onEdit(duplicateOf(skin), true) }]
      : [
          { label: "Edit", onSelect: () => onEdit(skin, false) },
          { label: "Duplicate & edit", onSelect: () => onEdit(duplicateOf(skin), true) },
          { label: "Delete", onSelect: () => setDeleting(skin), danger: true },
        ];

  return (
    <Dialog title="Skins" onClose={onClose}>
      <p className="muted">Pick a look for the board. It's applied straight away and remembered.</p>
      <button
        type="button"
        className="btn btn-primary skin-customise"
        onClick={() => (isBuiltInSkin(activeSkin.id) ? onEdit(duplicateOf(activeSkin), true) : onEdit(activeSkin, false))}
      >
        Change colours and fonts
      </button>

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
              <SkinMenu name={skin.name} items={menuFor(skin)} />
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

      {deleting && (
        <ConfirmDialog
          title="Delete this skin?"
          message={`"${deleting.name}" will be deleted. If you're using it, the app goes back to Cork Board. This can't be undone.`}
          confirmLabel="Delete skin"
          danger
          onConfirm={() => {
            skinApi.deleteUserSkin(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </Dialog>
  );
}
