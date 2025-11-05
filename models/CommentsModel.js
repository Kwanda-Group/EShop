import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  product: { type: mongoose.Types.ObjectId, ref: "Products", required: true },
  user: { type: mongoose.Types.ObjectId, ref: "Users", required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const CommentModel = mongoose.model("Comments", CommentSchema);
export default CommentModel;
