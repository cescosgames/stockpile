import { useState } from "react";
import { DateTime } from "luxon";
import type { Animal, FeedItem, FeedingTask, Note, CheckedState, HealthStatus } from "../types";

type Props = {
  animals: Animal[];
  feedItems: FeedItem[];
  feedingTasks: FeedingTask[];
  checkedState: CheckedState;
  timezone: string;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
};

const HEALTH_STYLE: Record<HealthStatus, string> = {
  Good: "bg-success-subtle text-success",
  Fair: "bg-warning-subtle text-warning",
  Poor: "bg-danger-subtle text-danger",
};

function todayKey(tz: string) {
  return DateTime.now().setZone(tz).toISODate() ?? "";
}

function isTaskDone(task: FeedingTask, animals: Animal[], date: string, checkedState: CheckedState): boolean {
  if (task.perAnimal && task.animalType) {
    const group = animals.filter((a) => a.type.toLowerCase() === task.animalType!.toLowerCase());
    return group.length > 0 && group.every((a) => !!checkedState[`${date}-${task.session}-${task.id}-${a.id}`]);
  }
  return !!checkedState[`${date}-${task.session}-${task.id}`];
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-surface-raised rounded-card border border-border p-5">
      <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ?? "text-text-primary"}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ animals, feedItems, feedingTasks, checkedState, timezone, notes, setNotes }: Props) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const today = todayKey(timezone);
  const totalAnimals = animals.length;
  const lowStock = feedItems.filter((f) => f.qty <= f.minQty);

  const amTasks = feedingTasks.filter((t) => t.session === "AM");
  const pmTasks = feedingTasks.filter((t) => t.session === "PM");
  const amDone = amTasks.filter((t) => isTaskDone(t, animals, today, checkedState)).length;
  const pmDone = pmTasks.filter((t) => isTaskDone(t, animals, today, checkedState)).length;

  const healthCounts = animals.reduce(
    (acc, a) => { acc[a.health] = (acc[a.health] ?? 0) + 1; return acc; },
    {} as Record<HealthStatus, number>,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Animals" value={totalAnimals} sub={`${new Set(animals.map((a) => a.type.toLowerCase())).size} types`} />
        <StatCard
          label="Low Stock"
          value={lowStock.length}
          sub={lowStock.length ? lowStock.map((f) => f.name).join(", ") : "All stocked"}
          accent={lowStock.length ? "text-warning" : "text-success"}
        />
        <StatCard label="AM Tasks" value={`${amDone}/${amTasks.length}`} sub="completed today" accent={amDone === amTasks.length ? "text-success" : "text-text-primary"} />
        <StatCard label="PM Tasks" value={`${pmDone}/${pmTasks.length}`} sub="completed today" accent={pmDone === pmTasks.length ? "text-success" : "text-text-primary"} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Animal health */}
        <section className="bg-surface-raised rounded-card border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Animal Health</h2>
          <div className="flex flex-col gap-2">
            {animals.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-text-primary">{a.name}</span>
                  <span className="text-xs text-text-muted ml-2">{a.type}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${HEALTH_STYLE[a.health]}`}>
                  {a.health}
                </span>
              </div>
            ))}
            {animals.length === 0 && <p className="text-sm text-text-muted">No animals added yet.</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex gap-3">
            {(["Good", "Fair", "Poor"] as HealthStatus[]).map((s) => (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${HEALTH_STYLE[s]}`}>
                {healthCounts[s] ?? 0} {s}
              </span>
            ))}
          </div>
        </section>

        {/* Feed inventory */}
        <section className="bg-surface-raised rounded-card border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Feed Inventory</h2>
          <div className="flex flex-col gap-3">
            {feedItems.map((f) => {
              const pct = Math.min(100, Math.round((f.qty / Math.max(f.maxQty, 1)) * 100));
              const isLow = f.qty <= f.minQty;
              return (
                <div key={f.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium ${isLow ? "text-warning" : "text-text-primary"}`}>
                      {isLow ? "⚠ " : ""}{f.name}
                    </span>
                    <span className="text-text-muted">{f.qty} / {f.maxQty} {f.unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {feedItems.length === 0 && <p className="text-sm text-text-muted">No feed items added yet.</p>}
          </div>
        </section>
      </div>

      {/* Farm Notes */}
      <section className="bg-surface-raised rounded-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Farm Notes</h2>
          <button
            onClick={() => setShowNoteForm((v) => !v)}
            className="text-xs text-accent hover:text-accent-hover font-medium"
          >
            + New Note
          </button>
        </div>

        {showNoteForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!noteText.trim()) return;
              const today = DateTime.now().setZone(timezone).toISODate() ?? "";
              const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(15))).map(b => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62]).join("");
              setNotes([{ id: newId(), date: today, text: noteText.trim() }, ...notes]);
              setNoteText("");
              setShowNoteForm(false);
            }}
            className="mb-4 flex flex-col gap-2"
          >
            <textarea
              rows={3}
              autoFocus
              className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent resize-none"
              placeholder="Write a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowNoteForm(false); setNoteText(""); }} className="flex-1 py-1.5 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">Cancel</button>
              <button type="submit" className="flex-1 py-1.5 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover">Save</button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto themed-scroll">
          {notes.length === 0 && <p className="text-sm text-text-muted">No notes yet.</p>}
          {notes.map((note) => (
            <div key={note.id} className="flex gap-3 bg-surface-sunken rounded px-3 py-2.5">
              <span className="text-xs text-text-muted w-24 shrink-0 pt-0.5">{DateTime.fromISO(note.date).toFormat("dd MMM yyyy")}</span>
              <p className="text-sm text-text-primary flex-1 whitespace-pre-wrap">{note.text}</p>
              <button
                onClick={() => setNotes(notes.filter((n) => n.id !== note.id))}
                className="text-text-muted hover:text-danger transition-colors shrink-0 text-xs"
              >✕</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
