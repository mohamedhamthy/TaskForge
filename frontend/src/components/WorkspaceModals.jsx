import FormField from "./ui/FormField";
import Modal from "./ui/Modal";

const updateField = (setForm, form, field) => (event) =>
  setForm({ ...form, [field]: event.target.value });

export function CreateTaskModal({
  onClose,
  onSubmit,
  saving,
  taskForm,
  setTaskForm,
  projects,
  teamMembers,
}) {
  return (
    <Modal
      eyebrow="WORK ITEM"
      title="Assign a task"
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={saving}
      submitLabel={saving ? "Assigning..." : "Assign task"}
    >
      <FormField label="Task title">
        <input
          autoFocus
          required
          minLength="2"
          value={taskForm.title}
          onChange={updateField(setTaskForm, taskForm, "title")}
          placeholder="What needs to be done?"
        />
      </FormField>
      <FormField label="Description">
        <textarea
          value={taskForm.description}
          onChange={updateField(setTaskForm, taskForm, "description")}
          placeholder="Add context for the assignee..."
          rows="3"
        />
      </FormField>
      <FormField label="Project">
        <select
          required
          value={taskForm.projectId}
          onChange={updateField(setTaskForm, taskForm, "projectId")}
        >
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Assignee">
        <select
          value={taskForm.assignee}
          onChange={updateField(setTaskForm, taskForm, "assignee")}
        >
          <option value="">Unassigned</option>
          {teamMembers
            .filter((member) => member.role !== "OWNER")
            .map((member) => (
              <option
                key={member.user?._id || member.user}
                value={member.user?._id || member.user}
              >
                {member.user?.name || "Team member"} ({member.role})
              </option>
            ))}
        </select>
      </FormField>
      <FormField label="Priority">
        <select
          value={taskForm.priority}
          onChange={updateField(setTaskForm, taskForm, "priority")}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </FormField>
    </Modal>
  );
}

export function CreateAdminModal({
  onClose,
  onSubmit,
  saving,
  adminForm,
  setAdminForm,
}) {
  return (
    <Modal
      eyebrow="OWNER ACTION"
      title="Create admin"
      description={
        <p className="[margin:-4px_0_2px] text-muted [font-size:11px] [line-height:1.5]">
          Create a login account and add it as an administrator for this team.
        </p>
      }
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={saving}
      submitLabel={saving ? "Creating..." : "Create admin"}
    >
      <FormField label="Full name">
        <input
          autoFocus
          required
          minLength="2"
          value={adminForm.name}
          onChange={updateField(setAdminForm, adminForm, "name")}
          placeholder="Jordan Smith"
        />
      </FormField>
      <FormField label="Email">
        <input
          required
          type="email"
          value={adminForm.email}
          onChange={updateField(setAdminForm, adminForm, "email")}
          placeholder="admin@company.com"
        />
      </FormField>
      <FormField label="Password">
        <input
          required
          minLength="8"
          type="password"
          value={adminForm.password}
          onChange={updateField(setAdminForm, adminForm, "password")}
          placeholder="At least 8 characters"
        />
      </FormField>
    </Modal>
  );
}

export function CreateMemberModal({
  onClose,
  onSubmit,
  saving,
  memberForm,
  setMemberForm,
}) {
  return (
    <Modal
      eyebrow="ADMIN ACTION"
      title={
        <>
          Create{" "}
          {memberForm.role === "TEAM_LEAD" ? "team lead" : "member"}
        </>
      }
      description={
        <p className="[margin:-4px_0_2px] text-muted [font-size:11px] [line-height:1.5]">
          Create login credentials and add this person to the team.
        </p>
      }
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={saving}
      submitLabel={saving ? "Creating..." : "Create account"}
    >
      <FormField label="Full name">
        <input
          autoFocus
          required
          minLength="2"
          value={memberForm.name}
          onChange={updateField(setMemberForm, memberForm, "name")}
          placeholder="Taylor Morgan"
        />
      </FormField>
      <FormField label="Email">
        <input
          required
          type="email"
          value={memberForm.email}
          onChange={updateField(setMemberForm, memberForm, "email")}
          placeholder="member@company.com"
        />
      </FormField>
      <FormField label="Password">
        <input
          required
          minLength="8"
          type="password"
          value={memberForm.password}
          onChange={updateField(setMemberForm, memberForm, "password")}
          placeholder="At least 8 characters"
        />
      </FormField>
      <FormField label="Role">
        <select
          value={memberForm.role}
          onChange={updateField(setMemberForm, memberForm, "role")}
        >
          <option value="MEMBER">Member</option>
          <option value="TEAM_LEAD">Team Lead</option>
        </select>
      </FormField>
    </Modal>
  );
}

export function InviteToProjectModal({
  onClose,
  onSubmit,
  saving,
  taskForm,
  setTaskForm,
  projects,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
}) {
  return (
    <Modal
      eyebrow="PROJECT ACCESS"
      title="Assign project access"
      description={
        <p className="[margin:-4px_0_2px] text-muted [font-size:11px] [line-height:1.5]">
          Invite an existing team member or assign a team lead to this project.
        </p>
      }
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={saving}
      submitLabel={saving ? "Saving..." : "Save project access"}
    >
      <FormField label="Project">
        <select
          required
          value={taskForm.projectId}
          onChange={updateField(setTaskForm, taskForm, "projectId")}
        >
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Member email">
        <input
          autoFocus
          required
          type="email"
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
          placeholder="member@company.com"
        />
      </FormField>
      <FormField label="Project role">
        <select
          value={inviteRole}
          onChange={(event) => setInviteRole(event.target.value)}
        >
          <option value="MEMBER">Member</option>
          <option value="TEAM_LEAD">Team Lead</option>
        </select>
      </FormField>
    </Modal>
  );
}

export function CreateProjectModal({
  onClose,
  onSubmit,
  saving,
  projectForm,
  setProjectForm,
}) {
  return (
    <Modal
      eyebrow="OWNER ACTION"
      title="Create project"
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={saving}
      submitLabel={saving ? "Creating..." : "Create project"}
    >
      <FormField label="Project name">
        <input
          autoFocus
          required
          minLength="2"
          value={projectForm.name}
          onChange={updateField(setProjectForm, projectForm, "name")}
          placeholder="Website redesign"
        />
      </FormField>
      <FormField label="Description">
        <textarea
          value={projectForm.description}
          onChange={updateField(setProjectForm, projectForm, "description")}
          placeholder="What is this project about?"
          rows="3"
        />
      </FormField>
    </Modal>
  );
}
