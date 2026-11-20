import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { WCAG_AA, parseColor, skinContrastChecks, toHex } from "../lib/color";
import { checkImageFile, readFileAsDataURL } from "../lib/files";
import { FONT_OPTIONS, requestFonts } from "../lib/fonts";
import {
  SHADOW_PRESET_LABELS,
  SHADOW_PRESET_ORDER,
  detectShadowPreset,
  shadowFor,
  type ShadowPreset,
} from "../lib/shadows";
import { BG_PATTERNS, BORDER_STYLES, CHROMES, DENSITIES, isSafeImageDataUrl, sanitizeSkin } from "../lib/skinSchema";
import type { SkinApi } from "../state/useSkin";
import type { Skin, SkinTokens } from "../types";

interface SkinEditorProps {
  /** The skin to start from. For a new skin this is a copy with a fresh id. */
  initial: Skin;
  isNew: boolean;
  skinApi: SkinApi;
  onClose: () => void;
}

type ColorKey =
  | "bg" | "surface" | "surfaceAlt" | "text" | "textMuted" | "border"
  | "accent" | "accentText" | "danger" | "warning" | "success";

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "bg", label: "Page background" },
  { key: "surface", label: "Panels" },
  { key: "surfaceAlt", label: "Panels (alternate)" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Muted text" },
  { key: "border", label: "Borders" },
  { key: "accent", label: "Accent" },
  { key: "accentText", label: "Text on accent" },
  { key: "danger", label: "Overdue / danger" },
  { key: "warning", label: "Due soon / warning" },
  { key: "success", label: "Done / success" },
];

const FONT_SLOTS: { key: "fontBody" | "fontDisplay" | "fontMono"; label: string }[] = [
  { key: "fontBody", label: "Body text" },
  { key: "fontDisplay", label: "Headings" },
  { key: "fontMono", label: "Numbers and dates" },
];

const TEXT_SIZES = [13, 14, 15, 16, 17, 18, 20];

const PATTERN_LABELS: Record<string, string> = {
  none: "None",
  grid: "Grid",
  dots: "Dots",
  scanlines: "Scanlines",
  lines: "Ruled lines",
};

const px = (value: string): number => {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return 0;
  return /rem|em/.test(value) ? n * 16 : n;
};

/** A colour picker plus a text box that takes #hex, rgb() or hsl(). Only valid colours reach the skin. */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const parsed = parseColor(text);
  const valid = parsed !== null;

  // Keep the box in step when the colour changes some other way (e.g. the picker).
  useEffect(() => setText(value), [value]);

  const pickerValue = toHex(parseColor(value) ?? { r: 0, g: 0, b: 0, a: 1 });

  return (
    <div className="color-row">
      <label htmlFor={`${id}-text`}>{label}</label>
      <input
        type="color"
        value={pickerValue}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        aria-label={`${label}: colour picker`}
      />
      <input
        id={`${id}-text`}
        type="text"
        className="color-hex num"
        value={text}
        spellCheck={false}
        autoComplete="off"
        maxLength={60}
        aria-invalid={valid ? undefined : true}
        title={valid ? undefined : "Enter a colour as a hex code, or as an rgb or hsl value."}
        onChange={(e) => {
          setText(e.target.value);
          if (parseColor(e.target.value)) onChange(e.target.value.trim());
        }}
        onBlur={() => setText(value)}
      />
    </div>
  );
}

