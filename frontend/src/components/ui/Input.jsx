export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`min-h-10 w-full rounded-lg border border-line bg-field px-3 text-sm text-ink placeholder:text-muted focus:border-line focus:ring-0 ${className}`.trim()}
      {...props}
    />
  );
}
