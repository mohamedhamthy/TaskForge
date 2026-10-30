import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  CirclePlus,
  Filter,
  LayoutGrid,
  ListTodo,
  Plus,
  Users,
} from "lucide-react";

import AuthScreen from "./components/AuthScreen";
import ActivityModal from "./components/ActivityModal";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TeamPermissions from "./components/TeamPermissions";
import TaskDetailsModal from "./components/TaskDetailsModal";
import DashboardInsights from "./components/dashboard/DashboardInsights";
import PasswordSettings from "./components/settings/PasswordSettings";
import ReviewWorkflowPanel from "./components/ReviewWorkflowPanel";
import TeamMembersModal from "./components/TeamMembersModal";
import TaskBoard from "./components/dashboard/TaskBoard";
import SummaryCards from "./components/dashboard/SummaryCards";
import TaskCalendar from "./components/calendar/TaskCalendar";
import Dropdown from "./components/ui/Dropdown";
import Skeleton from "./components/ui/Skeleton";
import Toast from "./components/ui/Toast";
import Select from "./components/ui/Select";
import {
  CreateAdminModal,
  CreateMemberModal,
  CreateProjectModal,
  CreateTaskModal,
  InviteToProjectModal,
} from "./components/WorkspaceModals";
import { useAuthStore } from "./store/auth";
import { api } from "./services/api";
import { connectSocket, disconnectSocket } from "./services/socket";
import { mapTask } from "./utils/taskMapper.js";

const columns = [
  { id: "backlog", label: "Backlog", tone: "slate" },
  { id: "todo", label: "To do", tone: "amber" },
  { id: "progress", label: "In progress", tone: "blue" },
  { id: "review", label: "In review", tone: "violet" },
  { id: "done", label: "Done", tone: "green" },
];

const initialTasks = [
  {
    id: 1,
    title: "Map checkout edge cases",
    project: "E-commerce Platform",
    status: "backlog",
    priority: "Low",
    tag: "Research",
    due: "Sep 12",
    assignee: "AL",
    color: "coral",
  },
  {
    id: 2,
    title: "Design empty states",
    project: "Marketing Website",
    status: "backlog",
    priority: "Medium",
    tag: "Design",
    due: "Sep 15",
    assignee: "PN",
    color: "lilac",
  },
  {
    id: 3,
    title: "Set up error tracking",
    project: "Mobile App",
    status: "todo",
    priority: "Urgent",
    tag: "Engineering",
    due: "Sep 10",
    assignee: "JR",
    color: "sky",
  },
  {
    id: 4,
    title: "Create payment API",
    project: "E-commerce Platform",
    status: "todo",
    priority: "High",
    tag: "Engineering",
    due: "Sep 11",
    assignee: "KM",
    color: "mint",
  },
  {
    id: 5,
    title: "Write onboarding copy",
    project: "Marketing Website",
    status: "progress",
    priority: "Medium",
    tag: "Content",
    due: "Sep 13",
    assignee: "PN",
    color: "lilac",
  },
  {
    id: 6,
    title: "Implement dashboard",
    project: "Mobile App",
    status: "progress",
    priority: "High",
    tag: "Engineering",
    due: "Sep 14",
    assignee: "AL",
    color: "coral",
  },
  {
    id: 7,
    title: "Review auth flows",
    project: "E-commerce Platform",
    status: "review",
    priority: "High",
    tag: "Engineering",
    due: "Sep 09",
    assignee: "JR",
    color: "sky",
  },
  {
    id: 8,
    title: "Homepage responsive pass",
    project: "Marketing Website",
    status: "done",
    priority: "Medium",
    tag: "Design",
    due: "Sep 06",
    assignee: "PN",
    color: "lilac",
  },
  {
    id: 9,
    title: "QA release candidate",
    project: "Mobile App",
    status: "done",
    priority: "Urgent",
    tag: "QA",
    due: "Sep 07",
    assignee: "KM",
    color: "mint",
  },
];

const navItems = [
  { label: "Overview", icon: LayoutGrid },
  { label: "My tasks", icon: ListTodo, count: 8 },
  { label: "Calendar", icon: CalendarDays },
];

