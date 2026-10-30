export default function Badge({ className = "", children, ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
