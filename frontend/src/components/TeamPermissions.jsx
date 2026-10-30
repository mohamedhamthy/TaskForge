import { ChevronDown } from "lucide-react";
import Avatar from "./ui/Avatar";
import RoleSelect from "./ui/RoleSelect";

export default function TeamPermissions({
  teamMembers,
  userId,
  isOwner,
  formatRole,
  onChangeMemberRole,
}) {
  return (
    <section className="mb-5 rounded-[var(--radius-md)] border border-line bg-paper shadow-[var(--shadow-card)] [[data-view=calendar]_&]:hidden">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-coral">
              {isOwner ? "OWNER ACCESS" : "ADMIN ACCESS"}
            </span>
            <span className="block text-base font-semibold text-ink">
              Team permissions
            </span>
            <span className="mt-1 block text-sm text-muted">
              Manage members, Team Leads, assignments, and project access.
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink">
              {teamMembers.length} people
            </span>
            <ChevronDown size={16} className="text-muted" aria-hidden="true" />
          </span>
        </summary>
        <div className="grid grid-cols-1 gap-2 border-t border-line p-4 md:grid-cols-2 xl:grid-cols-3">
          {teamMembers.map((member) => {
            const memberUserId = member.user?._id || member.user;
            const role = member.role || member.user?.role || "MEMBER";
            return (
              <div
                className="flex min-w-0 items-center gap-3 rounded-lg border border-line bg-surface p-3"
                key={memberUserId}
              >
                <Avatar as="div" name={member.user?.name || "?"} />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-ink">
                    {member.user?.name || "Team member"}
                  </strong>
                  <small className="mt-0.5 block truncate text-xs text-muted">
                    {member.user?.email || ""}
                  </small>
                </div>
                <RoleSelect
                  label={`Role for ${member.user?.name || "member"}`}
                  value={role}
                  formatRole={formatRole}
                  disabled={memberUserId === userId}
                  onChange={(nextRole) =>
                    onChangeMemberRole(memberUserId, nextRole)
                  }
                />
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
