import { Check, Clock3, ListTodo, Users } from "lucide-react";
import StatCard from "../ui/StatCard";

export default function SummaryCards({
  visibleTaskCount,
  completedCount,
  projectCount,
  firstName,
  role,
}) {
  return (
    <section
      className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 [[data-view=calendar]_&]:hidden"
      aria-label="Workspace summary"
    >
      <StatCard
        icon={<ListTodo size={18} />}
        label="Total tasks"
        value={visibleTaskCount}
        detail="Live from MongoDB"
        iconClassName="bg-coral/10 text-coral"
      />
      <StatCard
        icon={<Check size={18} />}
        label="Completed"
        value={completedCount}
        detail="Current workspace"
        iconClassName="bg-[var(--success-bg)] text-[var(--success-ink)]"
      />
      <StatCard
        icon={<Clock3 size={18} />}
        label="Projects"
        value={projectCount}
        detail="Your workspace"
        iconClassName="bg-[var(--priority-high-bg)] text-[var(--priority-high-ink)]"
      />
      <StatCard
        icon={<Users size={18} />}
        label="Signed in as"
        value={firstName}
        detail={role}
        iconClassName="bg-canvas text-[var(--role-lead)]"
      />
    </section>
  );
}
