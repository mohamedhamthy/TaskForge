import { useId } from "react";

export default function Tooltip({ label, children }) {
  const tooltipId = useId();
  return (
    <span className="group relative inline-flex">
      <span
        className="inline-flex"
        aria-describedby={tooltipId}
        tabIndex={0}
      >
        {children}
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 w-max max-w-56 -translate-x-1/2 rounded-md bg-navy px-2.5 py-1.5 text-xs text-white opacity-0 shadow-[var(--shadow-card)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
