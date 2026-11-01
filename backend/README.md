# TaskForge API

The TaskForge backend is an Express API with MongoDB persistence and Socket.IO support. For full-stack installation instructions, see the [project README](../README.md).

## Requirements

- Node.js 24.x
- npm
- MongoDB (local, Docker, or MongoDB Atlas)

## Local setup

From the repository root, install backend dependencies and create the local environment file:

```powershell
Set-Location backend
npm install
Copy-Item .env.example .env
```

Edit `backend\.env` before starting the API:

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string; the example uses `mongodb://127.0.0.1:27017/taskforge` |
| `JWT_SECRET` | Yes | Long, random secret for signing JWTs; use at least 32 characters in production |
| `CLIENT_ORIGIN` | Production required | Comma-separated exact frontend origins; no origins are allowed by default |
| `NODE_ENV` | No | Defaults to `development`; set to `production` when deployed |

Never commit `.env` or use development secrets in production. For local MongoDB with Docker Desktop, start the container from the repository root:

```powershell
docker compose up -d mongodb
```

Alternatively, start a local MongoDB service or configure `MONGODB_URI` with an Atlas connection string and the appropriate network access settings.

Start the API from the `backend` directory:

```powershell
npm run dev
```

The API listens on port `5000` by default and binds to `0.0.0.0`. `GET /health` is a simple service health check; `GET /api/health` reports database readiness. For a non-watching start, use `npm start`.

## Railway production deployment

Create a Railway service from this repository and set its **Root Directory** to `/backend`. Railpack can install dependencies from `package-lock.json`; set the start command to `npm start` and the health check path to `/api/health`.

Set these Railway variables:

- `NODE_ENV=production`
- `MONGODB_URI` to the Atlas connection string
- `JWT_SECRET` to a unique random value of at least 32 characters
- `CLIENT_ORIGIN` to the deployed frontend's HTTPS origin, without a path. Multiple production or preview domains can be comma-separated.

Generate a secret locally with Node.js and add the output directly to Railway's backend variables:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Railway supplies `PORT`. The API listens on that port and binds to `0.0.0.0`. In production, the backend only allows the configured HTTPS origins; no localhost origins are hardcoded. `/api/health` returns `503` until MongoDB is connected.

Do not set a `VITE_*` variable on the backend, commit `.env` files, or place credentials in frontend build variables. Rotate any credentials that have been shared or exposed.

## Demo data

Run this from the `backend` directory:

```powershell
npm run seed
```

**This is destructive:** the script deletes existing users, teams, projects, tasks, comments, notifications, and activity logs from the database configured by `MONGODB_URI`, then creates sample data. Run it only against a disposable development database.

All seeded accounts use the development-only password `TeamFlow123!`:

- Owner: `owner@teamflow.demo`
- Admin: `admin@teamflow.demo`
- Member: `member@teamflow.demo`
- Team lead: `lead@teamflow.demo`

## Authentication and access

- Registration requires a name, unique valid email, password of at least eight characters with uppercase and lowercase letters, a number, and a special character, plus a matching confirmation.
- The first account in an empty database receives the account-level `OWNER` role. Later public registrations receive `MEMBER`; role fields submitted during public registration do not grant privileges.
- Protected HTTP endpoints require the JWT returned by login or registration in the `Authorization: Bearer <token>` header.
- Tokens expire after seven days. Logging out invalidates existing tokens for that account.
- Team roles are `OWNER`, `ADMIN`, `TEAM_LEAD`, and `MEMBER`. Access is checked by the API for protected team and project resources.
- Passwords are hashed with bcrypt. Password-reset responses for invited team members provide a temporary password, which the member must change.

## API routes

All routes below are prefixed with `/api`. Except for `GET /health`, authentication routes `POST /auth/register` and `POST /auth/login`, and the Socket.IO connection, HTTP routes require authentication.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | API health status |
| `POST` | `/auth/register` | Register an account |
| `POST` | `/auth/login` | Sign in |
| `POST` | `/auth/logout` | Invalidate the current token |
| `GET` | `/auth/me` | Get the current account |
| `POST` | `/auth/change-password` | Change the current account password |
| `GET` | `/teams` | List the current user's teams |
| `POST` | `/teams` | Create a team |
| `GET` | `/teams/:teamId` | Get a team |
| `PATCH` | `/teams/:teamId` | Update a team |
| `DELETE` | `/teams/:teamId` | Delete a team |
| `GET` | `/teams/:teamId/members` | List team members |
| `POST` | `/teams/:teamId/members` | Add a member (`name`, `email`, `password`, `role`) |
| `POST` | `/teams/:teamId/members/:userId/password-reset` | Reset a member password |
| `PATCH` | `/teams/:teamId/members/:userId` | Update a member's team role |
| `DELETE` | `/teams/:teamId/members/:userId` | Remove a team member |
| `GET` | `/projects` | List projects accessible to the current user |
| `POST` | `/projects` | Create a project (`teamId` is required) |
| `GET` | `/projects/:projectId` | Get a project |
| `PATCH` | `/projects/:projectId` | Update a project |
| `DELETE` | `/projects/:projectId` | Delete a project |
| `POST` | `/projects/:projectId/members` | Add or update a project member |
| `DELETE` | `/projects/:projectId/members/:userId` | Remove a project member |
| `GET` | `/tasks/project/:projectId` | List tasks in a project |
| `POST` | `/tasks/project/:projectId` | Create a task |
| `GET` | `/tasks/:taskId` | Get a task |
| `PATCH` | `/tasks/:taskId` | Update a task |
| `DELETE` | `/tasks/:taskId` | Delete a task |
| `PATCH` | `/tasks/:taskId/move` | Move a task on the board |
| `POST` | `/tasks/:taskId/submit-review` | Submit a task for review |
| `POST` | `/tasks/:taskId/request-changes` | Request changes to a task |
| `POST` | `/tasks/:taskId/approve-complete` | Approve task completion |
| `GET` | `/comments/task/:taskId` | List comments on a task |
| `POST` | `/comments/task/:taskId` | Add a task comment |
| `PATCH` | `/comments/:commentId` | Edit the current user's comment |
| `DELETE` | `/comments/:commentId` | Delete the current user's comment |
| `GET` | `/notifications` | List up to 50 notifications for the current user |
| `PATCH` | `/notifications/:notificationId/read` | Mark a notification as read |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read |
| `GET` | `/activity/project/:projectId?page=1&limit=20` | Get paginated project activity |
| `GET` | `/activity/task/:taskId` | Get task activity |

Successful responses generally use a JSON object with `success` and `data` fields. Delete endpoints may return `204 No Content`. Request bodies are JSON; validation errors include a message describing invalid input.

## Socket.IO

Socket.IO uses the same host and port as the API. Authenticate a connection with the JWT in the Socket.IO `auth` payload:

```js
io("http://127.0.0.1:5000", {
  auth: { token: "<jwt>" },
});
```

Supported client events:

- `room:join` with `{ "type": "project", "id": "<projectId>" }` or `{ "type": "team", "id": "<teamId>" }`
- `room:leave` with the same shape

Server events include `comment.created` for project rooms and `notification.created` for the user's notification room.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the API with Nodemon |
| `npm start` | Run the API with Node |
| `npm run seed` | Destructively replace configured database contents with demo data |