export default function SkinEditor({ initial, isNew, skinApi, onClose }: SkinEditorProps) {
  const ids = useId();
  const [draft, setDraft] = useState<Skin>(initial);
  const [nameError, setNameError] = useState(false);
  const [imageError, setImageError] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { setPreview } = skinApi;
  const tokens = draft.tokens;

  // Live preview: the whole app shows the draft. Leaving the editor puts the chosen skin back.
  useEffect(() => {
    setPreview(draft);
  }, [draft, setPreview]);
  useEffect(() => () => setPreview(null), [setPreview]);

  useEffect(() => {
    requestFonts([tokens.fontBody, tokens.fontDisplay, tokens.fontMono]);
  }, [tokens.fontBody, tokens.fontDisplay, tokens.fontMono]);

  // Start in the name box; give focus back to the Skins button when we close.
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => document.querySelector<HTMLElement>("[data-skins-button]")?.focus();
  }, []);

  // Esc cancels from anywhere on the page (focus can end up outside the panel, e.g. after
  // removing the picture). If a dialog is open on top, Esc belongs to that dialog instead.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector("dialog[open]")) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setToken<K extends keyof SkinTokens>(key: K, value: SkinTokens[K]) {
    setDraft((d) => ({ ...d, tokens: { ...d.tokens, [key]: value } }));
  }

  function save() {
    if (draft.name.trim() === "") {
      setNameError(true);
      panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      return;
    }
    // Belt and braces: the saved skin always passes the same checks as one loaded from storage.
    const clean = sanitizeSkin(draft) ?? draft;
    skinApi.saveUserSkin(clean);
    skinApi.chooseSkin(clean.id);
    onClose();
  }

  async function onImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      setImageError(problem);
      return;
    }
    try {
      const url = await readFileAsDataURL(file);
      if (!isSafeImageDataUrl(url)) {
        setImageError("That image can't be used. Please try a different PNG, JPEG, WebP or GIF.");
        return;
      }
      setImageError("");
      setToken("bgImage", url);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Couldn't read that image.");
    }
  }

  const checks = skinContrastChecks(tokens);
  const shadowPreset = detectShadowPreset(tokens.shadow, tokens.accent);
  const imageKb = tokens.bgImage ? Math.round((tokens.bgImage.length * 3) / 4 / 1024) : 0;

  return (
    <section
      ref={panelRef}
      className="editor"
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${ids}-title`}
    >
      <header className="editor-header">
        <h2 id={`${ids}-title`} className="dialog-title">
          {isNew ? "New skin" : "Edit skin"}
        </h2>
        <button type="button" className="btn btn-quiet" aria-label="Cancel and close" onClick={onClose}>
          ✕
        </button>
      </header>

      <div className="editor-body">
        <p className="muted">Changes show up on the whole page right away. Cancel puts everything back.</p>

        <div className="field">
          <label htmlFor={`${ids}-name`}>Skin name</label>
          <input
            id={`${ids}-name`}
            type="text"
            value={draft.name}
            maxLength={60}
            data-autofocus
            aria-invalid={nameError ? true : undefined}
            onChange={(e) => {
              setNameError(false);
              setDraft((d) => ({ ...d, name: e.target.value }));
            }}
          />
          {nameError && <p className="field-error">Give your skin a name to save it.</p>}
        </div>
        <div className="field">
          <label htmlFor={`${ids}-author`}>Your name (optional)</label>
          <input
            id={`${ids}-author`}
            type="text"
            value={draft.author ?? ""}
            maxLength={60}
            onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
          />
        </div>

        <fieldset className="editor-group">
          <legend>Colours</legend>
          {COLOR_FIELDS.map(({ key, label }) => (
            <ColorField
              key={key}
              label={label}
              value={tokens[key]}
              onChange={(value) => setToken(key, value)}
            />
          ))}
          {tokens.chrome === "player" && (
            <>
              <ColorField
                label="Display background (LCD)"
                value={tokens.lcdBg ?? tokens.surfaceAlt}
                onChange={(value) => setToken("lcdBg", value)}
              />
              <ColorField
                label="Display text (LCD)"
                value={tokens.lcdText ?? tokens.accent}
                onChange={(value) => setToken("lcdText", value)}
              />
            </>
          )}
          <div className="contrast" role="status" aria-live="polite">
            <h3>Contrast check</h3>
            <ul>
              {checks.map((check) => (
                <li key={check.label} data-ok={check.ok || undefined}>
                  <span aria-hidden="true">{check.ok ? "✓" : "⚠"}</span>{" "}
                  {check.label}: <strong className="num">{check.ratio === null ? "unreadable colour" : `${check.ratio.toFixed(1)}:1`}</strong>
                  {!check.ok && ` (aim for at least ${WCAG_AA}:1 so it's easy to read)`}
                </li>
              ))}
            </ul>
          </div>
        </fieldset>

        <fieldset className="editor-group">
          <legend>Fonts</legend>
          {FONT_SLOTS.map(({ key, label }) => (
            <div className="field" key={key}>
              <label htmlFor={`${ids}-${key}`}>{label}</label>
              <select id={`${ids}-${key}`} value={tokens[key]} onChange={(e) => setToken(key, e.target.value)}>
                {(["System", "Google Fonts"] as const).map((group) => (
                  <optgroup key={group} label={group}>
                    {FONT_OPTIONS.filter((f) => f.group === group).map((f) => (
                      <option key={f.id} value={f.stack}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ))}
          <div className="field">
            <label htmlFor={`${ids}-size`}>Text size</label>
            <select id={`${ids}-size`} value={tokens.fontSize} onChange={(e) => setToken("fontSize", e.target.value)}>
              {TEXT_SIZES.map((n) => (
                <option key={n} value={`${n}px`}>
                  {n}px
                </option>
              ))}
              {!TEXT_SIZES.some((n) => `${n}px` === tokens.fontSize) && (
                <option value={tokens.fontSize}>{tokens.fontSize}</option>
              )}
            </select>
          </div>
        </fieldset>

        <fieldset className="editor-group">
          <legend>Shape</legend>
          <div className="field">
            <label htmlFor={`${ids}-radius`}>
              Corner roundness: <span className="num">{Math.round(px(tokens.radius))}px</span>
            </label>
            <input
              id={`${ids}-radius`}
              type="range"
              min={0}
              max={24}
              step={1}
              value={Math.min(24, Math.round(px(tokens.radius)))}
              onChange={(e) => setToken("radius", `${e.target.value}px`)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${ids}-bw`}>
              Border thickness: <span className="num">{Math.round(px(tokens.borderWidth))}px</span>
            </label>
            <input
              id={`${ids}-bw`}
              type="range"
              min={0}
              max={4}
              step={1}
              value={Math.min(4, Math.round(px(tokens.borderWidth)))}
              onChange={(e) => setToken("borderWidth", `${e.target.value}px`)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${ids}-bs`}>Border style</label>
            <select
              id={`${ids}-bs`}
              value={tokens.borderStyle}
              onChange={(e) => setToken("borderStyle", e.target.value as SkinTokens["borderStyle"])}
            >
              {BORDER_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${ids}-density`}>Spacing</label>
            <select
              id={`${ids}-density`}
              value={tokens.density ?? "comfortable"}
              onChange={(e) => setToken("density", e.target.value as SkinTokens["density"])}
            >
              {DENSITIES.map((d) => (
                <option key={d} value={d}>
                  {d === "compact" ? "Compact" : "Comfortable"}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${ids}-chrome`}>Look</label>
            <select
              id={`${ids}-chrome`}
              value={tokens.chrome ?? "plain"}
              onChange={(e) => setToken("chrome", e.target.value as SkinTokens["chrome"])}
            >
              {CHROMES.map((c) => (
                <option key={c} value={c}>
                  {c === "plain" ? "Plain" : "Player (LCD deck, playlist, cassettes)"}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className="editor-group">
          <legend>Effects</legend>
          <div className="field">
            <label htmlFor={`${ids}-shadow`}>Shadow</label>
            <select
              id={`${ids}-shadow`}
              value={shadowPreset ?? "custom"}
              onChange={(e) => setToken("shadow", shadowFor(e.target.value as ShadowPreset, tokens.accent))}
            >
              {SHADOW_PRESET_ORDER.map((preset) => (
                <option key={preset} value={preset}>
                  {SHADOW_PRESET_LABELS[preset]}
                </option>
              ))}
              {shadowPreset === null && <option value="custom">Custom (kept from the original)</option>}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${ids}-pattern`}>Background pattern</label>
            <select
              id={`${ids}-pattern`}
              value={tokens.bgPattern ?? "none"}
              onChange={(e) => setToken("bgPattern", e.target.value as SkinTokens["bgPattern"])}
            >
              {BG_PATTERNS.map((pattern) => (
                <option key={pattern} value={pattern}>
                  {PATTERN_LABELS[pattern] ?? pattern}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${ids}-image`}>Background picture (PNG, JPEG, WebP or GIF, under 500 KB)</label>
            <input ref={fileRef} id={`${ids}-image`} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onImage} />
            {tokens.bgImage && (
              <p className="muted">
                Picture added (about {imageKb} KB).{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setImageError("");
                    fileRef.current?.focus(); // this button is about to disappear
                    setDraft((d) => {
                      const { bgImage: _removed, ...rest } = d.tokens;
                      return { ...d, tokens: rest };
                    });
                  }}
                >
                  Remove it
                </button>
              </p>
            )}
            {imageError && (
              <p className="field-error" role="alert">
                {imageError}
              </p>
            )}
          </div>
        </fieldset>
      </div>

      <footer className="editor-footer">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={save}>
          Save skin
        </button>
      </footer>
    </section>
  );
}
