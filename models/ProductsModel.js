import mongoose from 'mongoose';


const ProductSchema = new mongoose.Schema({
type: { type: String, enum: ['Laptop', 'Electronic'], required: true },
name: { type: String, required: true },
brand: { type: String, required: true },
videoUrl: { type: String, required: true },
quantity: { type: Number, required: true, min: 0 },
addedAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now }
});


ProductSchema.pre('save', function (next) {
this.updatedAt = Date.now();
next();
});


const ProductsModel = mongoose.model('Products', ProductSchema);
export default ProductsModel;
