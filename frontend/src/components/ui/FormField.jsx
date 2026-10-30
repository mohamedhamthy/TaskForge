export default function FormField({ label, htmlFor, children, className = "" }) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {label}{" "}
      {children}
    </label>
  );
}
