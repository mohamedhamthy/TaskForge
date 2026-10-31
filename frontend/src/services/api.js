export const API_URL =
  import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") ||
  (import.meta.env.DEV ? "http://127.0.0.1:5000/api" : "");

if (!API_URL) {
  throw new Error("VITE_API_URL must be set to the deployed API URL");
}

async function request(path, options = {}) {
  const token = localStorage.getItem("taskforge_token");
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof TypeError)
      throw new Error(
        "Unable to connect to TaskForge. Check that the API server is running and try again.",
        { cause: error },
      );
    throw error;
  }
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationMessage = Object.values(payload.errors || {}).flat()[0];
    throw new Error(validationMessage || payload.message || "Request failed");
  }

  return payload;
}

export const api = {
  health: () => request("/health"),
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  changePassword: (data) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  teams: () => request("/teams"),
  createTeam: (data) =>
    request("/teams", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  team: (teamId) => request(`/teams/${teamId}`),
  teamMembers: (teamId) => request(`/teams/${teamId}/members`),
  addMember: (teamId, data) =>
    request(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resetMemberPassword: (teamId, userId) =>
    request(`/teams/${teamId}/members/${userId}/password-reset`, {
      method: "POST",
    }),
  updateMemberRole: (teamId, userId, data) =>
    request(`/teams/${teamId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  removeMember: (teamId, userId) =>
    request(`/teams/${teamId}/members/${userId}`, { method: "DELETE" }),
  projects: () => request("/projects"),
  createProject: (data) =>
    request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  inviteToProject: (projectId, email, role = "MEMBER") =>
    request(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),
  tasks: (projectId, params = "") =>
    request(
      `/tasks/project/${projectId}${params ? `?${params}` : ""}`,
    ),
  createTask: (projectId, data) =>
    request(`/tasks/project/${projectId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (taskId, data) =>
    request(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  task: (taskId) => request(`/tasks/${taskId}`),
  moveTask: (taskId, data) =>
    request(`/tasks/${taskId}/move`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  submitReview: (taskId) =>
    request(`/tasks/${taskId}/submit-review`, { method: "POST" }),
  requestChanges: (taskId, feedback) =>
    request(`/tasks/${taskId}/request-changes`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    }),
  approveTask: (taskId, feedback = "") =>
    request(`/tasks/${taskId}/approve-complete`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    }),
  deleteTask: (taskId) =>
    request(`/tasks/${taskId}`, { method: "DELETE" }),
  comments: (taskId) => request(`/comments/task/${taskId}`),
  addComment: (taskId, content) =>
    request(`/comments/task/${taskId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  updateComment: (commentId, content) =>
    request(`/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),
  deleteComment: (commentId) =>
    request(`/comments/${commentId}`, { method: "DELETE" }),
  notifications: () => request("/notifications"),
  markNotificationRead: (notificationId) =>
    request(`/notifications/${notificationId}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    request("/notifications/read-all", { method: "PATCH" }),
  activity: (projectId, page = 1) =>
    request(`/activity/project/${projectId}?page=${page}&limit=20`),
  taskActivity: (taskId) => request(`/activity/task/${taskId}`),
};