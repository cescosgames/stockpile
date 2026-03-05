import { useState } from "react";
import { DateTime } from "luxon";
import type { Animal, HealthStatus, VaccineEntry } from "../types";

type Props = {
  animal: Animal;
  onEdit: () => void;
  onDelete: () => void;
  onAddVaccine: (animalId: string, entry: Omit<VaccineEntry, "id">) => void;
};

const HEALTH_PILL: Record<HealthStatus, string> = {
  Good: "bg-success-subtle text-success border-success",
  Fair: "bg-warning-subtle text-warning border-warning",
  Poor: "bg-danger-subtle text-danger border-danger",
};

const BLANK_VAX = { date: "", vaccine: "", note: "" };

function formatAge(birthday: string): string {
  if (!birthday) return "Unknown";
  const birth = DateTime.fromISO(birthday);
  const now = DateTime.now();
  const diff = now.diff(birth, ["years", "months"]).toObject();
  const years = Math.floor(diff.years ?? 0);
  const months = Math.floor(diff.months ?? 0);
  if (years === 0) return months <= 1 ? "1 month" : `${months} months`;
  if (months === 0) return years === 1 ? "1 year" : `${years} years`;
  return `${years}y ${months}m`;
}

export default function AnimalCard({ animal, onEdit, onDelete, onAddVaccine }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showVaxForm, setShowVaxForm] = useState(false);
  const [vaxForm, setVaxForm] = useState(BLANK_VAX);

  const vaccineLog = animal.vaccineLog ?? [];

  function submitVaccine(e: React.FormEvent) {
    e.preventDefault();
    if (!vaxForm.vaccine.trim() || !vaxForm.date) return;
    onAddVaccine(animal.id, vaxForm);
    setVaxForm(BLANK_VAX);
    setShowVaxForm(false);
  }

  return (
    <div className="bg-surface-raised rounded-card border border-border overflow-hidden">

      {/* Clickable header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-sunken transition-colors select-none"
      >
        <span
          className="text-text-muted text-base w-5 shrink-0 text-center"
          style={{ display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        >▼</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">{animal.name}</span>
            <span className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border">{animal.type}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${HEALTH_PILL[animal.health]}`}>
              {animal.health}
            </span>
          </div>
        </div>

        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} className="text-xs text-text-muted hover:text-accent px-3 py-1.5 rounded hover:bg-accent-subtle transition-colors">
            Edit
          </button>
          <button onClick={onDelete} className="text-xs text-text-muted hover:text-danger px-3 py-1.5 rounded hover:bg-danger-subtle transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 flex flex-col gap-4">

          {/* Details row */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-text-muted mb-0.5">Sex</p>
              <p className="font-medium text-text-primary">{animal.sex}</p>
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Age</p>
              <p className="font-medium text-text-primary">{formatAge(animal.birthday)}</p>
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Birthday</p>
              <p className="font-medium text-text-primary">
                {animal.birthday
                  ? DateTime.fromISO(animal.birthday).toFormat("dd MMM yyyy")
                  : "—"}
              </p>
            </div>
          </div>

          {animal.notes && (
            <div>
              <p className="text-xs text-text-muted mb-1">Notes</p>
              <p className="text-sm text-text-secondary">{animal.notes}</p>
            </div>
          )}

          {/* Vaccine log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-muted">Vaccine History</p>
              <button
                onClick={() => setShowVaxForm((v) => !v)}
                className="text-xs text-accent hover:text-accent-hover font-medium"
              >
                + Add
              </button>
            </div>

            {vaccineLog.length === 0 && !showVaxForm && (
              <p className="text-xs text-text-muted">No vaccines recorded.</p>
            )}

            <div className="flex flex-col gap-2">
              {vaccineLog.map((v) => (
                <div key={v.id} className="flex items-start gap-3 text-xs bg-surface-sunken rounded px-3 py-2">
                  <span className="text-text-muted w-24 shrink-0">{v.date}</span>
                  <span className="font-medium text-text-primary">{v.vaccine}</span>
                  {v.note && <span className="text-text-secondary">{v.note}</span>}
                </div>
              ))}
            </div>

            {showVaxForm && (
              <form onSubmit={submitVaccine} className="mt-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="border border-border rounded px-2 py-1.5 text-xs bg-surface text-text-primary focus:outline-none focus:border-accent"
                    value={vaxForm.date} onChange={(e) => setVaxForm((p) => ({ ...p, date: e.target.value }))} required
                  />
                  <input
                    placeholder="Vaccine name"
                    className="border border-border rounded px-2 py-1.5 text-xs bg-surface text-text-primary focus:outline-none focus:border-accent"
                    value={vaxForm.vaccine} onChange={(e) => setVaxForm((p) => ({ ...p, vaccine: e.target.value }))} required
                  />
                </div>
                <input
                  placeholder="Note (optional)"
                  className="border border-border rounded px-2 py-1.5 text-xs bg-surface text-text-primary focus:outline-none focus:border-accent"
                  value={vaxForm.note} onChange={(e) => setVaxForm((p) => ({ ...p, note: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowVaxForm(false)} className="flex-1 py-1.5 text-xs border border-border rounded text-text-secondary hover:border-border-strong">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-1.5 text-xs bg-accent text-white rounded font-medium hover:bg-accent-hover">
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
