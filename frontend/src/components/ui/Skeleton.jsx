export default function Skeleton({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-line/70 ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
