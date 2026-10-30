import {
  Plus,
  Settings2,
  Sparkles,
} from "lucide-react";
import { dynamicStyles } from "../tailwindStyles.js";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

const navigationClass =
  "w-full flex items-center gap-3 rounded-lg border-0 px-3 py-2.5 text-left text-sm text-muted transition-colors hover:bg-canvas hover:text-ink [&_em]:ml-auto [&_em]:rounded-full [&_em]:bg-canvas [&_em]:px-2 [&_em]:py-0.5 [&_em]:text-xs [&_em]:not-italic";

const projectColors = ["coral", "sky", "lilac", "mint"];

export default function Sidebar({
  teams,
  activeTeam,
  isOwner,
  canCreateWorkspace,
  visibleNavItems,
  activeNav,
  tasks,
  projects,
  settingsOpen,
  onSelectWorkspace,
  onWorkspaceCreated,
  onChangeNav,
  onCreateProject,
  onOpenSettings,
  mobileNavOpen,
  onCloseMobile,
}) {
  return (
    <>
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-20 hidden bg-black/40 max-[760px]:block"
          onClick={onCloseMobile}
        />
      )}
      <aside className={`z-30 flex w-[246px] shrink-0 flex-col border-r border-line bg-paper px-4 py-6 transition-transform max-[1050px]:w-[210px] max-[760px]:fixed max-[760px]:inset-y-0 max-[760px]:left-0 max-[760px]:w-[260px] max-[760px]:max-w-[85vw] max-[760px]:overflow-y-auto max-[760px]:shadow-[var(--shadow)] ${mobileNavOpen ? "max-[760px]:translate-x-0" : "max-[760px]:-translate-x-full"}`}>
      <div className="mb-7 flex items-center gap-2.5 px-2 font-display text-xl font-bold tracking-tight text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-coral text-white">
          <Sparkles size={16} />
        </span>
        <span>taskforge</span>
      </div>
      <WorkspaceSwitcher
        teams={teams}
        activeTeam={activeTeam}
        isOwner={canCreateWorkspace}
        onSelect={onSelectWorkspace}
        onCreated={onWorkspaceCreated}
      />
      <nav aria-label="Primary navigation">
        <span className="flex items-center justify-between px-3 pb-2 text-xs font-bold uppercase tracking-wider text-muted">
          Workspace
        </span>
        {visibleNavItems.map(({ label, icon: Icon, count }) => (
          <button
            className={`${navigationClass} ${activeNav === label ? "bg-coral/10 font-semibold text-ink" : ""}`}
            key={label}
            aria-current={activeNav === label ? "page" : undefined}
            onClick={() => {
              onChangeNav(label);
              onCloseMobile();
            }}
          >
            <Icon size={17} />
            <span>{label}</span>
            {count && (
              <em>
                {label === "My tasks"
                  ? tasks.filter((task) => task.isMine).length
                  : count}
              </em>
            )}
          </button>
        ))}
        <span className="mt-6 flex items-center justify-between px-3 pb-2 text-xs font-bold uppercase tracking-wider text-muted">
          Projects{" "}
          {isOwner && (
            <button
              className="relative grid place-items-center border-0 [background:transparent] [color:#9b999b] [width:auto] [padding:0]"
              aria-label="Create project"
              onClick={onCreateProject}
            >
              <Plus size={14} />
            </button>
          )}
        </span>
        {(projects.length
          ? projects
          : [{ name: "No projects yet", status: "EMPTY" }]
        )
          .slice(0, 4)
          .map((project, index) => (
            <button
              className={
                index === 0
                  ? `${navigationClass} my-0.5 font-semibold text-ink`
                  : `${navigationClass} my-0.5`
              }
              key={project._id || project.name}
            >
              <span
                className={`inline-block h-2 w-2 shrink-0 rounded-sm ${dynamicStyles.color[projectColors[index]]}`}
              ></span>
              <span>{project.name}</span>
            </button>
          ))}
      </nav>
      <div className="mt-auto">
        <button
          className={
            settingsOpen ? `${navigationClass} bg-coral/10 font-semibold text-ink` : navigationClass
          }
          aria-current={settingsOpen ? "page" : undefined}
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
        >
          <Settings2 size={17} />
          <span>Settings</span>
        </button>
      </div>
      </aside>
    </>
  );
}
