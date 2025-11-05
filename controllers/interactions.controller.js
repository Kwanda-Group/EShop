// controllers/interactions.controller.js
import CommentModel from "../models/CommentsModel.js";
import LikesModel from "../models/LikesModel.js";
import ProductsModel from "../models/ProductsModel.js"; // adjust path/name if different
import UserModel from "../models/UsersModel.js"; // adjust path if needed

// Add comment
export const addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ message: "Comment text required." });

    // optional: check product exists
    const product = await ProductsModel.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const comment = await CommentModel.create({
      product: productId,
      user: userId,
      text: text.trim()
    });

    // populate user basic fields
    await comment.populate({ path: "user", select: "name email phone" }).execPopulate?.() ;
    // execPopulate is for older mongoose, but populate returns a promise in newer versions:
    await comment.populate({ path: "user", select: "name email phone" });

    return res.status(201).json({ comment });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Get comments for a product (paginated optional)
export const getCommentsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      CommentModel.find({ product: productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "name email phone" })
        .lean(),
      CommentModel.countDocuments({ product: productId })
    ]);

    return res.json({ total, page, limit, comments });
  } catch (err) {
    console.error("getCommentsByProduct error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Toggle like: if exists -> remove (unlike), else -> create like
export const toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const product = await ProductsModel.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    // check if like exists
    const existing = await LikesModel.findOne({ product: productId, user: userId });
    if (existing) {
      await existing.remove();
      const count = await LikesModel.countDocuments({ product: productId });
      return res.json({ liked: false, totalLikes: count });
    }

    // get user's phone (or accept from request body)
    const user = await UserModel.findById(userId).select("phone");
    const userPhone = (req.body.userPhone && req.body.userPhone.toString()) || (user ? user.phone : "");

    const like = await LikesModel.create({
      product: productId,
      user: userId,
      userPhone
    });

    const totalLikes = await LikesModel.countDocuments({ product: productId });
    return res.status(201).json({ liked: true, totalLikes, like });
  } catch (err) {
    // handle duplicate key (should rarely happen because we check first)
    if (err.code === 11000) {
      const totalLikes = await LikesModel.countDocuments({ product: req.params.productId });
      return res.status(200).json({ liked: true, totalLikes });
    }
    console.error("toggleLike error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Explicitly remove a like (useful if you want DELETE semantics)
export const removeLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    const existing = await LikesModel.findOne({ product: productId, user: userId });
    if (!existing) return res.status(404).json({ message: "Like not found." });

    await existing.remove();
    const totalLikes = await LikesModel.countDocuments({ product: productId });
    return res.json({ removed: true, totalLikes });
  } catch (err) {
    console.error("removeLike error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Get likes (list + count). Returns small list of users who liked (paginated).
export const getLikesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      LikesModel.find({ product: productId })
        .sort({ addedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "user", select: "name email phone" })
        .lean(),
      LikesModel.countDocuments({ product: productId })
    ]);

    return res.json({ total, page, limit, likes });
  } catch (err) {
    console.error("getLikesByProduct error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
