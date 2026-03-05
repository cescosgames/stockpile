import { useState } from "react";
import type { Animal, HealthStatus, VaccineEntry } from "../types";
import AnimalCard from "./AnimalCard";
import AnimalForm from "./AnimalForm";

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

function newId() {
  return Date.now().toString();
}

export default function AnimalList({ animals, setAnimals }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Animal | null>(null);

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
    if (!confirm("Delete this animal?")) return;
    setAnimals(animals.filter((a) => a.id !== id));
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

  // Group by type, preserving insertion order
  const groups = animals.reduce<Record<string, Animal[]>>((acc, a) => {
    (acc[a.type] ??= []).push(a);
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
          className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-btn hover:bg-accent-hover transition-colors"
        >
          + Add Animal
        </button>
      </div>

      {animals.length === 0 && (
        <p className="text-sm text-text-muted py-8 text-center">No animals yet. Add your first one.</p>
      )}

      {Object.entries(groups).map(([type, group]) => {
        const counts = group.reduce<Record<HealthStatus, number>>(
          (acc, a) => { acc[a.health] = (acc[a.health] ?? 0) + 1; return acc; },
          { Good: 0, Fair: 0, Poor: 0 }
        );
        return (
          <section key={type}>
            {/* Group header */}
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-sm font-semibold text-text-primary">{type}</h3>
              <span className="text-xs text-text-muted">{group.length}</span>
              <div className="flex gap-1.5 ml-1">
                {(["Good", "Fair", "Poor"] as HealthStatus[]).map((s) =>
                  counts[s] > 0 ? (
                    <span key={s} className="flex items-center gap-1 text-xs text-text-secondary">
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${HEALTH_DOT[s]}`} />
                      {counts[s]} {s}
                    </span>
                  ) : null
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
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
    </div>
  );
}
