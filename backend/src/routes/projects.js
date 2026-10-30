import { Router } from "express";
import { z } from "zod";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler, validate } from "../middleware/validate.js";
import {
  loadProjectAccess,
  loadTeamMembership,
} from "../middleware/membership.js";

const router = Router();
const projectInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  status: z
    .enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"])
    .optional(),
  dueDate: z.coerce.date().optional(),
});
router.use(requireAuth);
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const teamIds = await Team.find({ "members.user": req.user._id }).distinct(
      "_id",
    );
    const projects = await Project.find({ team: { $in: teamIds } })
      .populate("teamLeads", "name email avatar")
      .sort("-updatedAt");
    res.json({ success: true, data: projects });
  }),
);
router.post(
  "/",
  validate(z.object({ teamId: z.string(), ...projectInput.shape })),
  asyncHandler(async (req, res) => {
    req.params.teamId = req.body.teamId;
    await new Promise((resolve, reject) =>
      loadTeamMembership(req, res, (error) =>
        error ? reject(error) : resolve(),
      ),
    );
    if (req.membership.role !== "OWNER")
      return res.status(403).json({
        success: false,
        message: "Only the team owner can create projects",
      });
    const project = await Project.create({
      ...req.body,
      team: req.body.teamId,
      createdBy: req.user._id,
      members: [req.user._id],
    });
    await ActivityLog.create({
      user: req.user._id,
      team: req.team._id,
      project: project._id,
      action: "created project",
    });
    res.status(201).json({ success: true, data: project });
  }),
);
router.get(
  "/:projectId",
  loadProjectAccess,
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      data: await req.project.populate([
        { path: "members", select: "name email avatar" },
        { path: "teamLeads", select: "name email avatar" },
      ]),
    }),
  ),
);
router.patch(
  "/:projectId",
  loadProjectAccess,
  requireRole("OWNER", "ADMIN"),
  validate(projectInput.partial()),
  asyncHandler(async (req, res) => {
    Object.assign(req.project, req.body);
    await req.project.save();
    res.json({ success: true, data: req.project });
  }),
);
router.post(
  "/:projectId/members",
  loadProjectAccess,
  validate(
    z.object({
      email: z.string().email(),
      role: z.enum(["MEMBER", "TEAM_LEAD"]).default("MEMBER"),
    }),
  ),
  asyncHandler(async (req, res) => {
    if (!["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only owners and admins can invite project members",
      });
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User must be a team member before being invited",
      });
    if (
      !req.team.members.some(
        (member) => member.user.toString() === user._id.toString(),
      )
    )
      return res.status(403).json({
        success: false,
        message: "Project members must belong to the team",
      });
    const teamMember = req.team.members.find(
      (member) => member.user.toString() === user._id.toString(),
    );
    const isProjectMember = req.project.members.some(
      (member) => member.toString() === user._id.toString(),
    );
    const isProjectLead = req.project.teamLeads.some(
      (member) => member.toString() === user._id.toString(),
    );
    if (req.body.role === "TEAM_LEAD" && teamMember.role !== "TEAM_LEAD")
      return res.status(422).json({
        success: false,
        message: "Only team leaders can be assigned as project leads",
      });
    if (req.body.role === "TEAM_LEAD" && !isProjectLead)
      req.project.teamLeads.push(user._id);
    if (req.body.role === "MEMBER" && isProjectLead)
      req.project.teamLeads = req.project.teamLeads.filter(
        (member) => member.toString() !== user._id.toString(),
      );
    if (!isProjectMember) req.project.members.push(user._id);
    if (
      isProjectMember &&
      ((req.body.role === "TEAM_LEAD" && isProjectLead) ||
        (req.body.role === "MEMBER" && !isProjectLead))
    )
      return res.status(409).json({
        success: false,
        message: "User already has this project role",
      });
    await req.project.save();
    const notification = await Notification.create({
      user: user._id,
      type: "PROJECT_MEMBER_ADDED",
      title: "Project access updated",
      message: `${req.user.name} ${req.body.role === "TEAM_LEAD" ? "assigned you as project lead on" : "added you to"} ${req.project.name}.`,
      entityId: req.project._id,
    });
    req.app
      .get("io")
      ?.to(`user:${user._id}`)
      .emit("notification.created", notification);
    res.status(isProjectMember ? 200 : 201).json({
      success: true,
      data: await req.project.populate([
        { path: "members", select: "name email avatar" },
        { path: "teamLeads", select: "name email avatar" },
      ]),
    });
  }),
);
router.delete(
  "/:projectId/members/:userId",
  loadProjectAccess,
  asyncHandler(async (req, res) => {
    if (!["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only owners and admins can remove project members",
      });
    req.project.members = req.project.members.filter(
      (member) => member.toString() !== req.params.userId,
    );
    req.project.teamLeads = req.project.teamLeads.filter(
      (member) => member.toString() !== req.params.userId,
    );
    await req.project.save();
    res.status(204).send();
  }),
);
router.delete(
  "/:projectId",
  loadProjectAccess,
  asyncHandler(async (req, res) => {
    if (req.membership.role !== "OWNER")
      return res.status(403).json({
        success: false,
        message: "Only the team owner can delete projects",
      });
    await req.project.deleteOne();
    res.status(204).send();
  }),
);
export default router;
