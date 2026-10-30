import { ChevronDown } from "lucide-react";
import Dropdown from "./Dropdown";

const roles = [
  { value: "ADMIN", label: "Admin", color: "var(--role-admin, #8b6bd6)" },
  { value: "TEAM_LEAD", label: "Team Lead", color: "var(--role-lead, #3985a8)" },
  { value: "MEMBER", label: "Member", color: "var(--role-member, #4d9a74)" },
];

export function RoleBadge({ role, formatRole }) {
  const selectedRole = roles.find((item) => item.value === role);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-ink">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: selectedRole?.color || "var(--coral)" }}
        aria-hidden="true"
      />
      {formatRole ? formatRole(role) : selectedRole?.label || "Member"}
    </span>
  );
}

export default function RoleSelect({
  value,
  onChange,
  formatRole,
  label,
  disabled = false,
}) {
  const selectedRole = roles.find((item) => item.value === value);
  const selectedLabel = formatRole
    ? formatRole(value)
    : selectedRole?.label || "Member";

  if (disabled)
    return (
      <span className="min-w-[118px]">
        <RoleBadge role={value} formatRole={formatRole} />
      </span>
    );

  return (
    <Dropdown
      label={label}
      className="shrink-0"
      trigger={({ open, onToggle, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          className="flex min-h-9 min-w-[124px] items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-line bg-field px-2.5 text-left text-xs font-semibold text-ink hover:border-coral"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={onToggle}
        >
          <RoleBadge role={value} formatRole={formatRole} />
          <ChevronDown size={14} className="shrink-0 text-muted" />
        </button>
      )}
    >
      {roles.map((role) => (
        <button
          className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas focus-visible:outline-coral"
          key={role.value}
          type="button"
          role="menuitem"
          aria-current={value === role.value ? "true" : undefined}
          onClick={() => onChange(role.value)}
        >
          <RoleBadge role={role.value} formatRole={formatRole} />
          {value === role.value && (
            <span className="ml-auto text-xs text-muted">Current</span>
          )}
        </button>
      ))}
      <span className="sr-only">Selected role: {selectedLabel}</span>
    </Dropdown>
  );
}
