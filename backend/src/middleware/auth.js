import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.userId).select(
      "_id name email avatar role tokenVersion mustChangePassword",
    );
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    if (payload.tokenVersion !== req.user.tokenVersion)
      return res
        .status(401)
        .json({ success: false, message: "Token has been revoked" });
    const passwordChangeRoutes = ["/me", "/logout", "/change-password"];
    if (
      req.user.mustChangePassword &&
      (req.baseUrl !== "/api/auth" || !passwordChangeRoutes.includes(req.path))
    ) {
      return res.status(403).json({
        success: false,
        message: "You must change your password before continuing",
        code: "PASSWORD_CHANGE_REQUIRED",
      });
    }
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.membership?.role))
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    next();
  };
}
