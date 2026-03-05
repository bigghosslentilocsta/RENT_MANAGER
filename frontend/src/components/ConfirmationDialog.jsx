import { AlertCircle, CheckCircle2, X } from "lucide-react";

const ConfirmationDialog = ({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl sm:rounded-3xl border border-white/60 bg-white/95 p-5 sm:p-7 shadow-lg backdrop-blur-xl">
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div
            className={`rounded-full p-3 ${
              isDangerous
                ? "bg-pending/10 text-pending"
                : "bg-ink/10 text-ink"
            }`}
          >
            {isDangerous ? (
              <AlertCircle size={24} />
            ) : (
              <CheckCircle2 size={24} />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-ink">{title}</h2>
            <p className="mt-2 text-sm text-muted">{message}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-full p-1.5 hover:bg-ink/5 transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
              isDangerous
                ? "bg-pending hover:bg-pending/90"
                : "bg-ink hover:bg-ink/90"
            }`}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border-2 border-transparent border-t-white animate-spin"
                  aria-hidden="true"
                />
                {confirmText}
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
