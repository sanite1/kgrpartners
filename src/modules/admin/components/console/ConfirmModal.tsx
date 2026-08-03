import type { ReactNode } from "react";
import Modal from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// One confirmation gate for every irreversible action: nothing in the
// console is deleted by a single tap.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Yes, remove",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal title={title} open={open} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="m-0 text-[14px] font-medium leading-[1.6] text-bark">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 cursor-pointer rounded-[10px] border-none bg-red-600 px-6 py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
          >
            {loading ? "Removing…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-[10px] border border-line bg-white px-6 py-3 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
