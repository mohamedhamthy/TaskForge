export default function Card({
  as: Element = "div",
  className = "",
  ...props
}) {
  return (
    <Element
      className={`rounded-[var(--radius-md)] border border-line bg-paper shadow-[var(--shadow-card)] ${className}`.trim()}
      {...props}
    />
  );
}
