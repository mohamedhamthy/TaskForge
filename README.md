# TaskForge

TaskForge is a team task and project management application. The repository contains a React frontend and an Express API backed by MongoDB. The API also provides authenticated Socket.IO connections for live comments and notifications.

## Features

- Workspaces, teams, projects, and team membership
- Task boards with statuses, priorities, assignments, and review actions
- Task comments, notifications, and project activity history
- Role-aware access for owners, admins, team leads, and members
- Live Socket.IO updates

## Project layout

```text
TaskForge/
├── backend/       Express API, MongoDB models, and seed script
├── frontend/      React application built with Vite
├── docker-compose.yml
└── README.md
```

## Requirements

- Node.js 24.x (the frontend and backend declare Node 24 for deployment)
- npm
- MongoDB, either installed locally, running in Docker, or hosted by MongoDB Atlas

Check your installed versions:

```powershell
node --version
npm --version
```

## Install and configure

Run these commands from the repository root in PowerShell.

1. Install the backend and frontend dependencies:

   ```powershell
   Set-Location backend
   npm install
   Set-Location ..\frontend
   npm install
   Set-Location ..
   ```

2. Create the backend environment file:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

3. Edit `backend\.env` and set `JWT_SECRET` to a new, long, random value. Set `MONGODB_URI` to the connection string for the MongoDB instance you will use. The example file is configured for a local MongoDB server.

   Backend variables:

   | Variable | Purpose |
   | --- | --- |
   | `PORT` | API port; defaults to `5000` |
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_SECRET` | Secret used to sign authentication tokens; must be changed from the example |
   | `CLIENT_ORIGIN` | Allowed frontend origin; defaults to `http://127.0.0.1:5173` |
   | `NODE_ENV` | Runtime environment, usually `development` locally |

4. The frontend works with local API and Socket.IO URLs during development. To override them, copy the frontend example and edit the values:

   ```powershell
   Copy-Item frontend\.env.example frontend\.env
   ```

   | Variable | Purpose |
   | --- | --- |
   | `VITE_API_URL` | API base URL, normally `http://127.0.0.1:5000/api`; required for production builds |
   | `VITE_SOCKET_URL` | Optional Socket.IO URL; defaults to the origin from `VITE_API_URL` |

   Vite only exposes variables prefixed with `VITE_` to frontend code. Never put secrets in frontend environment variables.

Do not commit `.env` files or put database credentials, tokens, or production secrets in documentation or frontend configuration.

## Start MongoDB

Choose one option:

- **Local MongoDB:** Start your local MongoDB server. On Windows, check the service with `Get-Service MongoDB`; if installed but stopped, start it with `Start-Service MongoDB`.
- **Docker:** With Docker Desktop installed and running, start the MongoDB service from the repository root:

  ```powershell
  docker compose up -d mongodb
  ```

- **MongoDB Atlas:** Set `MONGODB_URI` in `backend\.env` to your Atlas connection string. Confirm the database user and network access rules are configured in Atlas.

## Run the application

Keep MongoDB running, then start each app in a separate terminal from the repository root.

**Terminal 1 — API:**

```powershell
Set-Location backend
npm run dev
```

The API starts at `http://127.0.0.1:5000`. Check it at `http://127.0.0.1:5000/api/health`.

**Terminal 2 — frontend:**

```powershell
Set-Location frontend
npm run dev
```

Open the Vite URL printed in the terminal (by default, `http://127.0.0.1:5173`). Keep both processes running while using the app.

## Optional demo data

To create a sample team, projects, tasks, comments, and accounts, run:

```powershell
Set-Location backend
npm run seed
```

> **Warning:** The seed script deletes existing users, teams, projects, tasks, comments, notifications, and activity logs in the database selected by `MONGODB_URI` before inserting demo data. Use a disposable development database only.

Demo accounts (all use the development-only password `TeamFlow123!`):

| Role | Email |
| --- | --- |
| Owner | `owner@teamflow.demo` |
| Admin | `admin@teamflow.demo` |
| Member | `member@teamflow.demo` |
| Team lead | `lead@teamflow.demo` |

Change demo credentials before using any seeded environment beyond local development.

## Useful commands

Run commands from the corresponding app directory:

| Directory | Command | Description |
| --- | --- | --- |
| `backend` | `npm run dev` | Start the API with automatic restarts |
| `backend` | `npm start` | Start the API without the development watcher |
| `backend` | `npm run seed` | Replace database contents with demo data |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run build` | Create a production build in `frontend/dist` |
| `frontend` | `npm run preview` | Preview the production build locally |
| `frontend` | `npm run lint` | Run ESLint |

There is no root-level application start script; install and run each app separately.

## Deploy to Railway

Deploy the frontend and backend as **two Railway services** from the same GitHub repository. Set each service's **Root Directory** before deploying so Railpack reads that app's package manifest and lockfile:

| Railway service | Root Directory | Build command | Start command | Health check |
| --- | --- | --- | --- | --- |
| Backend | `/backend` | Railpack installs from `package-lock.json` | `npm start` | `/api/health` |
| Frontend | `/frontend` | `npm run build` | `npm start` | `/` |

Set these variables in the Railway service settings (do not commit production `.env` files):

**Backend service**

- `NODE_ENV=production`
- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — a unique, randomly generated secret of at least 32 characters
- `CLIENT_ORIGIN` — the exact HTTPS origin of the deployed frontend, with no path (for example, `https://your-frontend.up.railway.app`)
- Railway supplies `PORT`; the API listens on it and binds to `0.0.0.0`.

Generate a secret locally with Node.js and add the output directly to Railway's backend variables:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

**Frontend service**

- `VITE_API_URL` — the deployed backend URL followed by `/api` (for example, `https://your-backend.up.railway.app/api`). This must be available during the production build.
- Optionally set `VITE_SOCKET_URL` to the backend origin; by default the frontend derives it from `VITE_API_URL`.

Generate public domains for both services, set the frontend variable before its build, and set the backend `CLIENT_ORIGIN` to the frontend's HTTPS origin. Confirm that the Atlas database user and network access rules allow connections from Railway. Do not expose `MONGODB_URI` or `JWT_SECRET` as `VITE_*` variables.

## Troubleshooting

- **API does not start:** Confirm `backend\.env` exists and has a `JWT_SECRET` and a valid `MONGODB_URI`.
- **MongoDB connection error:** Start the local service or Docker container, verify the URI and port, or check Atlas credentials and network access.
- **Frontend cannot reach the API:** Confirm the backend is running and `VITE_API_URL` points to its `/api` endpoint. Restart Vite after changing a frontend `.env` file.
- **Production frontend build fails:** Set `VITE_API_URL` in the Railway frontend service before building.
- **CORS error:** Make sure the frontend's exact origin (including hostname and port) is included in `CLIENT_ORIGIN`. The API allows common localhost and `127.0.0.1` Vite development ports only outside production.
- **Port already in use:** Stop the other process using the port or change the backend `PORT`. If changing the backend port, update the frontend API and Socket.IO URLs too.

## More information

See [backend/README.md](backend/README.md) for backend-specific setup, authentication behavior, Socket.IO events, and the API route list.
