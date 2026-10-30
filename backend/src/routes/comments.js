import { Router } from "express";
import { z } from "zod";
import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import ActivityLog from "../models/ActivityLog.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, validate } from "../middleware/validate.js";
import { loadProjectAccess } from "../middleware/membership.js";

const router = Router();
router.use(requireAuth);
router.get(
  "/task/:taskId",
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    req.params.projectId = task.project.toString();
    await new Promise((resolve, reject) =>
      loadProjectAccess(req, res, (error) =>
        error ? reject(error) : resolve(),
      ),
    );
    res.json({
      success: true,
      data: await Comment.find({ task: task._id })
        .populate("user", "name avatar")
        .sort("createdAt"),
    });
  }),
);
router.post(
  "/task/:taskId",
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
  validate(z.object({ content: z.string().trim().min(1).max(2000) })),
  asyncHandler(async (req, res) => {
    const comment = await Comment.create({
      task: req.task._id,
      user: req.user._id,
      content: req.body.content,
    });
    await ActivityLog.create({
      user: req.user._id,
      team: req.team._id,
      project: req.project._id,
      task: req.task._id,
      action: "added a comment",
    });
    const populated = await comment.populate("user", "name avatar");
    req.app
      .get("io")
      ?.to(`project:${req.project._id}`)
      .emit("comment.created", populated);
    res.status(201).json({ success: true, data: populated });
  }),
);
router.patch(
  "/:commentId",
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    if (comment.user.toString() !== req.user._id.toString())
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    comment.content = req.body.content;
    await comment.save();
    res.json({
      success: true,
      data: await comment.populate("user", "name avatar"),
    });
  }),
);
router.delete(
  "/:commentId",
  asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    if (comment.user.toString() !== req.user._id.toString())
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    await comment.deleteOne();
    res.status(204).send();
  }),
);
export default router;
