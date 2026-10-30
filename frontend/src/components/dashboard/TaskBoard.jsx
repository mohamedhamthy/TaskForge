import { CalendarDays, ClipboardList, Plus } from "lucide-react";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import { dynamicStyles } from "../../tailwindStyles.js";

export function TaskCard({ task, onOpen, onMove }) {
  return (
    <article
      className="relative cursor-grab rounded-[var(--radius-sm)] border border-line bg-paper p-3 text-ink shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)] active:cursor-grabbing"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/task-id", task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpen(task.id)}
    >
      <div className="flex items-center justify-between">
        <Badge
          className={`rounded-md uppercase tracking-wide ${dynamicStyles.priority[task.priority.toLowerCase()]}`}
        >
          {task.priority}
        </Badge>
      </div>
      <h4 className="my-2.5 text-sm font-semibold leading-snug">{task.title}</h4>
      <p className="flex items-center gap-1.5 truncate text-xs text-muted">
        <span
          className={`inline-block [width:8px] [height:8px] [border-radius:3px] shrink-0 ${dynamicStyles.color[task.color]}`}
        ></span>
        {task.project}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded border border-line px-1.5 py-1 text-xs text-muted">
          {task.tag}
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted">
          <CalendarDays size={14} aria-hidden="true" />
          {task.due}
        </span>
        <Avatar
          name={task.assignee}
          color={task.color}
          className="ring-2 ring-paper"
          aria-label={`Assignee ${task.assignee}`}
        />
      </div>
      <select
        className="sr-only focus:not-sr-only focus:absolute focus:right-2 focus:top-2 focus:z-10 focus:max-w-32 focus:rounded-md focus:border focus:border-line focus:bg-paper focus:p-1 focus:text-xs focus:text-ink"
        value={task.status}
        aria-label={`Move ${task.title} to another column`}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onMove(task.id, event.target.value)}
      >
        {["backlog", "todo", "progress", "review", "done"].map((status) => (
          <option value={status} key={status}>
            {status === "todo"
              ? "To do"
              : status === "progress"
                ? "In progress"
                : status[0].toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>
    </article>
  );
}

export default function TaskBoard({
  columns,
  tasks,
  onOpenTask,
  onMoveTask,
  onAddTask,
  hasProjects = true,
  isOwner = false,
  onCreateProject,
  totalTaskCount = tasks.length,
}) {
  return (
    <section
      className="grid w-full gap-3 overflow-x-auto pb-1 [grid-template-columns:repeat(5,_minmax(170px,_1fr))] [scrollbar-width:thin] max-[760px]:[grid-template-columns:repeat(5,_minmax(160px,_1fr))] [[data-view=calendar]_&]:[display:none]"
      aria-label="Task board"
    >
      {!tasks.length ? (
        <div className="col-span-full">
          <EmptyState
            icon={ClipboardList}
            title={
              totalTaskCount
                ? "No tasks match your view"
                : hasProjects
                  ? "Nothing to work on yet"
                  : "No projects yet"
            }
            description={
              totalTaskCount
                ? "Try a different search or priority filter."
                : hasProjects
                  ? "Tasks will show up here when your team adds work."
                  : "Create a project to give your team a place to organize tasks."
            }
            action={!totalTaskCount && hasProjects ? (
              <button
                type="button"
                className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                onClick={onAddTask}
              >
                Add your first task
              </button>
            ) : !totalTaskCount && isOwner ? (
              <button
                type="button"
                className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                onClick={onCreateProject}
              >
                Create a project
              </button>
            ) : null}
            note={!totalTaskCount && !hasProjects && !isOwner
              ? "Ask your workspace owner to create a project."
              : undefined}
          />
        </div>
      ) : (
        columns.map((column) => (
        <div
          className="min-h-[290px] rounded-lg p-2 transition-colors hover:bg-paper/50"
          key={column.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const taskId = event.dataTransfer.getData("text/task-id");
            if (taskId) onMoveTask(taskId, column.id);
          }}
        >
          <div className="mb-3 flex items-center justify-between [&_>_div]:flex [&_>_div]:items-center [&_>_div]:gap-2 [&_h3]:m-0 [&_h3]:text-sm [&_h3]:font-semibold">
            <div>
              <span className={` ${dynamicStyles.tone[column.tone]}`}></span>
              <h3>{column.label}</h3>
              <span className="[color:#aaa8a6] [font-size:10px]">
                {tasks.filter((task) => task.status === column.id).length}
              </span>
            </div>
            <button
              className="relative grid place-items-center border-0 [background:transparent] [color:#9b999b]"
              aria-label={`Add task to ${column.label}`}
              onClick={onAddTask}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-col [gap:9px]">
            {tasks
              .filter((task) => task.status === column.id)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpen={onOpenTask}
                  onMove={onMoveTask}
                />
              ))}
          </div>
          {column.id === "backlog" && (
            <button
              className="flex items-center [gap:5px] [margin-top:9px] border-0 [background:transparent] [color:#aaa8a6] [font-size:10px] [padding:4px]"
              onClick={onAddTask}
            >
              <Plus size={16} /> Add task
            </button>
          )}
        </div>
        ))
      )}
    </section>
  );
}
