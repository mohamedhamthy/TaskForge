import Team from "../models/Team.js";
import Project from "../models/Project.js";

export const loadTeamMembership = async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);
  if (!team)
    return res.status(404).json({ success: false, message: "Team not found" });
  const membership = team.members.find(
    (member) => member.user.toString() === req.user._id.toString(),
  );
  if (!membership)
    return res
      .status(403)
      .json({ success: false, message: "You are not a member of this team" });
  req.team = team;
  req.membership = membership;
  next();
};

export const loadProjectAccess = async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found" });
  const team = await Team.findById(project.team);
  const membership = team?.members.find(
    (member) => member.user.toString() === req.user._id.toString(),
  );
  if (!membership)
    return res
      .status(403)
      .json({ success: false, message: "You cannot access this project" });
  req.project = project;
  req.team = team;
  req.membership = membership;
  next();
};
