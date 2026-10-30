import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { dynamicStyles } from "../../tailwindStyles.js";

const views = ["Month", "Week", "Agenda"];
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function taskDate(task) {
  if (!task.dueDate) return null;
  const parsed = parseISO(String(task.dueDate).slice(0, 10));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function CalendarTask({ task, onOpen, canScheduleTasks }) {
  return (
    <button
      type="button"
      draggable={canScheduleTasks}
      onDragStart={(event) => {
        if (canScheduleTasks) {
          event.dataTransfer.setData("text/task-id", task.id);
          event.dataTransfer.effectAllowed = "move";
        }
      }}
      onClick={() => onOpen(task.id)}
      className="flex w-full items-center gap-1.5 overflow-hidden rounded-md border border-line bg-surface px-1.5 py-1 text-left text-xs text-ink shadow-[var(--shadow-card)] hover:border-coral focus-visible:outline-coral"
      title={`${task.title} · ${task.project}`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dynamicStyles.color[task.color]}`}
        aria-hidden="true"
      />
      <span className="truncate">{task.title}</span>
    </button>
  );
}

function DayCell({
  date,
  tasks,
  onOpenTask,
  onScheduleTask,
  canScheduleTasks,
  muted = false,
  compact = false,
}) {
  const dayTasks = tasks.filter((task) => {
    const due = taskDate(task);
    return due && isSameDay(due, date);
  });
  const today = isToday(date);
  const dropTask = (event) => {
    event.preventDefault();
    if (!canScheduleTasks) return;
    const taskId = event.dataTransfer.getData("text/task-id");
    if (taskId) onScheduleTask(taskId, format(date, "yyyy-MM-dd"));
  };

  return (
    <div
      className={`min-h-[112px] min-w-0 border-b border-r border-line p-2 ${compact ? "min-h-24" : ""} ${muted ? "bg-canvas/60 text-muted" : "bg-paper"} ${today ? "bg-coral/5" : ""}`}
      role="gridcell"
      tabIndex={0}
      aria-label={format(date, "EEEE, MMMM d")}
      onDragOver={(event) => {
        if (canScheduleTasks) event.preventDefault();
      }}
      onDrop={dropTask}
    >
      <div
        className={`mb-1.5 inline-grid h-7 min-w-7 place-items-center rounded-full px-1 text-xs ${today ? "bg-coral font-bold text-white" : "text-muted"}`}
      >
        {format(date, "d")}
      </div>
      <div className="grid gap-1">
        {dayTasks.slice(0, 3).map((task) => (
          <CalendarTask
            key={task.id}
            task={task}
            onOpen={onOpenTask}
            canScheduleTasks={canScheduleTasks}
          />
        ))}
        {dayTasks.length > 3 && (
          <span className="px-1 text-xs text-muted">
            +{dayTasks.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}

export default function TaskCalendar({
  tasks,
  onOpenTask,
  onScheduleTask,
  onCreateTask,
  canScheduleTasks,
  error,
}) {
  const [view, setView] = useState("Month");
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const scheduledTasks = useMemo(
    () => tasks.filter((task) => taskDate(task)),
    [tasks],
  );
  const unscheduledTasks = useMemo(
    () => tasks.filter((task) => !taskDate(task)),
    [tasks],
  );
  const days = useMemo(() => {
    const start =
      view === "Week"
        ? startOfWeek(date, { weekStartsOn: 1 })
        : startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const end =
      view === "Week"
        ? endOfWeek(date, { weekStartsOn: 1 })
        : endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [date, view]);
  const agendaTasks = useMemo(
    () =>
      [...scheduledTasks].sort(
        (a, b) => taskDate(a).getTime() - taskDate(b).getTime(),
      ),
    [scheduledTasks],
  );
  const dateLabel =
    view === "Week"
      ? `${format(days[0], "MMM d")} – ${format(days.at(-1), "MMM d, yyyy")}`
      : format(date, "MMMM yyyy");
  const shiftDate = (direction) => {
    setDate((current) =>
      view === "Week"
        ? addWeeks(current, direction)
        : addMonths(current, direction),
    );
  };

  return (
    <section className="grid gap-5" aria-label="Task calendar">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-coral">
            SCHEDULE
          </p>
          <h1 className="m-0 font-display text-2xl font-semibold tracking-tight text-ink">
            Task calendar
          </h1>
          <p className="mt-2 text-sm text-muted">
            {canScheduleTasks
              ? "Plan work by date. Drag an unscheduled task onto the calendar."
              : "Review scheduled work and ask an owner or admin to change due dates."}
          </p>
        </div>
        <button
          type="button"
          className="rounded-[var(--radius-sm)] bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          onClick={onCreateTask}
        >
          Add task
        </button>
      </div>

      {error && (
        <p
          className="rounded-[var(--radius-sm)] border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-ink"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous period"
                className="grid h-9 w-9 place-items-center rounded-md border border-line bg-field text-ink hover:border-coral"
                onClick={() => shiftDate(-1)}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                className="rounded-md border border-line bg-field px-3 py-2 text-xs font-semibold text-ink hover:border-coral"
                onClick={() => setDate(startOfDay(new Date()))}
              >
                Today
              </button>
              <button
                type="button"
                aria-label="Next period"
                className="grid h-9 w-9 place-items-center rounded-md border border-line bg-field text-ink hover:border-coral"
                onClick={() => shiftDate(1)}
              >
                <ArrowRight size={16} />
              </button>
              <h2 className="ml-1 text-sm font-semibold text-ink sm:text-base">
                {dateLabel}
              </h2>
            </div>
            <div
              className="flex rounded-lg border border-line bg-canvas p-1"
              role="group"
              aria-label="Calendar view"
            >
              {views.map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={view === item}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${view === item ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"}`}
                  onClick={() => setView(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {view === "Agenda" ? (
            <div className="grid gap-2 p-3 sm:p-4" aria-label="Agenda tasks">
              {agendaTasks.length ? (
                agendaTasks.map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left hover:border-coral"
                    onClick={() => onOpenTask(task.id)}
                  >
                    <CalendarDays size={17} className="shrink-0 text-coral" />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm text-ink">
                        {task.title}
                      </strong>
                      <span className="text-xs text-muted">
                        {task.project}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-ink">
                      {format(taskDate(task), "EEE, MMM d")}
                    </span>
                  </button>
                ))
              ) : (
                <div className="grid min-h-44 place-items-center text-center">
                  <div>
                    <CalendarDays className="mx-auto mb-2 text-muted" size={24} />
                    <p className="text-sm font-semibold text-ink">
                      Nothing scheduled yet
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Drag a task onto a date to add it to your agenda.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[720px] grid-cols-7 border-l border-line"
                role="grid"
                aria-label={`${view} calendar`}
              >
                {weekdays.map((day) => (
                  <div
                    className="border-b border-r border-line bg-canvas px-2 py-2 text-xs font-semibold text-muted"
                    key={day}
                    role="columnheader"
                  >
                    {day}
                  </div>
                ))}
                {days.map((day) => (
                  <DayCell
                    key={day.toISOString()}
                    date={day}
                    tasks={tasks}
                    onOpenTask={onOpenTask}
                    onScheduleTask={onScheduleTask}
                    muted={view === "Month" && !isSameMonth(day, date)}
                    compact={view === "Week"}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-[var(--radius-md)] border border-line bg-paper p-4 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Unscheduled</h2>
              <p className="mt-1 text-xs text-muted">
                {canScheduleTasks
                  ? "Drag a task to pick a due date."
                  : "Due dates can be changed by an owner or admin."}
              </p>
            </div>
            <span className="rounded-full bg-canvas px-2 py-1 text-xs font-semibold text-muted">
              {unscheduledTasks.length}
            </span>
          </div>
          <div className="grid gap-2">
            {unscheduledTasks.length ? (
              unscheduledTasks.map((task) => (
                <button
                  type="button"
                  draggable={canScheduleTasks}
                  key={task.id}
                  onDragStart={(event) => {
                    if (canScheduleTasks) {
                      event.dataTransfer.setData("text/task-id", task.id);
                      event.dataTransfer.effectAllowed = "move";
                    }
                  }}
                  onClick={() => onOpenTask(task.id)}
                  className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3 text-left text-ink hover:border-coral"
                >
                  <Clock3 size={15} className="mt-0.5 shrink-0 text-muted" />
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">
                      {task.title}
                    </strong>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {task.project}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">
                All tasks have a date.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
