import { useState, useEffect, useRef } from "react";
import { DateTime } from "luxon";
import type { Settings, Animal, FeedItem, FeedingTask, WeeklyTask, MonthlyTask, OneOffTask } from "../types";

type ImportPayload = {
  animals: Animal[];
  feedItems: FeedItem[];
  feedingTasks: FeedingTask[];
  weeklyTasks: WeeklyTask[];
  monthlyTasks: MonthlyTask[];
  oneOffTasks: OneOffTask[];
};

type Props = {
  settings: Settings;
  animals: Animal[];
  feedItems: FeedItem[];
  feedingTasks: FeedingTask[];
  weeklyTasks: WeeklyTask[];
  monthlyTasks: MonthlyTask[];
  oneOffTasks: OneOffTask[];
  onSave: (s: Settings) => void;
  onImport: (payload: ImportPayload) => void;
  onWipe: () => void;
  onClose: () => void;
};

const TIMEZONES = [
  { label: "Pacific/Honolulu (HST)",        value: "Pacific/Honolulu" },
  { label: "America/Anchorage (AKST)",      value: "America/Anchorage" },
  { label: "America/Los_Angeles (PT)",      value: "America/Los_Angeles" },
  { label: "America/Phoenix (MST)",         value: "America/Phoenix" },
  { label: "America/Denver (MT)",           value: "America/Denver" },
  { label: "America/Chicago (CT)",          value: "America/Chicago" },
  { label: "America/New_York (ET)",         value: "America/New_York" },
  { label: "America/Halifax (AT)",          value: "America/Halifax" },
  { label: "America/St_Johns (NST)",        value: "America/St_Johns" },
  { label: "America/Sao_Paulo (BRT)",       value: "America/Sao_Paulo" },
  { label: "UTC",                           value: "UTC" },
  { label: "Europe/London (GMT/BST)",       value: "Europe/London" },
  { label: "Europe/Paris (CET)",            value: "Europe/Paris" },
  { label: "Europe/Berlin (CET)",           value: "Europe/Berlin" },
  { label: "Europe/Rome (CET)",             value: "Europe/Rome" },
  { label: "Europe/Athens (EET)",           value: "Europe/Athens" },
  { label: "Europe/Moscow (MSK)",           value: "Europe/Moscow" },
  { label: "Asia/Dubai (GST)",              value: "Asia/Dubai" },
  { label: "Asia/Karachi (PKT)",            value: "Asia/Karachi" },
  { label: "Asia/Kolkata (IST)",            value: "Asia/Kolkata" },
  { label: "Asia/Dhaka (BST)",              value: "Asia/Dhaka" },
  { label: "Asia/Bangkok (ICT)",            value: "Asia/Bangkok" },
  { label: "Asia/Shanghai (CST)",           value: "Asia/Shanghai" },
  { label: "Asia/Tokyo (JST)",              value: "Asia/Tokyo" },
  { label: "Australia/Perth (AWST)",        value: "Australia/Perth" },
  { label: "Australia/Darwin (ACST)",       value: "Australia/Darwin" },
  { label: "Australia/Adelaide (ACST)",     value: "Australia/Adelaide" },
  { label: "Australia/Brisbane (AEST)",     value: "Australia/Brisbane" },
  { label: "Australia/Sydney (AEST/AEDT)", value: "Australia/Sydney" },
  { label: "Pacific/Auckland (NZST)",       value: "Pacific/Auckland" },
];

