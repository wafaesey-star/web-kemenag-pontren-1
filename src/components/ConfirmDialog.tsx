import { useEffect, useRef, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  destructive?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Batal',
  requireReason = false,
  reasonLabel = 'Catatan Revisi',
  reasonPlaceholder = 'Tuliskan bagian yang perlu diperbaiki operator...',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setReason('');
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    if (dialogRef.current) {
      dialogRef.current.returnValue = '';
    }
    onCancel();
  };

  const handleSubmit = async () => {
    if (requireReason && !reason.trim()) return;
    setBusy(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      className="m-auto w-full max-w-md rounded-xl border border-slate-900/10 bg-white p-6 text-[#111815] shadow-lg"
    >
      <h2 id="confirm-dialog-title" className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[#4B5751] leading-relaxed">{description}</p>

      {requireReason && (
        <div className="mt-4">
          <label htmlFor="confirm-reason-input" className="block text-xs font-medium text-[#111815] mb-1.5">
            {reasonLabel} <span className="text-[#B91C1C]">*</span>
          </label>
          <textarea
            id="confirm-reason-input"
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            className="field-input w-full rounded-lg border border-slate-900/15 bg-white px-3 py-2 text-sm text-[#111815] focus:border-[#0F5132] focus:outline-none"
          />
          <p className="field-error mt-1 text-xs text-[#B91C1C]">Catatan revisi wajib diisi.</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          autoFocus
          disabled={busy}
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-[#111815] bg-[#F1F5F3] hover:bg-slate-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={busy || (requireReason && !reason.trim())}
          onClick={handleSubmit}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 ${
            destructive
              ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
              : 'bg-[#0F5132] hover:bg-[#0B3D26]'
          }`}
        >
          {busy ? 'Memproses...' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
