// controllers/orderController.js
import OrdersModel from '../models/Order.js';
import ProductsModel from '../models/Product.js';
import mongoose from 'mongoose';

/**
 * Create an order:
 * - Validates required fields
 * - Atomically decrements the product.quantity using findOneAndUpdate with a >= condition
 * - If decrement succeeds, creates the order document
 * - If order creation fails, attempts to revert the decrement
 */
export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { product: productId, user, userPhone, conditions, quantity, deliveryTime } = req.body;

    if (!productId || !user || !userPhone || !quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'product, user, userPhone and quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    // Atomically decrement product quantity only if enough stock exists.
    // Use a transaction (requires replica set) for stronger guarantees.
    // If your MongoDB deployment does not support transactions, fallback to findOneAndUpdate pattern outside a session.
    const product = await ProductsModel.findOneAndUpdate(
      { _id: productId, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true, session }
    );

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Insufficient stock or product not found' });
    }

    const orderPayload = {
      product: productId,
      user,
      userPhone,
      conditions,
      quantity: qty,
      deliveryTime
    };

    const order = await OrdersModel.create([orderPayload], { session });

    await session.commitTransaction();
    session.endSession();

    // order is returned as an array because create([...], {session}) returns array
    return res.status(201).json(order[0]);
  } catch (err) {
    // If transaction fails / error, try to abort and do best-effort revert if needed
    try {
      await session.abortTransaction();
    } catch (e) {
      // ignore
    }
    session.endSession();
    // If we decremented but order creation failed outside transaction, try to revert stock.
    // (The above transaction flow should avoid that, but keep this as safety.)
    if (req.body && req.body.product && req.body.quantity) {
      try {
        await ProductsModel.findByIdAndUpdate(req.body.product, { $inc: { quantity: parseInt(req.body.quantity, 10) } });
      } catch (revertErr) {
        console.error('Failed to revert product quantity after order failure:', revertErr);
      }
    }
    next(err);
  }
};

/**
 * Get a single order by id (populates product and user)
 */
export const getOrder = async (req, res, next) => {
  try {
    const order = await OrdersModel.findById(req.params.id).populate('product user').lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all orders (admin / listing)
 * Supports:
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.user && mongoose.Types.ObjectId.isValid(req.query.user)) filter.user = req.query.user;
    if (req.query.product && mongoose.Types.ObjectId.isValid(req.query.product)) filter.product = req.query.product;

    const [orders, total] = await Promise.all([
      OrdersModel.find(filter).populate('product user').skip(skip).limit(limit).sort({ orderedAt: -1 }).lean(),
      OrdersModel.countDocuments(filter)
    ]);

    res.json({
      data: orders,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Decide (confirm/reject) an order
 * - action: 'confirm' | 'reject'
 * - message: admin message saved to adminMessage
 *
 */
export const decideOrder = async (req, res, next) => {
  try {
    const { action, message } = req.body;
    if (!['confirm', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

    const order = await OrdersModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Optionally: only allow decision changes from certain statuses.
    if (action === 'confirm') order.status = 'confirmed';
    else order.status = 'cancelled';

    if (message) order.adminMessage = message;
    await order.save();

    // OPTIONAL: if you want to restock when an order is rejected and it was previously pending,

    if (action === 'reject' && order.statusBefore === 'pending') {
      try {
        await ProductsModel.findByIdAndUpdate(order.product, { $inc: { quantity: order.quantity } });
      } catch (err) {
        console.error('Failed to restock product after rejection:', err);
      }
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

export default {
  createOrder,
  getOrder,
  getAllOrders,
  decideOrder
};
