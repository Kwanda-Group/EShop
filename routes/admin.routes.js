import express from "express";
import { createAdmin, adminLogin, updateAdmin, updateAdminPassword } from "../controllers/admin.controller.js";
import { adminProtect, developerOnly } from "../middlewares/adminAuth.js";

const router = express.Router();

// Developer creates admin
router.post("/create", adminProtect, developerOnly, createAdmin);

// Login for admins
router.post("/login", adminLogin);

// Update admin info
router.put("/update", adminProtect, updateAdmin);

// Update admin password
router.put("/update-password", adminProtect, updateAdminPassword);

export default router;
