import { useState } from "react";
import type { Contact } from "../types";

type FormData = Omit<Contact, "id">;

type Props = {
  initial?: Contact;
  onSave: (data: FormData) => void;
  onClose: () => void;
};

const BLANK: FormData = { name: "", role: "", phone: "", email: "", notes: "" };

export default function ContactForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormData>(
    initial
      ? { name: initial.name, role: initial.role, phone: initial.phone, email: initial.email, notes: initial.notes }
      : BLANK
  );

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-raised rounded-card border border-border w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            {initial ? "Edit Contact" : "Add Contact"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Name</span>
              <input
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Dr. Smith" required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Role</span>
              <input
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.role} onChange={e => set("role", e.target.value)} placeholder="e.g. Vet, Owner"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Phone</span>
              <input
                type="tel"
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="e.g. 555-0100"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Email</span>
              <input
                type="email"
                className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent"
                value={form.email} onChange={e => set("email", e.target.value)} placeholder="e.g. vet@clinic.com"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Notes</span>
            <textarea
              rows={3}
              className="border border-border rounded-btn px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:border-accent resize-none"
              value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Hours, emergency instructions..."
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-3 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover">
              {initial ? "Save Changes" : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
