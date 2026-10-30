import { Router } from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/validate.js";

const router = Router();
router.use(requireAuth);
router.get(
  "/",
  asyncHandler(async (req, res) =>
    res.json({
      success: true,
      data: await Notification.find({ user: req.user._id })
        .sort("-createdAt")
        .limit(50),
    }),
  ),
);
router.patch(
  "/:notificationId/read",
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user._id },
      { isRead: true },
      { new: true },
    );
    if (!notification)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    res.json({ success: true, data: notification });
  }),
);
router.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true },
    );
    res.json({ success: true });
  }),
);
export default router;
