import { useState } from "react";
import type { Contact } from "../types";
import ContactForm from "./ContactForm";
import ConfirmModal from "./ConfirmModal";

type Props = {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
};

function newId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(15)))
    .map(b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
    .join("");
}

export default function ContactList({ contacts, setContacts }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  function handleSave(data: Omit<Contact, "id">) {
    if (editing) {
      setContacts(contacts.map(c => c.id === editing.id ? { ...data, id: editing.id } : c));
      setEditing(null);
    } else {
      setContacts([...contacts, { ...data, id: newId() }]);
    }
  }

  function handleDelete(contact: Contact) {
    setContacts(contacts.filter(c => c.id !== contact.id));
    setDeleting(null);
  }

  const sorted = [...contacts].sort((a, b) => {
    const roleCmp = (a.role || "").localeCompare(b.role || "");
    return roleCmp !== 0 ? roleCmp : a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Contacts</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-btn bg-accent text-white text-sm font-medium hover:bg-accent-hover"
        >
          <span>+</span>
          <span>Add Contact</span>
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          No contacts yet — add your vet, owner, or manager.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(contact => (
            <div key={contact.id} className="bg-surface-raised rounded-card border border-border px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-text-primary text-sm">{contact.name}</span>
                  {contact.role && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-text-secondary">
                      {contact.role}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {contact.email}
                    </a>
                  )}
                  {contact.notes && (
                    <p className="text-xs text-text-muted mt-1">{contact.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setEditing(contact); setShowForm(true); }}
                  className="text-xs px-3 py-1.5 rounded-btn border border-border text-text-secondary hover:border-border-strong"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleting(contact)}
                  className="text-xs px-3 py-1.5 rounded-btn border border-border text-text-secondary hover:border-danger hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ContactForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <ConfirmModal
          message={`Delete ${deleting.name}?`}
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
