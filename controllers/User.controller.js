// controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js"; // adjust path
import { hidePassword } from "../utils/response.js";

const JWT_SECRET = process.env.JWT_SECRET ;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ;
const SALT_ROUNDS = 10;

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const existing = await UserModel.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use." });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserModel.create({ name, email, phone, password: hashed });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(201).json({ token, user: hidePassword(user) });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing email or password." });

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ token, user: hidePassword(user) });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware
    const { name, email, phone } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    if (email) {
      // if email changed, ensure unique
      const other = await UserModel.findOne({ email, _id: { $ne: userId } });
      if (other) return res.status(409).json({ message: "Email already in use by another account." });
      updates.email = email;
    }

    const updated = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
    if (!updated) return res.status(404).json({ message: "User not found." });

    return res.json({ user: hidePassword(updated) });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "newPassword must be at least 8 characters." });
    }

    const user = await UserModel.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found." });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: "Current password incorrect." });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("updatePassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
