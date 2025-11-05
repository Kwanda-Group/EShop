import express from "express";
import {
  addComment,
  getCommentsByProduct,
  toggleLike,
  removeLike,
  getLikesByProduct
} from "../controllers/interactions.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Comments
router.post("/products/:productId/comments", protect, addComment);
router.get("/products/:productId/comments", getCommentsByProduct);

// Likes
// toggle like (POST). If user already liked => it will remove and return liked: false
router.post("/products/:productId/likes", protect, toggleLike);
// explicit delete like
router.delete("/products/:productId/likes", protect, removeLike);
// view likes
router.get("/products/:productId/likes", getLikesByProduct);

export default router;
