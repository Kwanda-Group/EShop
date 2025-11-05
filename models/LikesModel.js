import mongoose from "mongoose";

const LikesSchema = new mongoose.Schema({
  product: { type: mongoose.Types.ObjectId, ref: "Products", required: true },
  user: { type: mongoose.Types.ObjectId, ref: "Users", required: true },
  addedAt: { type: Date, default: Date.now }
});

// Prevent duplicate likes by same user on same product
LikesSchema.index({product:1 , user: 1} , {unique:true})

const LikesModel = mongoose.model("Likes", LikesSchema);
export default LikesModel;
