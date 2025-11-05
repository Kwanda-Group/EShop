import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  title: { type: String, default: "Admin" }, 
  role: { type: String, enum: ["developer", "admin"], default: "admin" },

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },

  password: { type: String, required: true, select: false },

  createdAt: { type: Date, default: Date.now }
});

const AdminModel = mongoose.model("Admin", AdminSchema);
export default AdminModel;
