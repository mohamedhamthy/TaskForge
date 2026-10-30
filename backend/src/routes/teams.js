import { Router } from "express";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import Team from "../models/Team.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, validate } from "../middleware/validate.js";
import { loadTeamMembership } from "../middleware/membership.js";

const router = Router();
const teamInput = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const teams = await Team.find({ "members.user": req.user._id }).populate(
      "members.user",
      "name email avatar",
    );
    res.json({ success: true, data: teams });
  }),
);
router.post(
  "/",
  validate(teamInput),
  asyncHandler(async (req, res) => {
    const isExistingTeamOwner = await Team.exists({ owner: req.user._id });
    if (req.user.role !== "OWNER" && !isExistingTeamOwner)
      return res.status(403).json({
        success: false,
        message: "Only the account owner can create a workspace",
      });
    const team = await Team.create({
      ...req.body,
      owner: req.user._id,
      members: [{ user: req.user._id, role: "OWNER" }],
    });
    await ActivityLog.create({
      user: req.user._id,
      team: team._id,
      action: "created team",
    });
    res.status(201).json({ success: true, data: team });
  }),
);
router.get(
  "/:teamId",
  loadTeamMembership,
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      data: await req.team.populate("members.user", "name email avatar"),
    }),
  ),
);
router.patch(
  "/:teamId",
  loadTeamMembership,
  validate(teamInput.partial()),
  asyncHandler(async (req, res) => {
    if (req.membership.role !== "OWNER")
      return res.status(403).json({
        success: false,
        message: "Only the team owner can update the team",
      });
    Object.assign(req.team, req.body);
    await req.team.save();
    res.json({ success: true, data: req.team });
  }),
);
router.delete(
  "/:teamId",
  loadTeamMembership,
  asyncHandler(async (req, res) => {
    if (req.membership.role !== "OWNER")
      return res.status(403).json({
        success: false,
        message: "Only the team owner can delete the team",
      });
    await req.team.deleteOne();
    res.status(204).send();
  }),
);
router.get(
  "/:teamId/members",
  loadTeamMembership,
  asyncHandler(async (req, res) => {
    await req.team.populate("members.user", "name email avatar");
    res.json({ success: true, data: req.team.members });
  }),
);
router.post(
  "/:teamId/members",
  loadTeamMembership,
  validate(
    z.object({
      name: z.string().trim().min(2).max(80).optional(),
      email: z.string().email(),
      password: z.string().min(8).max(100).optional(),
      role: z.enum(["ADMIN", "TEAM_LEAD", "MEMBER"]).default("MEMBER"),
    }),
  ),
  asyncHandler(async (req, res) => {
    if (!["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only owners and admins can manage members",
      });
    if (req.membership.role === "ADMIN" && req.body.role === "ADMIN")
      return res
        .status(403)
        .json({ success: false, message: "Only the owner can create admins" });
    let user = await User.findOne({ email: req.body.email });
    if (!user && (!req.body.name || !req.body.password))
      return res.status(422).json({
        success: false,
        message: "Name and password are required when creating an account",
      });
    if (!user)
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        passwordHash: await bcrypt.hash(req.body.password, 12),
      });
    const existingMember = req.team.members.find(
      (member) => member.user.toString() === user._id.toString(),
    );
    if (existingMember) {
      if (
        req.membership.role === "ADMIN" &&
        !["TEAM_LEAD", "MEMBER"].includes(req.body.role)
      )
        return res
          .status(409)
          .json({ success: false, message: "User is already a team member" });
      if (
        req.membership.role === "OWNER" &&
        !["ADMIN", "TEAM_LEAD", "MEMBER"].includes(req.body.role)
      )
        return res
          .status(409)
          .json({ success: false, message: "User is already a team member" });
      existingMember.role = req.body.role;
      await req.team.save();
      const notification = await Notification.create({
        user: user._id,
        type: "ROLE_CHANGED",
        title: "Promoted to admin",
        message: `${req.user.name} made you an admin of ${req.team.name}.`,
        entityId: req.team._id,
      });
      req.app
        .get("io")
        ?.to(`user:${user._id}`)
        .emit("notification.created", notification);
      await req.team.populate("members.user", "name email avatar");
      return res.status(200).json({ success: true, data: req.team.members });
    }
    req.team.members.push({ user: user._id, role: req.body.role });
    await req.team.save();
    const notification = await Notification.create({
      user: user._id,
      type: "TEAM_INVITATION",
      title: "Added to a team",
      message: `${req.user.name} added you to ${req.team.name}.`,
      entityId: req.team._id,
    });
    req.app
      .get("io")
      ?.to(`user:${user._id}`)
      .emit("notification.created", notification);
    res.status(201).json({
      success: true,
      data: await req.team.populate("members.user", "name email avatar"),
    });
  }),
);
router.post(
  "/:teamId/members/:userId/password-reset",
  loadTeamMembership,
  asyncHandler(async (req, res) => {
    if (!["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only owners and admins can reset member passwords",
      });
    const target = req.team.members.find(
      (member) => member.user.toString() === req.params.userId,
    );
    if (!target)
      return res
        .status(404)
        .json({ success: false, message: "Team member not found" });
    const targetId = target.user.toString();
    if (targetId === req.user._id.toString())
      return res.status(400).json({
        success: false,
        message: "Use account settings to change your own password",
      });
    if (
      req.membership.role === "ADMIN" &&
      (targetId === req.team.owner.toString() || target.role === "ADMIN")
    )
      return res.status(403).json({
        success: false,
        message: "Admins cannot reset owner or admin passwords",
      });
    const account = await User.findById(target.user);
    if (!account)
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    const temporaryPassword = randomBytes(18).toString("base64url");
    account.passwordHash = await bcrypt.hash(temporaryPassword, 12);
    account.mustChangePassword = true;
    account.tokenVersion += 1;
    await account.save();
    const notification = await Notification.create({
      user: account._id,
      type: "ACCOUNT_PASSWORD_RESET",
      title: "Password reset",
      message: `${req.user.name} reset your password. Change it the next time you sign in.`,
      entityId: req.team._id,
    });
    req.app
      .get("io")
      ?.to(`user:${account._id}`)
      .emit("notification.created", notification);
    res.json({
      success: true,
      data: { userId: account._id, temporaryPassword },
    });
  }),
);
router.patch(
  "/:teamId/members/:userId",
  loadTeamMembership,
  validate(z.object({ role: z.enum(["ADMIN", "TEAM_LEAD", "MEMBER"]) })),
  asyncHandler(async (req, res) => {
    if (
      req.membership.role !== "OWNER" &&
      !(
        req.membership.role === "ADMIN" &&
        ["TEAM_LEAD", "MEMBER"].includes(req.body.role)
      )
    )
      return res
        .status(403)
        .json({ success: false, message: "You cannot assign this team role" });
    const target = req.team.members.find(
      (member) => member.user.toString() === req.params.userId,
    );
    if (!target)
      return res
        .status(404)
        .json({ success: false, message: "Team member not found" });
    target.role = req.body.role;
    await req.team.save();
    const notification = await Notification.create({
      user: target.user,
      type: "ROLE_CHANGED",
      title: "Team role updated",
      message: `Your role in ${req.team.name} is now ${req.body.role}.`,
      entityId: req.team._id,
    });
    req.app
      .get("io")
      ?.to(`user:${target.user}`)
      .emit("notification.created", notification);
    res.json({ success: true, data: target });
  }),
);
router.delete(
  "/:teamId/members/:userId",
  loadTeamMembership,
  asyncHandler(async (req, res) => {
    if (!["OWNER", "ADMIN"].includes(req.membership.role))
      return res.status(403).json({
        success: false,
        message: "Only owners and admins can remove members",
      });
    if (req.params.userId === req.team.owner.toString())
      return res
        .status(400)
        .json({ success: false, message: "The team owner cannot be removed" });
    const before = req.team.members.length;
    req.team.members = req.team.members.filter(
      (member) => member.user.toString() !== req.params.userId,
    );
    if (req.team.members.length === before)
      return res
        .status(404)
        .json({ success: false, message: "Team member not found" });
    await req.team.save();
    res.status(204).send();
  }),
);
export default router;
