import { useEffect } from "react";
import "./LiveyConfirmModal.css";

type LiveyConfirmModalTone = "warning" | "danger";

type LiveyConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: LiveyConfirmModalTone;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function LiveyConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "warning",
  isProcessing = false,
  onConfirm,
  onCancel,
}: LiveyConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || isProcessing) {
        return;
      }

      onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) {
    return null;
  }

  function handleBackdropClick() {
    if (isProcessing) return;
    onCancel();
  }

  return (
    <div
      className="livey-confirm-modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <section
        className={`livey-confirm-modal livey-confirm-modal-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="livey-confirm-modal-title"
        aria-describedby="livey-confirm-modal-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className="livey-confirm-modal-icon"
          aria-hidden="true"
        >
          {tone === "danger" ? (
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
            >
              <path
                d="M5 7h14M9 7V4.8h6V7M8 10.5v6M12 10.5v6M16 10.5v6M6.5 7l.8 12h9.4l.8-12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="8.5"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <path
                d="M12 7.8v5.3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <circle
                cx="12"
                cy="16.4"
                r="1"
                fill="currentColor"
              />
            </svg>
          )}
        </div>

        <p className="livey-confirm-modal-eyebrow">
          Livey confirmation
        </p>

        <h2 id="livey-confirm-modal-title">
          {title}
        </h2>

        <p
          id="livey-confirm-modal-description"
          className="livey-confirm-modal-description"
        >
          {description}
        </p>

        <div className="livey-confirm-modal-actions">
          <button
            className="livey-confirm-modal-cancel"
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>

          <button
            className="livey-confirm-modal-confirm"
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing
              ? "Please wait..."
              : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}