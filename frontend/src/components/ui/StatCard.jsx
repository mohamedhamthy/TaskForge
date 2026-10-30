import Card from "./Card";

export default function StatCard({
  icon,
  label,
  value,
  detail,
  iconClassName,
}) {
  return (
    <Card className="flex items-center gap-3 p-4 max-[420px]:gap-2 max-[420px]:p-3">
      <div
        className={`[width:35px] [height:35px] [border-radius:9px] grid place-items-center max-[420px]:[width:29px] max-[420px]:[height:29px] ${iconClassName}`}
      >
        {icon}
      </div>
      <div>
        <span className="block text-xs font-medium text-muted">{label}</span>
        <strong className="mt-1 block font-display text-2xl font-semibold leading-none text-ink max-[420px]:text-xl">
          {value}
        </strong>
        <small className="mt-1.5 block text-xs text-muted">{detail}</small>
      </div>
    </Card>
  );
}
