import { Router } from "express";
import ActivityLog from "../models/ActivityLog.js";
import Task from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/validate.js";
import { loadProjectAccess } from "../middleware/membership.js";

const router = Router();
router.use(requireAuth);
router.get(
  "/project/:projectId",
  loadProjectAccess,
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = { project: req.project._id };
    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate("user", "name avatar")
        .sort("-createdAt")
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }),
);
router.get(
  "/task/:taskId",
  asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    next();
  }),
  loadProjectAccess,
  asyncHandler(async (req, res) => {
    const activities = await ActivityLog.find({ task: req.params.taskId })
      .populate("user", "name avatar")
      .sort("-createdAt")
      .limit(50);
    res.json({ success: true, data: activities });
  }),
);
export default router;
