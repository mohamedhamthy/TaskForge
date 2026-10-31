import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import teamRoutes from "./routes/teams.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import commentRoutes from "./routes/comments.js";
import notificationRoutes from "./routes/notifications.js";
import activityRoutes from "./routes/activity.js";

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET?.trim();
if (!process.env.MONGODB_URI?.trim()) {
  throw new Error("MONGODB_URI is required");
}
if (!jwtSecret) throw new Error("JWT_SECRET is required");
if (
  nodeEnv === "production" &&
  (jwtSecret.length < 32 ||
    /replace|change[-_ ]?this|local[-_ ]?development|your[-_ ]?/i.test(
      jwtSecret,
    ))
) {
  throw new Error("JWT_SECRET must be a unique secret of at least 32 characters");
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return port;
}

function parseClientOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("CLIENT_ORIGIN must contain valid origin URLs");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (nodeEnv === "production" && url.protocol !== "https:")
  ) {
    throw new Error("CLIENT_ORIGIN must contain valid frontend origins");
  }
  return url.origin;
}

const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (nodeEnv === "production" && configuredOrigins.length === 0) {
  throw new Error("CLIENT_ORIGIN is required in production");
}
const allowedOrigins = new Set(
  configuredOrigins.map(parseClientOrigin),
);
if (nodeEnv !== "production") {
  for (const origin of [
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://localhost:5174",
  ]) {
    allowedOrigins.add(origin);
  }
}
const corsOptions = {
  origin: (origin, callback) =>
    callback(null, !origin || allowedOrigins.has(origin)),
};
const port = parsePort(process.env.PORT || 5000);
const app = express();
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.get("/api/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({
    success: ready,
    service: "taskforge-api",
    timestamp: new Date().toISOString(),
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status =
    error.status ||
    (error.name === "ValidationError"
      ? 422
      : error.type === "entity.parse.failed"
        ? 400
        : 500);
  if (status >= 500) console.error("Request failed:", error.name);
  res.status(status).json({
    success: false,
    message: nodeEnv === "production" ? "Internal server error" : error.message,
  });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: corsOptions });
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    socket.userId = jwt.verify(token, jwtSecret).userId;
    next();
  } catch {
    next(new Error("Invalid socket token"));
  }
});
io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
  socket.on("room:join", ({ type, id }) => {
    if (["team", "project"].includes(type) && id) socket.join(`${type}:${id}`);
  });
  socket.on("room:leave", ({ type, id }) => socket.leave(`${type}:${id}`));
});
app.set("io", io);

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.name);
});
mongoose.connection.on("disconnected", () => {
  console.error("MongoDB connection lost");
});

let shuttingDown = false;
async function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  const timeout = setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10000);
  timeout.unref();

  try {
    await new Promise((resolve) => io.close(resolve));
    await mongoose.disconnect();
  } catch (error) {
    console.error("Shutdown failed:", error.name);
    exitCode = 1;
  } finally {
    clearTimeout(timeout);
    process.exitCode = exitCode;
  }
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.name);
  void shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error(
    "Unhandled promise rejection:",
    reason instanceof Error ? reason.name : typeof reason,
  );
  void shutdown(1);
});
process.on("SIGTERM", () => void shutdown(0));
process.on("SIGINT", () => void shutdown(0));

try {
  await connectDatabase();
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`TaskForge API listening on port ${port}`);
  });
} catch (error) {
  console.error("TaskForge failed to start:", error.name);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    console.error("MongoDB cleanup failed:", disconnectError.name);
  }
  process.exitCode = 1;
}
