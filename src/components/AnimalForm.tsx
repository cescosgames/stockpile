import { useState } from "react";
import type { Animal, HealthStatus, Sex } from "../types";

type FormData = Omit<Animal, "id" | "healthLog" | "vaccineLog"> & { healthNote?: string };

type Props = {
  initial?: Animal;
  onSave: (a: FormData) => void;
  onClose: () => void;
};

const BLANK = { name: "", type: "", health: "Good" as HealthStatus, sex: "Unknown" as Sex, birthday: "", notes: "" };

export default function AnimalForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, type: initial.type, health: initial.health, sex: initial.sex, birthday: initial.birthday, notes: initial.notes }
      : BLANK
  );
  const [healthNote, setHealthNote] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Show the health note field only when editing and health has changed
  const healthChanged = !!initial && form.health !== initial.health;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.type.trim()) return;
    onSave({ ...form, ...(healthChanged ? { healthNote } : {}) });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised rounded-card border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            {initial ? "Edit Animal" : "Add Animal"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Name</span>
              <input
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Bessie or Hen #3" required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Type</span>
              <input
                list="animal-types"
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.type} onChange={(e) => set("type", e.target.value)} placeholder="e.g. Cow" required
              />
              <datalist id="animal-types">
                {["Cow", "Chicken", "Pig", "Sheep", "Goat", "Horse", "Duck"].map((t) => <option key={t} value={t} />)}
              </datalist>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Sex</span>
              <select
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.sex} onChange={(e) => set("sex", e.target.value as Sex)}
              >
                <option>Male</option><option>Female</option><option>Unknown</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Birthday</span>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.birthday} onChange={(e) => set("birthday", e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Health Status</span>
            <div className="flex gap-2">
              {(["Good", "Fair", "Poor"] as HealthStatus[]).map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => set("health", s)}
                  className={[
                    "flex-1 py-2 rounded-btn text-sm font-medium border transition-colors",
                    form.health === s
                      ? s === "Good" ? "bg-success text-white border-success"
                        : s === "Fair" ? "bg-warning text-white border-warning"
                        : "bg-danger text-white border-danger"
                      : "bg-surface border-border text-text-secondary hover:border-border-strong",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Note field appears only when health status has changed */}
            {healthChanged && (
              <input
                className="mt-2 border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                placeholder="Add a note about this change (optional)"
                value={healthNote}
                onChange={(e) => setHealthNote(e.target.value)}
              />
            )}
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Notes</span>
            <textarea
              rows={3}
              className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent resize-none"
              value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any observations..."
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover">
              {initial ? "Save Changes" : "Add Animal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
