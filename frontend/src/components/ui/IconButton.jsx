export default function IconButton({
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-grid place-items-center rounded-lg border border-line bg-field text-ink hover:border-coral focus-visible:outline-coral disabled:cursor-not-allowed disabled:opacity-55 ${className}`.trim()}
      {...props}
    />
  );
}
