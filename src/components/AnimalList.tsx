import { useState } from "react";
import type { Animal, HealthStatus, VaccineEntry } from "../types";
import AnimalCard from "./AnimalCard";
import AnimalForm from "./AnimalForm";
import ConfirmModal from "./ConfirmModal";

type FormData = Omit<Animal, "id" | "healthLog" | "vaccineLog"> & { healthNote?: string };

type Props = {
  animals: Animal[];
  setAnimals: (animals: Animal[]) => void;
};

const HEALTH_DOT: Record<HealthStatus, string> = {
  Good: "bg-success",
  Fair: "bg-warning",
  Poor: "bg-danger",
};

function newId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(15)))
    .map(b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
    .join("");
}

export default function AnimalList({ animals, setAnimals }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Animal | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [retiring, setRetiring] = useState<Animal | null>(null);

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  function handleSave({ healthNote, ...data }: FormData) {
    const today = new Date().toISOString().split("T")[0];
    if (editing) {
      const healthChanged = editing.health !== data.health;
      const healthLog = healthChanged
        ? [...(editing.healthLog ?? []), { date: today, status: data.health, note: healthNote ?? "" }]
        : editing.healthLog;
      setAnimals(animals.map((a) => a.id === editing.id ? { ...editing, ...data, healthLog } : a));
    } else {
      // Log the initial health status when adding a new animal
      setAnimals([...animals, { id: newId(), ...data, healthLog: [{ date: today, status: data.health, note: "" }], vaccineLog: [] }]);
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    const animal = animals.find((a) => a.id === id);
    if (animal) setRetiring(animal);
  }

  function handleAddVaccine(animalId: string, entry: Omit<VaccineEntry, "id">) {
    setAnimals(animals.map((a) =>
      a.id === animalId ? { ...a, vaccineLog: [...(a.vaccineLog ?? []), { id: newId(), ...entry }] } : a
    ));
  }

  function handleDeleteVaccine(animalId: string, vaccineId: string) {
    setAnimals(animals.map((a) =>
      a.id === animalId ? { ...a, vaccineLog: a.vaccineLog.filter((v) => v.id !== vaccineId) } : a
    ));
  }

  function handleDeleteHealthLog(animalId: string, index: number) {
    setAnimals(animals.map((a) =>
      a.id === animalId ? { ...a, healthLog: a.healthLog.filter((_, i) => i !== index) } : a
    ));
  }

  // Group by type (lowercase key for case-insensitive grouping)
  const groups = animals.reduce<Record<string, Animal[]>>((acc, a) => {
    (acc[a.type.toLowerCase()] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Animals</h2>
          <p className="text-xs text-text-muted">{animals.length} individual records</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-accent text-white text-sm font-medium px-5 py-3 rounded-btn hover:bg-accent-hover transition-colors"
        >
          + Add Animal
        </button>
      </div>

      {animals.length === 0 && (
        <p className="text-sm text-text-muted py-8 text-center">No animals yet. Try adding one!</p>
      )}

      {Object.entries(groups).map(([key, group]) => {
        const displayType = group[0].type;
        const isCollapsed = collapsed.has(key);
        const counts = group.reduce<Record<HealthStatus, number>>(
          (acc, a) => { acc[a.health] = (acc[a.health] ?? 0) + 1; return acc; },
          { Good: 0, Fair: 0, Poor: 0 }
        );
        return (
          <section key={key}>
            {/* Group header — full-width button with generous tap target */}
            <button
              onClick={() => toggleGroup(key)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-card border transition-colors select-none mb-2 ${isCollapsed ? "bg-surface-raised border-border hover:bg-surface-sunken active:bg-surface-sunken" : "bg-accent-subtle border-accent"}`}
            >
              <span
                className="text-text-muted text-sm transition-transform duration-150 shrink-0"
                style={{ display: "inline-block", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
              >▼</span>
              <h3 className="text-base font-semibold text-text-primary">{displayType}</h3>
              <span className="text-sm text-text-muted">{group.length}</span>
              <div className="flex gap-2 ml-1">
                {(["Good", "Fair", "Poor"] as HealthStatus[]).map((s) =>
                  counts[s] > 0 ? (
                    <span key={s} className="flex items-center gap-1 text-xs text-text-secondary">
                      <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${HEALTH_DOT[s]}`} />
                      {counts[s]} {s}
                    </span>
                  ) : null
                )}
              </div>
            </button>

            {!isCollapsed && (
              <div className="flex flex-col gap-2 ml-3 pl-3 border-l-2 border-border mb-2">
                {group.map((animal) => (
                  <AnimalCard
                    key={animal.id}
                    animal={animal}
                    onEdit={() => { setEditing(animal); setShowForm(true); }}
                    onDelete={() => handleDelete(animal.id)}
                    onAddVaccine={handleAddVaccine}
                    onDeleteVaccine={handleDeleteVaccine}
                    onDeleteHealthLog={handleDeleteHealthLog}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {showForm && (
        <AnimalForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {retiring && (
        <ConfirmModal
          message={`Retire ${retiring.name} from your records?`}
          confirmLabel="Retire"
          onConfirm={() => { setAnimals(animals.filter((a) => a.id !== retiring.id)); setRetiring(null); }}
          onCancel={() => setRetiring(null)}
        />
      )}
    </div>
  );
}
