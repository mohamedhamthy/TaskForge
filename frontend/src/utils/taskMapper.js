const statusMap = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "progress",
  REVIEW: "review",
  DONE: "done",
};

const colors = ["coral", "sky", "lilac", "mint"];

export function mapTask(
  task,
  {
    project,
    index,
    projectIndex = index,
    userId,
    includeTask = false,
    includeMine = false,
    dueDate = true,
  },
) {
  return {
    ...(includeTask ? task : {}),
    id: task._id,
    title: task.title,
    project,
    status: statusMap[task.status] || "backlog",
    priority: task.priority[0] + task.priority.slice(1).toLowerCase(),
    tag: task.labels?.[0] || "General",
    due:
      dueDate && task.dueDate
        ? new Date(`${String(task.dueDate).slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "No date",
    dueDate: task.dueDate || null,
    assignee:
      task.assignee?.name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2) || "—",
    ...(includeMine
      ? {
          isMine:
            task.assignee?._id === userId || task.createdBy?._id === userId,
        }
      : {}),
    color: colors[projectIndex % colors.length],
  };
}
