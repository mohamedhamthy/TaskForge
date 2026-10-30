import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import teamRoutes from "./routes/teams.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import commentRoutes from "./routes/comments.js";
import notificationRoutes from "./routes/notifications.js";
import activityRoutes from "./routes/activity.js";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5173",
  "http://localhost:5174",
]);
const corsOptions = {
  origin: (origin, callback) =>
    callback(null, !origin || allowedOrigins.has(origin)),
};
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
app.get("/api/health", (req, res) =>
  res.json({
    success: true,
    service: "taskforge-api",
    timestamp: new Date().toISOString(),
  }),
);
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
app.use((error, req, res) => {
  console.error(error);
  res.status(error.name === "ValidationError" ? 422 : 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
});

const port = Number(process.env.PORT || 5000);
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: corsOptions });
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    socket.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
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
connectDatabase()
  .then(() =>
    httpServer.listen(port, () =>
      console.log(`TaskForge API listening on http://127.0.0.1:${port}`),
    ),
  )
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