export default function SettingsModal({ settings, animals, feedItems, feedingTasks, weeklyTasks, monthlyTasks, oneOffTasks, onSave, onImport, onWipe, onClose }: Props) {
  const [form, setForm] = useState(settings);
  const [clock, setClock] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function tick() {
      setClock(DateTime.now().setZone(form.timezone).toFormat("HH:mm:ss, EEE d MMM"));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [form.timezone]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.farmName.trim()) return;
    onSave(form);
    onClose();
  }

  function handleExport() {
    const payload = {
      _stockpile: true,
      exportedAt: new Date().toISOString(),
      animals,
      feedItems,
      feedingTasks,
      weeklyTasks,
      monthlyTasks,
      oneOffTasks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stockpile-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function isValidAnimal(a: unknown): a is Animal {
    if (typeof a !== "object" || a === null) return false;
    const o = a as Record<string, unknown>;
    return (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      typeof o.type === "string" &&
      ["Good", "Fair", "Poor"].includes(o.health as string) &&
      ["Male", "Female", "Unknown"].includes(o.sex as string) &&
      typeof o.birthday === "string" &&
      typeof o.notes === "string" &&
      Array.isArray(o.healthLog) &&
      Array.isArray(o.vaccineLog)
    );
  }

  function isValidFeedItem(f: unknown): f is FeedItem {
    if (typeof f !== "object" || f === null) return false;
    const o = f as Record<string, unknown>;
    return (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      typeof o.unit === "string" &&
      typeof o.qty === "number" &&
      typeof o.minQty === "number" &&
      typeof o.maxQty === "number" &&
      typeof o.scoopSize === "number"
    );
  }

  function isValidFeedingTask(t: unknown): t is FeedingTask {
    if (typeof t !== "object" || t === null) return false;
    const o = t as Record<string, unknown>;
    return (
      typeof o.id === "string" &&
      typeof o.label === "string" &&
      ["AM", "PM"].includes(o.session as string)
    );
  }

  function isValidSimpleTask(t: unknown): t is WeeklyTask {
    if (typeof t !== "object" || t === null) return false;
    const o = t as Record<string, unknown>;
    return typeof o.id === "string" && typeof o.label === "string";
  }

  function isValidOneOffTask(t: unknown): t is OneOffTask {
    if (typeof t !== "object" || t === null) return false;
    const o = t as Record<string, unknown>;
    return typeof o.id === "string" && typeof o.label === "string" && typeof o.done === "boolean";
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data._stockpile !== true) {
          setImportError("This file wasn't exported from Stockpile. No changes made.");
          return;
        }
        if (!Array.isArray(data.animals) || !data.animals.every(isValidAnimal)) {
          setImportError("File contains invalid animal data. No changes made.");
          return;
        }
        if (data.feedItems !== undefined && (!Array.isArray(data.feedItems) || !data.feedItems.every(isValidFeedItem))) {
          setImportError("File contains invalid feed data. No changes made.");
          return;
        }
        if (data.feedingTasks !== undefined && (!Array.isArray(data.feedingTasks) || !data.feedingTasks.every(isValidFeedingTask))) {
          setImportError("File contains invalid feeding task data. No changes made.");
          return;
        }
        if (data.weeklyTasks !== undefined && (!Array.isArray(data.weeklyTasks) || !data.weeklyTasks.every(isValidSimpleTask))) {
          setImportError("File contains invalid weekly task data. No changes made.");
          return;
        }
        if (data.monthlyTasks !== undefined && (!Array.isArray(data.monthlyTasks) || !data.monthlyTasks.every(isValidSimpleTask))) {
          setImportError("File contains invalid monthly task data. No changes made.");
          return;
        }
        if (data.oneOffTasks !== undefined && (!Array.isArray(data.oneOffTasks) || !data.oneOffTasks.every(isValidOneOffTask))) {
          setImportError("File contains invalid one-off task data. No changes made.");
          return;
        }
        onImport({
          animals: data.animals,
          feedItems: data.feedItems ?? feedItems,
          feedingTasks: data.feedingTasks ?? feedingTasks,
          weeklyTasks: data.weeklyTasks ?? weeklyTasks,
          monthlyTasks: data.monthlyTasks ?? monthlyTasks,
          oneOffTasks: data.oneOffTasks ?? oneOffTasks,
        });
        onClose();
      } catch {
        setImportError("Couldn't read the file. Make sure it's a valid Stockpile export.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleWipeConfirm() {
    onWipe();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-raised rounded-card border border-border w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto themed-scroll" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Settings</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Farm Name</span>
            <input
              className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
              value={form.farmName}
              onChange={(e) => setForm((p) => ({ ...p, farmName: e.target.value }))}
              placeholder="e.g. Giannini Farm"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Timezone</span>
            <select
              className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
              value={form.timezone}
              onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              Current time in selected zone: <span className="font-medium text-text-primary tabular-nums">{clock}</span>
            </p>
            <p className="text-xs text-text-muted">Checklist resets at midnight in this timezone.</p>
          </label>

          {/* Sync */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-text-secondary">Sync</span>
            <div className="flex rounded-btn border border-border overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, syncMode: "local", pbUrl: p.pbUrl }))}
                className={[
                  "flex-1 py-2 transition-colors",
                  form.syncMode === "local"
                    ? "bg-accent text-white font-medium"
                    : "bg-surface text-text-secondary hover:text-text-primary",
                ].join(" ")}
              >
                Local only
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, syncMode: "network" }))}
                className={[
                  "flex-1 py-2 transition-colors border-l border-border",
                  form.syncMode === "network"
                    ? "bg-accent text-white font-medium"
                    : "bg-surface text-text-secondary hover:text-text-primary",
                ].join(" ")}
              >
                Local network
              </button>
            </div>
            {form.syncMode === "network" && (
              <input
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent font-mono"
                value={form.pbUrl}
                onChange={(e) => setForm(p => ({ ...p, pbUrl: e.target.value }))}
                placeholder="http://192.168.1.42:8090"
                spellCheck={false}
              />
            )}
            <p className="text-xs text-text-muted">
              {form.syncMode === "local"
                ? "Data is saved on this device only."
                : "Data syncs in real time with a PocketBase server on your local network. Changes to sync mode take effect after reloading the app."}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover">
              Save Settings
            </button>
          </div>
        </form>

        {/* Data management */}
        <div className="px-6 pb-6 flex flex-col gap-4 border-t border-border pt-5">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Farm Data</p>
            <div className="relative group">
              <span className="w-4 h-4 rounded-full border border-text-muted text-text-muted text-[10px] font-bold flex items-center justify-center cursor-help select-none">?</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-stone-800 text-white text-xs rounded-md px-3 py-2 hidden group-hover:block z-10 leading-relaxed">
                Regularly export your farm data as a backup. If your data is ever lost or reset, you can restore it from an export file.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex-1 py-2 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong"
            >
              Export Data
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong"
            >
              Import Data
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
          {importError && <p className="text-xs text-red-600">{importError}</p>}
          <p className="text-xs text-text-muted">Import replaces your current animals, feed inventory, and tasks with the contents of a Stockpile export file.</p>
        </div>

        {/* Danger zone */}
        <div className="px-6 pb-6 flex flex-col gap-3 border-t border-border pt-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Danger Zone</p>
          {!confirmWipe ? (
            <button
              onClick={() => setConfirmWipe(true)}
              className="py-2 rounded-btn border border-red-300 text-sm text-red-600 hover:bg-red-50"
            >
              Wipe All Data
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-red-600">This will permanently delete all animals, feed items, and tasks. Are you sure?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmWipe(false)} className="flex-1 py-2 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">
                  Cancel
                </button>
                <button onClick={handleWipeConfirm} className="flex-1 py-2 rounded-btn bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                  Yes, Wipe Everything
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Version */}
        <div className="px-6 pb-5 border-t border-border pt-4">
          <p className="text-xs text-text-muted">stockpile v0.2.1</p>
        </div>
      </div>
    </div>
  );
}
