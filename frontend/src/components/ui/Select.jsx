import { ChevronDown } from "lucide-react";

export default function Select({ className = "", children, ...props }) {
  return (
    <span className="relative inline-flex">
      <select
        className={`min-h-10 appearance-none rounded-lg border border-line bg-field py-2 pl-3 pr-9 text-sm text-ink shadow-[var(--shadow-card)] hover:border-coral focus-visible:outline-coral ${className}`.trim()}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        size={14}
      />
    </span>
  );
}
