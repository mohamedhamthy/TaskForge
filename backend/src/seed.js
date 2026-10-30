import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import User from "./models/User.js";
import Team from "./models/Team.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import Comment from "./models/Comment.js";
import Notification from "./models/Notification.js";
import ActivityLog from "./models/ActivityLog.js";

const passwordHash = await bcrypt.hash("TeamFlow123!", 12);
await connectDatabase();
await Promise.all([
  User.deleteMany({}),
  Team.deleteMany({}),
  Project.deleteMany({}),
  Task.deleteMany({}),
  Comment.deleteMany({}),
  Notification.deleteMany({}),
  ActivityLog.deleteMany({}),
]);

const [owner, admin, member, teamLead] = await User.create([
  {
    name: "Arun Mehta",
    email: "owner@teamflow.demo",
    passwordHash,
    role: "OWNER",
  },
  { name: "Priya Nair", email: "admin@teamflow.demo", passwordHash },
  { name: "Kumar Das", email: "member@teamflow.demo", passwordHash },
  { name: "Maya Chen", email: "lead@teamflow.demo", passwordHash },
]);
const team = await Team.create({
  name: "TeamFlow Studio",
  description: "A focused product team workspace.",
  owner: owner._id,
  members: [
    { user: owner._id, role: "OWNER" },
    { user: admin._id, role: "ADMIN" },
    { user: member._id, role: "MEMBER" },
    { user: teamLead._id, role: "TEAM_LEAD" },
  ],
});
const [commerce, mobile] = await Project.create([
  {
    team: team._id,
    name: "E-commerce Platform",
    description: "A faster, clearer buying experience.",
    status: "ACTIVE",
    createdBy: owner._id,
    members: [owner._id, admin._id, member._id, teamLead._id],
  },
  {
    team: team._id,
    name: "Mobile App",
    description: "The next generation mobile experience.",
    status: "PLANNING",
    createdBy: owner._id,
    members: [owner._id, admin._id, teamLead._id],
    teamLeads: [teamLead._id],
  },
]);
const tasks = await Task.create([
  {
    project: commerce._id,
    title: "Map checkout edge cases",
    description: "Document the payment failure states.",
    status: "BACKLOG",
    priority: "LOW",
    createdBy: owner._id,
    assignee: member._id,
    position: 0,
    labels: ["Research"],
  },
  {
    project: commerce._id,
    title: "Create payment API",
    description: "Build the payment intent endpoint.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    createdBy: owner._id,
    assignee: admin._id,
    position: 0,
    labels: ["Engineering"],
  },
  {
    project: commerce._id,
    title: "Review auth flows",
    description: "Verify registration and recovery paths.",
    status: "REVIEW",
    priority: "HIGH",
    createdBy: admin._id,
    assignee: member._id,
    position: 0,
    labels: ["Engineering"],
  },
  {
    project: mobile._id,
    title: "Implement dashboard",
    description: "Add the first analytics view.",
    status: "TODO",
    priority: "MEDIUM",
    createdBy: owner._id,
    assignee: admin._id,
    position: 0,
    labels: ["Product"],
  },
]);
await Comment.create({
  task: tasks[1]._id,
  user: member._id,
  content: "I can help verify the failure states once the endpoint is ready.",
});
await Notification.create({
  user: member._id,
  type: "TASK_ASSIGNED",
  title: "Task assigned",
  message: "You were assigned Map checkout edge cases.",
  entityId: tasks[0]._id,
});
await ActivityLog.create([
  {
    user: owner._id,
    team: team._id,
    project: commerce._id,
    action: "created project",
    metadata: { name: commerce.name },
  },
  {
    user: owner._id,
    team: team._id,
    project: commerce._id,
    task: tasks[1]._id,
    action: "created task",
    metadata: { title: tasks[1].title },
  },
  {
    user: admin._id,
    team: team._id,
    project: commerce._id,
    task: tasks[2]._id,
    action: "moved task",
    metadata: { to: "REVIEW" },
  },
]);
console.log("Seed complete");
console.log(
  "Demo accounts: owner@teamflow.demo, admin@teamflow.demo, member@teamflow.demo, lead@teamflow.demo",
);
await mongoose.disconnect();
