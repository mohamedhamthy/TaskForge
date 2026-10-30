const variants = {
  primary:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55",
  secondary:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-field px-4 text-sm font-semibold text-ink hover:border-coral disabled:cursor-not-allowed disabled:opacity-55",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      className={`${variants[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
