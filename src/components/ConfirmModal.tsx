type Props = {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({ message, confirmLabel = "Confirm", onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-surface-raised rounded-card border border-border w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5">
          <p className="text-sm text-text-primary">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-btn border border-border text-sm text-text-secondary hover:border-border-strong transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-btn bg-danger text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
