import { useState } from "react";
import type { FeedItem } from "../types";

type Props = {
  initial?: FeedItem;
  onSave: (f: Omit<FeedItem, "id">) => void;
  onClose: () => void;
};

const BLANK: Omit<FeedItem, "id"> = { name: "", unit: "kg", qty: 0, minQty: 0, maxQty: 0, scoopSize: 0.5 };

export default function FeedForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<FeedItem, "id">>(
    initial ? { name: initial.name, unit: initial.unit, qty: initial.qty, minQty: initial.minQty, maxQty: initial.maxQty, scoopSize: initial.scoopSize } : BLANK
  );

  const setNum = (k: keyof Omit<FeedItem, "id" | "name" | "unit">, v: string) =>
    setForm((p) => ({ ...p, [k]: parseFloat(v) || 0 }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.scoopSize <= 0) return;
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-raised rounded-card border border-border w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            {initial ? "Edit Feed Item" : "Add Feed Item"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-xs font-medium text-text-secondary">Feed Name</span>
              <input
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Hay, Corn Feed" required
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Unit</span>
            <div className="flex gap-2">
              {(["kg", "lbs"] as const).map((u) => (
                <button
                  key={u} type="button"
                  onClick={() => setForm((p) => ({ ...p, unit: u }))}
                  className={[
                    "flex-1 py-2 rounded-btn text-sm font-medium border transition-colors",
                    form.unit === u
                      ? "bg-accent text-white border-accent"
                      : "bg-surface border-border text-text-secondary hover:border-border-strong",
                  ].join(" ")}
                >{u}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">In stock ({form.unit})</span>
              <input
                type="number" min="0" step="0.1"
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.qty || ""} onChange={(e) => setNum("qty", e.target.value)}
                placeholder="0"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Scoop size ({form.unit})</span>
              <input
                type="number" min="0.01" step="0.01"
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.scoopSize || ""} onChange={(e) => setNum("scoopSize", e.target.value)}
                placeholder="0.5" required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Low-stock at ({form.unit})</span>
              <input
                type="number" min="0" step="0.1"
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.minQty || ""} onChange={(e) => setNum("minQty", e.target.value)}
                placeholder="0"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Target stock ({form.unit})</span>
              <input
                type="number" min="0" step="0.1"
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.maxQty || ""} onChange={(e) => setNum("maxQty", e.target.value)}
                placeholder="0"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover">
              {initial ? "Save Changes" : "Add Feed Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
