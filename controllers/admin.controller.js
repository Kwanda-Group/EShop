import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminModel from "../models/AdminModel";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "super_secret_admin_key";

// Create Admin (Developer only)
export const createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const exists = await AdminModel.findOne({ email });
    if (exists) return res.status(409).json({ message: "Admin email already exists." });

    const hash = await bcrypt.hash(password, 10);
    const admin = await AdminModel.create({
      name, email, phone, password: hash, role: role || "admin"
    });

    res.status(201).json({ message: "Admin created", admin: { name, email, role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error creating admin" });
  }
};

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminModel.findOne({ email }).select("+password");
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({ 
      token, 
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Admin Profile
export const updateAdmin = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.phone) updates.phone = req.body.phone;

    const admin = await AdminModel.findByIdAndUpdate(req.adminId, updates, { new: true });
    res.json({ admin });
  } catch {
    res.status(500).json({ message: "Error updating admin" });
  }
};

// Update Admin Password
export const updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await AdminModel.findById(req.adminId).select("+password");
    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) return res.status(401).json({ message: "Wrong current password." });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: "Password updated" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
