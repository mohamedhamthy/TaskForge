import { AlertCircle, CheckCircle2, X } from "lucide-react";

export default function Toast({ type = "success", message, onDismiss }) {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex max-w-[min(92vw,420px)] items-start gap-3 rounded-xl border border-line bg-paper p-4 text-ink shadow-[var(--shadow)]"
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <Icon
        className={isError ? "mt-0.5 shrink-0 text-coral" : "mt-0.5 shrink-0 text-emerald-600"}
        size={18}
        aria-hidden="true"
      />
      <p className="text-sm">{message}</p>
      <button
        type="button"
        className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-canvas hover:text-ink"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <X size={15} />
      </button>
    </div>
  );
}
