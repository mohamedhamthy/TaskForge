# TaskForge API

MongoDB and Express API for the TaskForge frontend.

## Run locally

1. Copy `.env.example` to `.env` and set a long `JWT_SECRET`.
2. Make sure MongoDB is running. On Windows, check it with `Get-Service MongoDB` and start it with `Start-Service MongoDB` when needed.
3. Install dependencies with `npm install`.
4. Start the API with `npm run dev`.
5. Populate demo data with `npm run seed` when you want a ready-made workspace.

Docker is optional. Use `docker compose up -d mongodb` only when Docker Desktop is installed and running.

Demo accounts all use the development password `TeamFlow123!`:

- `owner@teamflow.demo`
- `admin@teamflow.demo`
- `member@teamflow.demo`
- `lead@teamflow.demo` (Team Lead)

The API runs at `http://127.0.0.1:5000` and the health check is `GET /api/health`.

## Current API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET /api/teams`
- `POST /api/teams`
- `GET /api/teams/:teamId`
- `PATCH /api/teams/:teamId`
- `DELETE /api/teams/:teamId`
- `GET /api/teams/:teamId/members`
- `POST /api/teams/:teamId/members` with `{ "name": "...", "email": "...", "password": "...", "role": "ADMIN" }`
- `POST /api/teams/:teamId/members/:userId/password-reset` (owner/admin only; returns a one-time temporary password and requires the member to change it)
- `PATCH /api/teams/:teamId/members/:userId`
- `DELETE /api/teams/:teamId/members/:userId`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:userId`
- `DELETE /api/projects/:projectId`
- `GET /api/tasks/project/:projectId`
- `POST /api/tasks/project/:projectId`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `GET /api/comments/task/:taskId`
- `POST /api/comments/task/:taskId`
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`
- `PATCH /api/notifications/read-all`
- `GET /api/activity/project/:projectId?page=1&limit=20`

Protected endpoints require `Authorization: Bearer <token>`. Team and project access is checked on the server for every protected resource. Passwords are hashed with bcrypt; hashes and JWT secrets are never returned.

Public registration requires a non-empty name, a valid unique email address, a password of at least 8 characters containing uppercase and lowercase letters, a number, and a special character, plus a matching confirmation. The first account in an empty database is assigned the account-level `OWNER` role; public registrations after that receive `MEMBER` regardless of submitted fields. Only the account owner (or an existing workspace owner) can create a workspace. Workspace roles continue to be enforced independently for team and project actions.

Team roles are `OWNER`, `ADMIN`, `TEAM_LEAD`, and `MEMBER`. Owners can create Admins and projects. Admins can create Members and Team Leads, invite team members to projects, assign tasks, and manage task work. Team Leads can be assigned projects and tasks.

Socket.io is served from the same port. Clients can emit `room:join` with `{ "type": "project", "id": "..." }` and receive `comment.created` events for joined project rooms.

This is the backend foundation for the remaining real-time comments, notifications, Socket.io events, pagination, and automated integration tests.