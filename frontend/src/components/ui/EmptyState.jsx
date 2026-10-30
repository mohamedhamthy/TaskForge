export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  note,
}) {
  return (
    <div className="grid min-h-60 place-items-center rounded-xl border border-dashed border-line bg-paper p-6 text-center">
      <div className="max-w-sm">
        {Icon && (
          <Icon
            className="mx-auto mb-3 text-muted"
            size={28}
            aria-hidden="true"
          />
        )}
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">{description}</p>
        {action}
        {note && (
          <p className="mt-3 text-xs font-medium text-muted">{note}</p>
        )}
      </div>
    </div>
  );
}
