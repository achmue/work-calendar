import { useId, useState, type ChangeEvent } from "react";
import { MAX_BACKUP_CHARS, buildBackup, describeBackup, mergeProjects, mergeSkins, parseBackup, serializeBackup, type ParsedBackup } from "../lib/backup";
import { todayISO } from "../lib/dates";
import { downloadTextFile, readFileAsText } from "../lib/files";
import type { useProjects } from "../state/useProjects";
import type { SkinApi } from "../state/useSkin";
import type { Project } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import Dialog from "./Dialog";

type ProjectsApi = ReturnType<typeof useProjects>;
type Mode = "merge" | "replace";

interface BackupDialogProps {
  projects: Project[];
  api: Pick<ProjectsApi, "replaceAll">;
  skinApi: SkinApi;
  onClose: () => void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function BackupDialog({ projects, api, skinApi, onClose }: BackupDialogProps) {
  const ids = useId();
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<Mode>("merge");
  const [confirmingReplace, setConfirmingReplace] = useState(false);
  const [result, setResult] = useState("");

  function download() {
    const backup = buildBackup(projects, skinApi.userSkins);
    downloadTextFile(`work-calendar-backup-${todayISO()}.json`, serializeBackup(backup));
    setSaved(`Saved a backup of ${plural(projects.length, "project", "projects")} and ${plural(skinApi.userSkins.length, "skin", "skins")}.`);
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setResult("");
    setPending(null);
    if (!file) return;
    setFileName(file.name);
    if (file.size > MAX_BACKUP_CHARS) {
      setError("That file is too big to be a backup.");
      return;
    }
    try {
      const parsed = parseBackup(await readFileAsText(file));
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setError("");
      setPending(parsed.value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    }
  }

  function restore() {
    if (!pending) return;
    if (mode === "replace") {
      api.replaceAll(pending.projects);
      skinApi.replaceUserSkins(pending.skins);
      setResult(`Done. Everything has been replaced with the backup: ${describeBackup(pending)}.`);
    } else {
      const p = mergeProjects(projects, pending.projects);
      const s = mergeSkins(skinApi.userSkins, pending.skins);
      api.replaceAll(p.items);
      skinApi.replaceUserSkins(s.items);
      const skipped = p.skipped + s.skipped;
      setResult(
        `Done. Added ${plural(p.added, "project", "projects")} and ${plural(s.added, "skin", "skins")}.` +
          (skipped > 0 ? ` ${skipped} you already had ${skipped === 1 ? "was" : "were"} left as ${skipped === 1 ? "it is" : "they are"}.` : ""),
      );
    }
    setPending(null);
    setConfirmingReplace(false);
  }

  const skipped = pending ? pending.skippedProjects + pending.skippedSkins : 0;

  return (
    <Dialog title="Backup" size="wide" onClose={onClose}>
      <section className="backup-section" aria-labelledby={`${ids}-save`}>
        <h3 id={`${ids}-save`} className="day-subtitle">
          Save a backup
        </h3>
        <p className="muted">
          Downloads one file with all your projects, small plans, checklists and your own skins. Keep it somewhere safe, or
          use it to move to another browser.
        </p>
        <div>
          <button type="button" className="btn btn-primary" onClick={download}>
            Download backup
          </button>
        </div>
        {saved && (
          <p role="status" className="backup-ok">
            {saved}
          </p>
        )}
      </section>

      <section className="backup-section" aria-labelledby={`${ids}-restore`}>
        <h3 id={`${ids}-restore`} className="day-subtitle">
          Restore from a backup
        </h3>
        <div className="field">
          <label htmlFor={`${ids}-file`}>Choose a backup file (.json)</label>
          <input id={`${ids}-file`} type="file" accept=".json,application/json" onChange={onFile} />
        </div>

        {error && (
          <p className="field-error backup-message" role="alert">
            {error}
          </p>
        )}

        {pending && (
          <div className="backup-pending" role="group" aria-label="Restore options">
            <p>
              <strong>{fileName}</strong> has {describeBackup(pending)}
              {pending.exportedAt ? `, saved on ${pending.exportedAt.slice(0, 10)}` : ""}.
            </p>
            {skipped > 0 && (
              <p className="muted">
                {skipped === 1 ? "1 entry in the file" : `${skipped} entries in the file`} couldn't be read and will be left out.
              </p>
            )}
            <fieldset className="field backup-mode">
              <legend>What should happen to what you have now?</legend>
              <label className="check">
                <input type="radio" name={`${ids}-mode`} checked={mode === "merge"} onChange={() => setMode("merge")} />
                <span>
                  <strong>Merge:</strong> add what's in the file. Projects you already have are kept as they are.
                </span>
              </label>
              <label className="check">
                <input type="radio" name={`${ids}-mode`} checked={mode === "replace"} onChange={() => setMode("replace")} />
                <span>
                  <strong>Replace:</strong> delete everything you have now and use the file instead.
                </span>
              </label>
            </fieldset>
            <div className="dialog-actions">
              <button
                type="button"
                className={mode === "replace" ? "btn btn-danger" : "btn btn-primary"}
                onClick={() => (mode === "replace" ? setConfirmingReplace(true) : restore())}
              >
                {mode === "replace" ? "Replace everything…" : "Merge into my calendar"}
              </button>
            </div>
          </div>
        )}

        {result && (
          <p role="status" className="backup-ok backup-message">
            {result}
          </p>
        )}
      </section>

      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>

      {confirmingReplace && pending && (
        <ConfirmDialog
          title="Replace everything?"
          message={`You have ${plural(projects.length, "project", "projects")} and ${plural(skinApi.userSkins.length, "skin", "skins")} of your own right now. They will be deleted and replaced with the backup (${describeBackup(pending)}). This can't be undone.`}
          confirmLabel="Replace everything"
          danger
          onConfirm={restore}
          onCancel={() => setConfirmingReplace(false)}
        />
      )}
    </Dialog>
  );
}
