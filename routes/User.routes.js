import express from "express";
import { register , login , updatePassword , updateProfile } from "../controllers/User.controller";
import { protect } from "../middlewares/auth.middleware";
const router = express.Router();



// handle user registration
router.post("/register" , register);
//handle user login
router.post("/login" , login);
//handle updating profile
router.put("/profile" ,protect , updateProfile);
//handle update password
router.put("/user-password", protect , updatePassword);


export default router