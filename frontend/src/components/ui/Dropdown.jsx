import { useEffect, useRef, useState } from "react";

export default function Dropdown({
  trigger,
  label,
  children,
  className = "",
  align = "right",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      {trigger({
        open,
        triggerRef,
        onToggle: () => setOpen((current) => !current),
      })}
      {open && (
        <div
          className={`absolute top-[calc(100%+8px)] z-20 min-w-[220px] rounded-[var(--radius-md)] border border-line bg-paper p-2 text-ink shadow-[var(--shadow)] ${align === "left" ? "left-0" : "right-0"}`}
          role="menu"
          aria-label={label}
          onClick={(event) => {
            if (event.target.closest('[role="menuitem"]')) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
