import mongoose from 'mongoose';


const OrdersSchema = new mongoose.Schema({
product: { type: mongoose.Types.ObjectId, ref: 'Products', required: true },
user: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
userPhone: { type: String, required: true },
conditions: { type: String },
quantity: { type: Number, required: true, min: 1 },
orderedAt: { type: Date, default: Date.now },
deliveryTime: { type: Date },
status: { type: String, enum: ['pending','confirmed','shipped','delivered','cancelled'], default: 'pending' },
adminMessage: { type: String }
});


const OrdersModel = mongoose.model('Orders', OrdersSchema);
export default OrdersModel;
