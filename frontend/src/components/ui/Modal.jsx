import Button from "./Button.jsx";

export function ModalHeader({ label, title, onClose }) {
  return (
    <div className="modal-header">
      <div>
        <p className="modal-eyebrow">{label}</p>
        <h2>{title}</h2>
      </div>
      <button
        type="button"
        className="modal-close"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}

export default function Modal({
  eyebrow,
  title,
  description,
  submitLabel,
  onClose,
  onSubmit,
  onCancel = onClose,
  submitting = false,
  children,
}) {
  return (
    <div
      className="modal-backdrop dark:[background:rgba(5,_7,_10,_0.74)]"
      role="presentation"
    >
      <form
        className="modal-form dark:text-ink dark:border-line dark:bg-paper"
        onSubmit={onSubmit}
      >
        <ModalHeader label={eyebrow} title={title} onClose={onClose} />
        {description}
        {children}
        <div className="flex [justify-content:end] gap-2 [margin-top:5px]">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={submitting}>{submitLabel}</Button>
        </div>
      </form>
    </div>
  );
}
