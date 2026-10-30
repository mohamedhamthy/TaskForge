import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, validate } from "../middleware/validate.js";

const router = Router();
const password = z
  .string()
  .min(8)
  .max(100)
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");
const registration = z
  .object({
    name: z.string().trim().min(1, "Full name is required").max(80),
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((email) => email.toLowerCase()),
    password,
    confirmPassword: z.string().min(1, "Confirm your password").max(100),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
const credentials = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .email()
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(100),
});
const passwordChange = z
  .object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(8).max(100),
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    path: ["newPassword"],
    message: "New password must differ from the current password",
  });
const tokenFor = (user) =>
  jwt.sign(
    { userId: user._id.toString(), tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
});

router.post(
  "/register",
  validate(registration),
  asyncHandler(async (req, res) => {
    const exists = await User.findOne({ email: req.body.email });
    if (exists)
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered" });
    const firstAccount = !(await User.exists({}));
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    let user;
    try {
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        role: firstAccount ? "OWNER" : "MEMBER",
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      if (error.keyPattern?.role && firstAccount) {
        try {
          user = await User.create({
            name: req.body.name,
            email: req.body.email,
            passwordHash,
            role: "MEMBER",
          });
        } catch (retryError) {
          if (retryError.code === 11000 && retryError.keyPattern?.email)
            return res
              .status(409)
              .json({ success: false, message: "Email is already registered" });
          throw retryError;
        }
      } else if (error.keyPattern?.email) {
        return res
          .status(409)
          .json({ success: false, message: "Email is already registered" });
      } else {
        throw error;
      }
    }
    res.status(201).json({
      success: true,
      message: "Registration successful. You can now sign in.",
      data: { user: safeUser(user), token: tokenFor(user) },
    });
  }),
);

router.post(
  "/login",
  validate(credentials),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email }).select(
      "+passwordHash",
    );
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      return res
        .status(401)
        .json({ success: false, message: "Incorrect email or password" });
    res.json({
      success: true,
      data: { user: safeUser(user), token: tokenFor(user) },
    });
  }),
);

router.post(
  "/change-password",
  requireAuth,
  validate(passwordChange),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (
      !user ||
      !(await bcrypt.compare(req.body.currentPassword, user.passwordHash))
    )
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    user.mustChangePassword = false;
    user.tokenVersion += 1;
    await user.save();
    res.json({
      success: true,
      data: { user: safeUser(user), token: tokenFor(user) },
    });
  }),
);

router.get("/me", requireAuth, (req, res) =>
  res.json({ success: true, data: { user: safeUser(req.user) } }),
);
router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    res.status(204).send();
  }),
);
export default router;
