import { Router } from "express";
import { z } from "zod";
import Task from "../models/Task.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, validate } from "../middleware/validate.js";
import { loadProjectAccess } from "../middleware/membership.js";

const router = Router();
const taskInput = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(5000).optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignee: z.string().nullable().optional(),
  labels: z.array(z.string().max(30)).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  position: z.number().min(0).optional(),
});
router.use(requireAuth);
router.get(
  "/project/:projectId",
  loadProjectAccess,
  asyncHandler(async (req, res) => {
    const filter = { project: req.project._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.search) filter.$text = { $search: req.query.search };
    const tasks = await Task.find(filter)
      .populate("assignee createdBy", "name email avatar")
      .sort({ status: 1, position: 1 });
    res.json({ success: true, data: tasks });
  }),
);
router.get(
  "/:taskId",
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    req.task = task;
    next();
  }),
  loadProjectAccess,
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      data: await req.task.populate("assignee createdBy", "name email avatar"),
    }),
  ),
);
router.post(
  "/project/:projectId",
  loadProjectAccess,
  validate(
    taskInput.pick({
      title: true,
      description: true,
      priority: true,
      assignee: true,
      labels: true,
      dueDate: true,
      position: true,
    }),
  ),
  asyncHandler(async (req, res) => {
    if (req.body.assignee && !["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only owners and admins can assign tasks",
      });
    if (
      req.body.assignee &&
      !req.team.members.some(
        (member) => member.user.toString() === req.body.assignee,
      )
    )
      return res.status(422).json({
        success: false,
        message: "Assignee must be a member of the team",
      });
    const task = await Task.create({
      ...req.body,
      project: req.project._id,
      createdBy: req.user._id,
    });
    await ActivityLog.create({
      user: req.user._id,
      team: req.team._id,
      project: req.project._id,
      task: task._id,
      action: "created task",
    });
    if (task.assignee) {
      const notification = await Notification.create({
        user: task.assignee,
        type: "TASK_ASSIGNED",
        title: "Task assigned",
        message: `${req.user.name} assigned you ${task.title}.`,
        entityId: task._id,
      });
      req.app
        .get("io")
        ?.to(`user:${task.assignee}`)
        .emit("notification.created", notification);
    }
    res.status(201).json({
      success: true,
      data: await task.populate("assignee createdBy", "name email avatar"),
    });
  }),
);
router.patch(
  "/:taskId",
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    req.task = task;
    next();
  }),
  loadProjectAccess,
  validate(taskInput.partial()),
  asyncHandler(async (req, res) => {
    const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(req.membership.role);
    const isTaskParticipant = [req.task.createdBy, req.task.assignee].some(
      (id) => id && id.toString() === req.user._id.toString(),
    );
    if (!isOwnerOrAdmin && !isTaskParticipant)
      return res.status(403).json({
        success: false,
        message: "You can only update tasks you created or are assigned to",
      });
    if (req.body.assignee !== undefined && !isOwnerOrAdmin)
      return res.status(403).json({
        success: false,
        message: "Only owners and admins can assign tasks",
      });
    if (
      req.body.assignee &&
      !req.team.members.some(
        (member) => member.user.toString() === req.body.assignee,
      )
    )
      return res.status(422).json({
        success: false,
        message: "Assignee must be a member of the team",
      });
    if (
      !isOwnerOrAdmin &&
      Object.keys(req.body).some((key) => !["status"].includes(key))
    )
      return res.status(403).json({
        success: false,
        message: "Members can only change task status",
      });
    const previousAssignee = req.task.assignee?.toString();
    Object.assign(req.task, req.body);
    await req.task.save();
    await ActivityLog.create({
      user: req.user._id,
      team: req.team._id,
      project: req.project._id,
      task: req.task._id,
      action: "updated task",
      metadata: req.body,
    });
    if (
      req.task.assignee &&
      req.task.assignee.toString() !== previousAssignee
    ) {
      const notification = await Notification.create({
        user: req.task.assignee,
        type: "TASK_ASSIGNED",
        title: "Task assigned",
        message: `${req.user.name} assigned you ${req.task.title}.`,
        entityId: req.task._id,
      });
      req.app
        .get("io")
        ?.to(`user:${req.task.assignee}`)
        .emit("notification.created", notification);
    }
    res.json({
      success: true,
      data: await req.task.populate("assignee createdBy", "name email avatar"),
    });
  }),
);
router.delete(
  "/:taskId",
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    req.task = task;
    next();
  }),
  loadProjectAccess,
  asyncHandler(async (req, res) => {
    if (!["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only owners and admins can delete tasks",
      });
    await req.task.deleteOne();
    res.status(204).send();
  }),
);
router.patch(
  "/:taskId/move",
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    req.task = task;
    next();
  }),
  loadProjectAccess,
  validate(
    z.object({ status: taskInput.shape.status, position: z.number().min(0) }),
  ),
  asyncHandler(async (req, res) => {
    const isAllowed =
      ["OWNER", "ADMIN"].includes(req.membership.role) ||
      [req.task.createdBy, req.task.assignee].some(
        (id) => id && id.toString() === req.user._id.toString(),
      );
    if (!isAllowed)
      return res
        .status(403)
        .json({ success: false, message: "You cannot move this task" });
    const previousStatus = req.task.status;
    Object.assign(req.task, req.body);
    await req.task.save();
    await ActivityLog.create({
      user: req.user._id,
      team: req.team._id,
      project: req.project._id,
      task: req.task._id,
      action: "moved task",
      metadata: {
        from: previousStatus,
        to: req.body.status,
        position: req.body.position,
      },
    });
    req.app
      .get("io")
      ?.to(`project:${req.project._id}`)
      .emit("task.moved", req.task);
    res.json({ success: true, data: req.task });
  }),
);
router.post(
  "/:taskId/submit-review",
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    req.task = task;
    next();
  }),
  loadProjectAccess,
  asyncHandler(async (req, res) => {
    if (req.task.assignee?.toString() !== req.user._id.toString())
      return res.status(403).json({
        success: false,
        message: "Only the assignee can submit this task for review",
      });
    if (req.task.status !== "REVIEW")
      return res.status(422).json({
        success: false,
        message: "Move the task to Review before submitting it",
      });
    req.task.reviewSubmittedAt = new Date();
    await req.task.save();
    await ActivityLog.create({
      user: req.user._id,
      team: req.team._id,
      project: req.project._id,
      task: req.task._id,
      action: "submitted task for review",
    });
    const projectLeads = req.project.teamLeads.map((member) =>
      member.toString(),
    );
    const reviewers = req.team.members.filter(
      (member) =>
        (["OWNER"].includes(member.role) ||
          projectLeads.includes(member.user.toString())) &&
        member.user.toString() !== req.user._id.toString(),
    );
    const notifications = await Notification.insertMany(
      reviewers.map((member) => ({
        user: member.user,
        type: "TASK_READY_FOR_REVIEW",
        title: "Task ready for review",
        message: `${req.user.name} submitted ${req.task.title} for review.`,
        entityId: req.task._id,
      })),
    );
    notifications.forEach((notification) =>
      req.app
        .get("io")
        ?.to(`user:${notification.user}`)
        .emit("notification.created", notification),
    );
    res.json({ success: true, data: req.task });
  }),
);
router.post(
  "/:taskId/request-changes",
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    req.task = task;
    next();
  }),
  loadProjectAccess,
  validate(z.object({ feedback: z.string().trim().min(2).max(3000) })),
  asyncHandler(async (req, res) => {
    const isProjectLead = req.project.teamLeads.some(
      (member) => member.toString() === req.user._id.toString(),
    );
    if (!isProjectLead && !["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only a project team leader can request changes",
      });
    req.task.status = "IN_PROGRESS";
    req.task.reviewFeedback = req.body.feedback;
    req.task.reviewedBy = req.user._id;
    req.task.reviewedAt = new Date();
    await req.task.save();
    await ActivityLog.create({
      user: req.user._id,
      team: req.team._id,
      project: req.project._id,
      task: req.task._id,
      action: "requested changes",
      metadata: { feedback: req.body.feedback },
    });
    if (req.task.assignee) {
      const notification = await Notification.create({
        user: req.task.assignee,
        type: "TASK_CHANGES_REQUESTED",
        title: "Changes requested",
        message: `${req.user.name} requested changes on ${req.task.title}.`,
        entityId: req.task._id,
      });
      req.app
        .get("io")
        ?.to(`user:${req.task.assignee}`)
        .emit("notification.created", notification);
    }
    res.json({ success: true, data: req.task });
  }),
);
router.post(
  "/:taskId/approve-complete",
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    req.task = task;
    next();
  }),
  loadProjectAccess,
  validate(z.object({ feedback: z.string().trim().max(3000).optional() })),
  asyncHandler(async (req, res) => {
    const isProjectLead = req.project.teamLeads.some(
      (member) => member.toString() === req.user._id.toString(),
    );
    if (!isProjectLead && !["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only a project team leader can approve tasks",
      });
    req.task.status = "DONE";
    req.task.reviewFeedback = req.body.feedback || req.task.reviewFeedback;
    req.task.reviewedBy = req.user._id;
    req.task.reviewedAt = new Date();
    await req.task.save();
    await ActivityLog.create({
      user: req.user._id,
      team: req.team._id,
      project: req.project._id,
      task: req.task._id,
      action: "approved task and marked it complete",
    });
    if (req.task.assignee) {
      const notification = await Notification.create({
        user: req.task.assignee,
        type: "TASK_APPROVED",
        title: "Task approved",
        message: `${req.user.name} approved ${req.task.title}.`,
        entityId: req.task._id,
      });
      req.app
        .get("io")
        ?.to(`user:${req.task.assignee}`)
        .emit("notification.created", notification);
    }
    res.json({ success: true, data: req.task });
  }),
);
export default router;
