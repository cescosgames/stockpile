import { useState } from "react";
import type { FeedItem, FeedingTask } from "../types";
import FeedForm from "./FeedForm";
import ConfirmModal from "./ConfirmModal";

type Props = {
  feedItems: FeedItem[];
  feedingTasks: FeedingTask[];
  setFeedItems: (items: FeedItem[]) => void;
};

function newId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(15)))
    .map(b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
    .join("");
}

function dailyScoops(item: FeedItem, tasks: FeedingTask[]): number {
  return tasks
    .filter((t) => t.feedItemId === item.id)
    .reduce((s, t) => s + (t.scoops ?? 0), 0);
}

export default function FeedList({ feedItems, feedingTasks, setFeedItems }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeedItem | null>(null);
  const [restocking, setRestocking] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [deleting, setDeleting] = useState<FeedItem | null>(null);

  function handleSave(data: Omit<FeedItem, "id">) {
    if (editing) {
      setFeedItems(feedItems.map((f) => f.id === editing.id ? { ...editing, ...data } : f));
    } else {
      setFeedItems([...feedItems, { id: newId(), ...data }]);
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    const item = feedItems.find((f) => f.id === id);
    if (item) setDeleting(item);
  }

  function handleRestock(id: string) {
    const add = parseFloat(restockQty);
    if (!add || add <= 0) return;
    setFeedItems(feedItems.map((f) => f.id === id ? { ...f, qty: +(f.qty + add).toFixed(2) } : f));
    setRestocking(null);
    setRestockQty("");
  }

  const lowCount = feedItems.filter((f) => f.qty <= f.minQty).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Feed Inventory</h2>
            <div className="relative group">
              <span className="w-4 h-4 rounded-full border border-text-muted text-text-muted text-[10px] font-bold flex items-center justify-center cursor-help select-none">?</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-stone-800 text-white text-xs rounded-md px-3 py-2 hidden group-hover:block z-10 leading-relaxed">
                Stock quantities are self-reported. Regularly check for spoilage, rot, spills, and pests to make sure your records reflect what's actually on hand.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-800" />
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            {feedItems.length} items
            {lowCount > 0 && <span className="text-warning ml-2">· {lowCount} low stock</span>}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-accent text-white text-sm font-medium px-5 py-3 rounded-btn hover:bg-accent-hover transition-colors"
        >
          + Add Item
        </button>
      </div>

      {feedItems.length === 0 && (
        <p className="text-sm text-text-muted py-8 text-center">No feed items yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {feedItems.map((f) => {
          const isLow = f.qty <= f.minQty;
          const scoopsLeft = f.scoopSize > 0 ? Math.floor(f.qty / f.scoopSize) : 0;
          const daily = dailyScoops(f, feedingTasks);
          const daysLeft = daily > 0 ? Math.floor(scoopsLeft / daily) : null;
          const pct = Math.min(100, f.maxQty > 0 ? Math.round((f.qty / f.maxQty) * 100) : 100);

          return (
            <div key={f.id} className={`bg-surface-raised rounded-card border ${isLow ? "border-warning" : "border-border"} p-4`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {isLow && <span className="text-warning text-sm">⚠</span>}
                    <span className="text-sm font-semibold text-text-primary">{f.name}</span>
                  </div>
                  {f.location && <p className="text-xs text-text-muted mt-0.5">{f.location}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-text-secondary">
                    <span>{f.qty} {f.unit} in stock</span>
                    <span className={isLow ? "text-warning font-medium" : ""}>{scoopsLeft} {f.servingUnit || "scoop"}s left</span>
                    <span>{f.scoopSize} {f.unit}/{f.servingUnit || "scoop"}</span>
                    {daysLeft !== null && (
                      <span className={daysLeft <= 2 ? "text-danger font-medium" : ""}>{daysLeft}d remaining</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setRestocking(f.id); setRestockQty(""); }} title="Restock" className="text-sm text-text-muted hover:text-success px-2 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-success-subtle transition-colors">
                    <span className="sm:hidden text-2xl leading-none">+</span><span className="hidden sm:inline">+ Stock</span>
                  </button>
                  <button onClick={() => { setEditing(f); setShowForm(true); }} title="Edit" className="text-sm text-text-muted hover:text-accent px-2 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-accent-subtle transition-colors">
                    <span className="sm:hidden text-2xl leading-none">✎</span><span className="hidden sm:inline">Edit</span>
                  </button>
                  <button onClick={() => handleDelete(f.id)} title="Delete" className="text-sm text-text-muted hover:text-danger px-2 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-danger-subtle transition-colors">
                    <span className="sm:hidden text-2xl leading-none">✕</span><span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* Stock bar */}
              <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isLow ? "bg-warning" : "bg-success"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>Low stock: {f.minQty} {f.unit}</span>
                <span>Target: {f.maxQty} {f.unit}</span>
              </div>

              {/* Inline restock */}
              {restocking === f.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="number" min="0.1" step="0.1" autoFocus
                    placeholder={`Add ${f.unit || "units"}...`}
                    className="flex-1 border border-border rounded px-3 py-1.5 text-sm bg-surface text-text-primary focus:outline-none focus:border-success"
                    value={restockQty} onChange={(e) => setRestockQty(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRestock(f.id)}
                  />
                  <button onClick={() => handleRestock(f.id)} className="px-3 py-1.5 text-sm bg-success text-white rounded font-medium hover:bg-green-600">
                    Add
                  </button>
                  <button onClick={() => setRestocking(null)} className="px-3 py-1.5 text-sm border border-border rounded text-text-secondary hover:border-border-strong">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <FeedForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <ConfirmModal
          message={`Remove ${deleting.name} from your feed inventory?`}
          confirmLabel="Remove"
          onConfirm={() => { setFeedItems(feedItems.filter((f) => f.id !== deleting.id)); setDeleting(null); }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
