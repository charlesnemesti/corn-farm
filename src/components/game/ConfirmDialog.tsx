"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary";
  confirmTutorialId?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Centered confirmation modal for destructive actions.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "danger",
  confirmTutorialId,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClassName =
    confirmTone === "primary"
      ? "rounded-lg border border-farm-sun/40 bg-farm-sun/20 px-3 py-1.5 text-xs font-semibold text-farm-sun transition hover:bg-farm-sun/30"
      : "rounded-lg border border-red-500/40 bg-red-950/80 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-900";

  return (
    <div className="pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-sm rounded-xl border border-white/15 bg-black/95 p-4 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title" className="text-sm font-bold text-farm-sun">
          {title}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-white/70">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          {cancelLabel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            data-tutorial={confirmTutorialId}
            className={confirmClassName}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