const formatRole = (role) =>
  ({
    OWNER: "Owner",
    ADMIN: "Admin",
    TEAM_LEAD: "Team Lead",
    MEMBER: "Member",
  })[role] || "Member";

function App() {
  const { user, loading, initialize, logout } = useAuthStore();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All tasks");
  const [notifications, setNotifications] = useState(3);
  const [notificationItems, setNotificationItems] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState("");
  const [projects, setProjects] = useState([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: "MEDIUM",
    projectId: "",
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [savingTask, setSavingTask] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [savingOwnerAction, setSavingOwnerAction] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER",
  });
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [taskActivity, setTaskActivity] = useState([]);
  const [taskDetailsLoading, setTaskDetailsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [reviewDraft, setReviewDraft] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [activityItems, setActivityItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [workspaceError, setWorkspaceErrorState] = useState("");

  const setWorkspaceError = (message) => {
    setWorkspaceErrorState(message);
    if (message) setToast({ type: "error", message });
    else
      setToast((current) =>
        current?.type === "error" ? null : current,
      );
  };

  useEffect(() => {
    initialize();
  }, [initialize]);
  useEffect(() => {
    if (!toast || toast.type === "error") return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!user) return;
    api
      .notifications()
      .then((response) => {
        setNotificationItems(response.data || []);
        setNotifications(
          (response.data || []).filter((item) => !item.isRead).length,
        );
      })
      .catch(() => setNotificationItems([]));
  }, [user]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    api
      .teams()
      .then((response) => {
        if (!active) return;
        const nextTeams = response.data || [];
        const savedTeamId = localStorage.getItem(
          `taskforge_workspace_${user.id}`,
        );
        setTeams(nextTeams);
        setActiveTeamId((current) => {
          if (nextTeams.some((team) => team._id === current)) return current;
          return (
            nextTeams.find((team) => team._id === savedTeamId)?._id ||
            nextTeams[0]?._id ||
            ""
          );
        });
      })
      .catch((error) => {
        if (active) setWorkspaceError(error.message);
      });
    return () => {
      active = false;
    };
  }, [user]);
  const openRecentActivity = async () => {
    try {
      const response = await api.activity(projects[0]?._id, 1);
      setActivityItems(response.data || []);
      setActivityOpen(true);
    } catch (error) {
      setWorkspaceError(error.message);
    }
  };
  const handleNotificationClick = async (item) => {
    setNotificationOpen(false);
    if (!item.isRead) {
      try {
        await api.markNotificationRead(item._id);
        setNotificationItems((items) =>
          items.map((notification) =>
            notification._id === item._id
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
        setNotifications((count) => Math.max(0, count - 1));
      } catch (error) {
        setWorkspaceError(error.message);
      }
    }

    if (item.type.startsWith("TASK_")) {
      await openTaskDetails(item.entityId);
      return;
    }
    if (item.type === "PROJECT_MEMBER_ADDED") {
      const project = projects.find((entry) => entry._id === item.entityId);
      if (project) {
        setQuery(project.name);
        setActiveNav("Overview");
        setSettingsOpen(false);
      }
      return;
    }
    if (
      ["TEAM_INVITATION", "ROLE_CHANGED", "ACCOUNT_PASSWORD_RESET"].includes(
        item.type,
      )
    )
      setMembersOpen(true);
  };
  useEffect(() => {
    if (!user || !activeTeamId) return;
    let active = true;
    const loadWorkspace = async () => {
      try {
        const [memberResponse, projectResponse] = await Promise.all([
          api.teamMembers(activeTeamId),
          api.projects(),
        ]);
        if (!active) return;
        const nextProjects = (projectResponse.data || []).filter(
          (project) =>
            String(project.team?._id || project.team) === activeTeamId,
        );
        setTeamMembers(memberResponse.data || []);
        setProjects(nextProjects);
        setTaskForm((current) => ({
          ...current,
          projectId: nextProjects.some(
            (project) => project._id === current.projectId,
          )
            ? current.projectId
            : nextProjects[0]?._id || "",
        }));
        if (!nextProjects[0]) {
          setTasks([]);
          return;
        }
        const taskResponses = await Promise.all(
          nextProjects.map((project) => api.tasks(project._id)),
        );
        if (!active) return;
        setTasks(
          taskResponses.flatMap((response, projectIndex) =>
            (response.data || []).map((task, index) =>
              mapTask(task, {
                project: nextProjects[projectIndex].name,
                index: index + projectIndex,
                projectIndex,
                userId: user.id,
                includeMine: true,
              }),
            ),
          ),
        );
      } catch (error) {
        if (active) setWorkspaceError(error.message);
      }
    };
    loadWorkspace();
    return () => {
      active = false;
    };
  }, [activeTeamId, user]);
  useEffect(() => {
    if (!user || !projects[0]) return undefined;
    const socket = connectSocket();
    if (!socket) return undefined;
    const refreshTasks = async () => {
      const response = await api.tasks(projects[0]._id);
      setTasks(
        (response.data || []).map((task, index) =>
          mapTask(task, {
            project: projects[0].name,
            index,
            projectIndex: 0,
            userId: user.id,
            includeTask: true,
            includeMine: true,
          }),
        ),
      );
    };
    socket.emit("room:join", { type: "project", id: projects[0]._id });
    socket.on("task.moved", refreshTasks);
    socket.on("comment.created", refreshTasks);
    const receiveNotification = (notification) => {
      setNotificationItems((items) => [notification, ...items]);
      setNotifications((count) => count + 1);
    };
    socket.on("notification.created", receiveNotification);
    return () => {
      socket.off("task.moved", refreshTasks);
      socket.off("comment.created", refreshTasks);
      socket.off("notification.created", receiveNotification);
      socket.emit("room:leave", { type: "project", id: projects[0]._id });
      disconnectSocket();
    };
  }, [projects, user]);

  const currentMember = teamMembers.find(
    (member) => (member.user?._id || member.user) === user?.id,
  );
  const isOwner = currentMember?.role === "OWNER";
  const isAdmin = currentMember?.role === "ADMIN";
  const isTeamLead = currentMember?.role === "TEAM_LEAD";
  const activeTeam = teams.find((team) => team._id === activeTeamId);
  const mustChangePassword = Boolean(user?.mustChangePassword);
  const shouldShowSettings = settingsOpen || mustChangePassword;

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesQuery = `${task.title} ${task.project} ${task.tag}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "All tasks" || task.priority === filter;
        const matchesView = activeNav !== "My tasks" || task.isMine;
        return matchesQuery && matchesFilter && matchesView;
      }),
    [activeNav, filter, query, tasks],
  );

  const moveTask = async (taskId, status) => {
    const previousTask = tasks.find((task) => task.id === taskId);
    if (!previousTask || previousTask.status === status) return;
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
    try {
      await api.moveTask(taskId, {
        status: {
          backlog: "BACKLOG",
          todo: "TODO",
          progress: "IN_PROGRESS",
          review: "REVIEW",
          done: "DONE",
        }[status],
        position: 0,
      });
      setWorkspaceError("");
    } catch (error) {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? { ...task, status: previousTask.status }
            : task,
        ),
      );
      setWorkspaceError(error.message);
    }
  };

  const scheduleTask = async (taskId, date) => {
    try {
      await api.updateTask(taskId, { dueDate: date });
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                dueDate: date,
                due: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
              }
            : task,
        ),
      );
      setWorkspaceError("");
      setToast({ type: "success", message: "Task scheduled." });
    } catch (error) {
      setWorkspaceError(error.message);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!taskForm.title.trim() || !taskForm.projectId) return;
    setSavingTask(true);
    try {
      await api.createTask(taskForm.projectId, {
        title: taskForm.title.trim(),
        description: taskForm.description?.trim() || "",
        priority: taskForm.priority,
        assignee: taskForm.assignee || null,
        position: 0,
      });
      const taskResponse = await api.tasks(taskForm.projectId);
      const project = projects.find((item) => item._id === taskForm.projectId);
      setTasks(
        (taskResponse.data || []).map((task, index) =>
          mapTask(task, {
            project: project?.name || "Project",
            index,
            projectIndex: Math.max(
              projects.findIndex((entry) => entry._id === taskForm.projectId),
              0,
            ),
            userId: user.id,
            includeMine: true,
            dueDate: false,
          }),
        ),
      );
      setTaskForm((current) => ({
        ...current,
        title: "",
        description: "",
        assignee: "",
      }));
      setTaskModalOpen(false);
      setWorkspaceError("");
      setToast({ type: "success", message: "Task created." });
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingTask(false);
    }
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    const teamId = activeTeamId;
    if (
      !adminForm.name.trim() ||
      !adminForm.email.trim() ||
      !adminForm.password ||
      !teamId
    )
      return;
    setSavingOwnerAction(true);
    try {
      const response = await api.addMember(teamId, {
        ...adminForm,
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        role: "ADMIN",
      });
      setTeamMembers(response.data?.members || response.data || []);
      setAdminForm({ name: "", email: "", password: "" });
      setAdminModalOpen(false);
      setWorkspaceError("");
      setToast({ type: "success", message: "Admin added to the team." });
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingOwnerAction(false);
    }
  };

  const createProject = async (event) => {
    event.preventDefault();
    const teamId = activeTeamId;
    if (!projectForm.name.trim() || !teamId) return;
    setSavingOwnerAction(true);
    try {
      const response = await api.createProject({
        teamId,
        name: projectForm.name.trim(),
        description: projectForm.description.trim(),
        status: "PLANNING",
      });
      setProjects((current) => [response.data, ...current]);
      setProjectForm({ name: "", description: "" });
      setProjectModalOpen(false);
      setWorkspaceError("");
      setToast({ type: "success", message: "Project created." });
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingOwnerAction(false);
    }
  };

  const createMember = async (event) => {
    event.preventDefault();
    const teamId = activeTeamId;
    if (
      !teamId ||
      !memberForm.name.trim() ||
      !memberForm.email.trim() ||
      !memberForm.password
    )
      return;
    setSavingOwnerAction(true);
    try {
      const response = await api.addMember(teamId, {
        ...memberForm,
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
      });
      setTeamMembers(response.data?.members || response.data || []);
      setMemberForm({ name: "", email: "", password: "", role: "MEMBER" });
      setMemberModalOpen(false);
      setWorkspaceError("");
      setToast({ type: "success", message: "Team member added." });
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingOwnerAction(false);
    }
  };

  const inviteToProject = async (event) => {
    event.preventDefault();
    if (!inviteEmail.trim() || !taskForm.projectId) return;
    setSavingOwnerAction(true);
    try {
      await api.inviteToProject(
        taskForm.projectId,
        inviteEmail.trim(),
        inviteRole,
      );
      setInviteEmail("");
      setInviteRole("MEMBER");
      setInviteModalOpen(false);
      setWorkspaceError("");
      setToast({ type: "success", message: "Project invitation sent." });
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingOwnerAction(false);
    }
  };

  const changeMemberRole = async (userId, role) => {
    try {
      const teamId = activeTeamId;
      const response = await api.updateMemberRole(teamId, userId, { role });
      setTeamMembers((members) =>
        members.map((member) =>
          (member.user?._id || member.user) === userId
            ? { ...member, role: response.data.role }
            : member,
        ),
      );
      setWorkspaceError("");
      setToast({ type: "success", message: "Member role updated." });
    } catch (error) {
      setWorkspaceError(error.message);
    }
  };

  const openTaskDetails = async (taskId) => {
    setTaskDetailsLoading(true);
    setSelectedTask({ _id: taskId });
    try {
      const [taskResponse, commentsResponse, activityResponse] =
        await Promise.all([
          api.task(taskId),
          api.comments(taskId),
          api.taskActivity(taskId),
        ]);
      setSelectedTask(taskResponse.data);
      setTaskComments(commentsResponse.data || []);
      setTaskActivity(activityResponse.data || []);
    } catch (error) {
      setWorkspaceError(error.message);
      setSelectedTask(null);
    } finally {
      setTaskDetailsLoading(false);
    }
  };

  const addTaskComment = async (event) => {
    event.preventDefault();
    if (!commentDraft.trim() || !selectedTask?._id) return;
    setSavingComment(true);
    try {
      const response = await api.addComment(
        selectedTask._id,
        commentDraft.trim(),
      );
      setTaskComments((current) => [...current, response.data]);
      setCommentDraft("");
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingComment(false);
    }
  };

  const submitTaskForReview = async () => {
    setSavingReview(true);
    try {
      const response = await api.submitReview(selectedTask._id);
      setSelectedTask(response.data);
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingReview(false);
    }
  };

  const requestTaskChanges = async () => {
    if (!reviewDraft.trim()) return;
    setSavingReview(true);
    try {
      const response = await api.requestChanges(
        selectedTask._id,
        reviewDraft.trim(),
      );
      setSelectedTask(response.data);
      setReviewDraft("");
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingReview(false);
    }
  };

  const approveTask = async () => {
    setSavingReview(true);
    try {
      const response = await api.approveTask(
        selectedTask._id,
        reviewDraft.trim(),
      );
      setSelectedTask(response.data);
      setReviewDraft("");
    } catch (error) {
      setWorkspaceError(error.message);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading)
    return (
      <div
        className="grid min-h-screen place-items-center bg-canvas p-6 text-muted"
        role="status"
        aria-label="Loading your workspace"
      >
        <span className="sr-only">Loading your workspace...</span>
        <div className="w-full max-w-3xl animate-pulse space-y-4" aria-hidden="true">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton className="h-24" key={item} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <Skeleton className="h-64" key={item} />
            ))}
          </div>
        </div>
      </div>
    );
  if (!user) return <AuthScreen />;

  const canManagePeople = isOwner || isAdmin;
  const roleCounts = teamMembers.reduce(
    (counts, member) => ({
      ...counts,
      [member.role]: (counts[member.role] || 0) + 1,
    }),
    {},
  );
  const visibleNavItems = navItems;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-canvas text-ink">
      <Sidebar
        teams={teams}
        activeTeam={activeTeam}
        isOwner={isOwner}
        canCreateWorkspace={user.role === "OWNER" || isOwner}
        visibleNavItems={visibleNavItems}
        activeNav={activeNav}
        tasks={tasks}
        projects={projects}
        settingsOpen={settingsOpen}
        mobileNavOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onSelectWorkspace={(teamId) => {
          setActiveTeamId(teamId);
          setProjects([]);
          setTeamMembers([]);
          setTasks([]);
          localStorage.setItem(`taskforge_workspace_${user.id}`, teamId);
          setActiveNav("Overview");
          setQuery("");
          setSettingsOpen(false);
          setMobileNavOpen(false);
        }}
        onWorkspaceCreated={(team) => {
          setTeams((current) => [team, ...current]);
          setActiveTeamId(team._id);
          setProjects([]);
          setTeamMembers([]);
          setTasks([]);
          localStorage.setItem(`taskforge_workspace_${user.id}`, team._id);
          setActiveNav("Overview");
          setQuery("");
          setSettingsOpen(false);
          setMobileNavOpen(false);
        }}
        onChangeNav={(label) => {
          setActiveNav(label);
          setSettingsOpen(false);
        }}
        onCreateProject={() => setProjectModalOpen(true)}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setActiveNav("Settings");
        }}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <Header
          activeNav={activeNav}
          query={query}
          onQueryChange={setQuery}
          notifications={notifications}
          notificationItems={notificationItems}
          notificationOpen={notificationOpen}
          onToggleNotifications={() => setNotificationOpen((open) => !open)}
          onMarkAllRead={async () => {
            await api.markAllNotificationsRead();
            setNotifications(0);
            setNotificationItems((items) =>
              items.map((item) => ({ ...item, isRead: true })),
            );
          }}
          onNotificationClick={handleNotificationClick}
          user={user}
          roleKey={currentMember?.role || user.role}
          onOpenSettings={() => {
            setSettingsOpen(true);
            setActiveNav("Settings");
          }}
          onToggleSidebar={() => setMobileNavOpen((open) => !open)}
          logout={logout}
        />
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onDismiss={() => setToast(null)}
          />
        )}
        <div
          className="mx-auto max-w-[1480px] px-[clamp(16px,3vw,38px)] py-10 max-[760px]:py-7"
          data-view={activeNav === "Calendar" ? "calendar" : "overview"}
        >
          {shouldShowSettings && (
            <section className="[max-width:620px] [padding:24px] border border-line [border-radius:10px] bg-paper [box-shadow:var(--shadow)] dark:text-ink dark:border-line dark:bg-paper">
              <div className="[&_p]:text-muted [&_p]:[font-size:11px] [&_p]:[margin:8px_0_0] flex justify-between items-center [&_h2]:[margin:0] [&_h2]:[font:600_17px_'Space_Grotesk'] [&_h2]:[letter-spacing:-0.3px] dark:[&_p]:text-muted">
                <div>
                  <p className="[font-size:10px] uppercase [letter-spacing:0.12em] text-coral font-bold [margin:0_0_9px]">
                    ACCOUNT
                  </p>
                  <h2>
                    {mustChangePassword
                      ? "Password update required"
                      : "Settings"}
                  </h2>
                  <p>
                    {mustChangePassword
                      ? "Change your temporary password to continue."
                      : "Manage your account and security."}
                  </p>
                </div>
                {!mustChangePassword && (
                  <button
                    className="relative grid place-items-center border-0 [background:transparent] [color:#9b999b]"
                    onClick={() => {
                      setSettingsOpen(false);
                      setActiveNav("Overview");
                    }}
                    aria-label="Close settings"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex items-center [gap:12px] [margin:28px_0] [padding-top:20px] [border-top:1px_solid_var(--line)] [&_strong]:block [&_span]:block [&_strong]:[font-size:13px] [&_span]:[margin-top:4px] [&_span]:text-muted [&_span]:[font-size:10px] dark:border-line dark:[background:#202328]">
                <div className="[width:27px] [height:27px] inline-grid place-items-center rounded-full [font-size:9px] font-bold shrink-0    [color:#995349] [background:#f8c1b8] [width:44px] [height:44px] [font-size:13px]">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <PasswordSettings />
              <button
                className="action-button [color:#fff] bg-navy [box-shadow:0_4px_10px_rgba(36,_44,_61,_0.17)] [margin-top:4px]"
                onClick={logout}
              >
                Log out of taskforge
              </button>
            </section>
          )}
          {!shouldShowSettings && (
            <>
              <section className="flex justify-between items-end [margin-bottom:32px] [&_h1]:[margin:0] [&_h1]:[font:600_28px_'Space_Grotesk',_sans-serif] [&_h1]:[letter-spacing:-0.8px] [&_h1_span]:text-coral [&_h1_span]:[font-size:22px] max-[760px]:items-start max-[760px]:[gap:20px] max-[760px]:flex-col max-[420px]:[&_h1]:[font-size:24px] [[data-view=calendar]_&]:[display:none]">
                <div>
                  <p className="[font-size:10px] uppercase [letter-spacing:0.12em] text-coral font-bold [margin:0_0_9px]">
                    {isOwner
                      ? "OWNER CONTROL CENTER"
                      : isAdmin
                        ? "ADMIN WORKSPACE"
                        : "TEAM WORKSPACE"}
                  </p>
                  <h1>
                    Good morning, {user.name.split(" ")[0]} <span>✦</span>
                  </h1>
                  <p className="text-muted [font-size:11px] [margin:8px_0_0] dark:text-muted">
                    {isOwner
                      ? "Manage the team, projects, and every task in one place."
                      : isAdmin
                        ? "Coordinate members, projects, and assigned work."
                        : "Here's what's happening across your workspace."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Dropdown
                    label="Create"
                    align="right"
                    trigger={({ open, onToggle, triggerRef }) => (
                      <button
                        ref={triggerRef}
                        type="button"
                        className="flex min-h-10 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-ink hover:border-coral"
                        aria-haspopup="menu"
                        aria-expanded={open}
                        onClick={onToggle}
                      >
                        <Plus size={16} /> Create <ChevronDown size={14} />
                      </button>
                    )}
                  >
                    {canManagePeople && (
                      <>
                        <p className="px-2.5 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-muted">
                          People
                        </p>
                        {isOwner && (
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
                            onClick={() => setAdminModalOpen(true)}
                          >
                            Create admin
                          </button>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
                          onClick={() => {
                            setMemberForm((form) => ({
                              ...form,
                              role: "TEAM_LEAD",
                            }));
                            setMemberModalOpen(true);
                          }}
                        >
                          Create team lead
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
                          onClick={() => {
                            setMemberForm((form) => ({
                              ...form,
                              role: "MEMBER",
                            }));
                            setMemberModalOpen(true);
                          }}
                        >
                          Create member
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
                          onClick={() => setInviteModalOpen(true)}
                        >
                          Invite to project
                        </button>
                      </>
                    )}
                    <p className="px-2.5 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-muted">
                      Work
                    </p>
                    {isOwner && (
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
                        onClick={() => setProjectModalOpen(true)}
                      >
                        Create project
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full rounded-md px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
                      onClick={() => setTaskModalOpen(true)}
                    >
                      Create task
                    </button>
                  </Dropdown>
                  <button
                    type="button"
                    className="flex min-h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:opacity-90"
                    onClick={() => setTaskModalOpen(true)}
                  >
                    <CirclePlus size={17} /> New task
                  </button>
                </div>
              </section>
              <SummaryCards
                visibleTaskCount={visibleTasks.length}
                completedCount={
                  tasks.filter((task) => task.status === "done").length
                }
                projectCount={projects.length}
                firstName={user.name.split(" ")[0]}
                role={formatRole(currentMember?.role)}
              />
              {canManagePeople && (
                <TeamPermissions
                  teamMembers={teamMembers}
                  userId={user.id}
                  isOwner={isOwner}
                  formatRole={formatRole}
                  onChangeMemberRole={changeMemberRole}
                />
              )}
              <div className="[&_p]:text-muted [&_p]:[font-size:11px] [&_p]:[margin:8px_0_0] flex justify-between items-center [&_h2]:[margin:0] [&_h2]:[font:600_17px_'Space_Grotesk'] [&_h2]:[letter-spacing:-0.3px] [[data-view=calendar]_&]:[display:none]">
                <div>
                  <h2>My workspace</h2>
                  <p>Keep an eye on the work that needs your attention.</p>
                </div>
                <div className="flex border border-line [border-radius:6px] [padding:2px]">
                  <button
                    className="border-0 [background:transparent] [color:#aaa8a6] px-2 py-[6px] [border-radius:4px] dark:text-ink dark:border-line dark:[background:#2b2e34]"
                    aria-label="Board view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    className="border-0 [background:transparent] [color:#aaa8a6] px-2 py-[6px] [border-radius:4px] dark:text-ink dark:border-line dark:[background:#2b2e34]"
                    aria-label="List view"
                  >
                    <ListTodo size={16} />
                  </button>
                </div>
              </div>
              <section className="my-4 flex items-center justify-between gap-3 [[data-view=calendar]_&]:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-muted">
                    <Filter size={15} aria-hidden="true" /> Priority
                  </span>
                  <Select
                    className="min-w-[132px]"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    aria-label="Filter tasks by priority"
                  >
                    <option>All tasks</option>
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </Select>
                  <span className="text-sm text-muted">
                    {visibleTasks.length} tasks
                  </span>
                </div>
              </section>
              {workspaceError && (
                <p
                  className="[margin:14px_0] [padding:10px_12px] [border-radius:6px] [color:#a94c43] [background:#fff0ed] [font-size:10px] [[data-view=calendar]_&]:[display:none]"
                  role="alert"
                >
                  {workspaceError}
                </p>
              )}
              {activeNav === "Calendar" && (
                <TaskCalendar
                  tasks={tasks}
                  onOpenTask={openTaskDetails}
                  onScheduleTask={scheduleTask}
                  onCreateTask={() => setTaskModalOpen(true)}
                  canScheduleTasks={isOwner || isAdmin}
                  error={workspaceError}
                />
              )}
              <TaskBoard
                columns={columns}
                tasks={visibleTasks}
                onOpenTask={openTaskDetails}
                onMoveTask={moveTask}
                onAddTask={() => setTaskModalOpen(true)}
                hasProjects={projects.length > 0}
                isOwner={isOwner}
                totalTaskCount={tasks.length}
                onCreateProject={() => setProjectModalOpen(true)}
              />
              <div className="my-4 [[data-view=calendar]_&]:hidden">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-left text-ink shadow-[var(--shadow-card)] hover:border-coral"
                  onClick={() => setMembersOpen(true)}
                >
                  <Users size={16} aria-hidden="true" />
                  <span className="flex-1">
                    <strong className="block text-sm">Team members</strong>
                    <small className="mt-0.5 block text-xs text-muted">
                      {teamMembers.length} people in this workspace
                    </small>
                  </span>
                  <ChevronDown size={15} className="text-muted" />
                </button>
              </div>
              {isOwner && (
                <div className="mb-5 flex flex-wrap gap-2 [[data-view=calendar]_&]:hidden">
                  {[
                    ["OWNER", "Owners"],
                    ["ADMIN", "Admins"],
                    ["TEAM_LEAD", "Team Leads"],
                    ["MEMBER", "Members"],
                  ].map(([role, label]) => (
                    <span
                      className="rounded-lg border border-line bg-paper px-3 py-2 text-xs text-muted"
                      key={role}
                    >
                      <b className="mr-1 text-sm text-ink">
                        {roleCounts[role] || 0}
                      </b>{" "}
                      {label}
                    </span>
                  ))}
                </div>
              )}
              <DashboardInsights
                isOwner={isOwner}
                onCreateProject={() => setProjectModalOpen(true)}
                onOpenMembers={() => setMembersOpen(true)}
                onViewActivity={openRecentActivity}
              />
              {taskModalOpen && (
                <CreateTaskModal
                  onClose={() => setTaskModalOpen(false)}
                  onSubmit={createTask}
                  saving={savingTask}
                  taskForm={taskForm}
                  setTaskForm={setTaskForm}
                  projects={projects}
                  teamMembers={teamMembers}
                />
              )}
              {adminModalOpen && (
                <CreateAdminModal
                  onClose={() => setAdminModalOpen(false)}
                  onSubmit={createAdmin}
                  saving={savingOwnerAction}
                  adminForm={adminForm}
                  setAdminForm={setAdminForm}
                />
              )}
              {memberModalOpen && (
                <CreateMemberModal
                  onClose={() => setMemberModalOpen(false)}
                  onSubmit={createMember}
                  saving={savingOwnerAction}
                  memberForm={memberForm}
                  setMemberForm={setMemberForm}
                />
              )}
              {inviteModalOpen && (
                <InviteToProjectModal
                  onClose={() => setInviteModalOpen(false)}
                  onSubmit={inviteToProject}
                  saving={savingOwnerAction}
                  taskForm={taskForm}
                  setTaskForm={setTaskForm}
                  projects={projects}
                  inviteEmail={inviteEmail}
                  setInviteEmail={setInviteEmail}
                  inviteRole={inviteRole}
                  setInviteRole={setInviteRole}
                />
              )}
              {projectModalOpen && (
                <CreateProjectModal
                  onClose={() => setProjectModalOpen(false)}
                  onSubmit={createProject}
                  saving={savingOwnerAction}
                  projectForm={projectForm}
                  setProjectForm={setProjectForm}
                />
              )}
              {selectedTask && (
                <TaskDetailsModal
                  selectedTask={selectedTask}
                  loading={taskDetailsLoading}
                  comments={taskComments}
                  activity={taskActivity}
                  commentDraft={commentDraft}
                  setCommentDraft={setCommentDraft}
                  savingComment={savingComment}
                  onAddComment={addTaskComment}
                  onClose={() => setSelectedTask(null)}
                />
              )}
              {activityOpen && (
                <ActivityModal
                  activityItems={activityItems}
                  onClose={() => setActivityOpen(false)}
                />
              )}
              {membersOpen && (
                <TeamMembersModal
                  members={teamMembers}
                  teamId={activeTeamId}
                  currentUserId={user.id}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                  onClose={() => setMembersOpen(false)}
                />
              )}
            </>
          )}
          {selectedTask && !taskDetailsLoading && (
            <ReviewWorkflowPanel
              selectedTask={selectedTask}
              isTeamLead={isTeamLead}
              userId={user.id}
              saving={savingReview}
              reviewDraft={reviewDraft}
              setReviewDraft={setReviewDraft}
              onRequestChanges={requestTaskChanges}
              onApprove={approveTask}
              onSubmitForReview={submitTaskForReview}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
