import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import type { Settings } from "../types";

type Props = {
  settings: Settings;
  onSave: (s: Settings) => void;
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

export default function SettingsModal({ settings, onSave, onClose }: Props) {
  const [form, setForm] = useState(settings);
  const [clock, setClock] = useState("");

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

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised rounded-card border border-border w-full max-w-md shadow-xl">
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

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
