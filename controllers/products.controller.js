// controllers/productController.js
import ProductsModel from '../models/ProductsModel.js';
import mongoose from 'mongoose';
import { getGridFSBucket } from '../config/db.js';


export const uploadVideoHandler = async (req, res, next) => {
// Endpoint used with multer GridFS storage middleware
try {
if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
const fileId = req.file.id.toString();
const streamUrl = `/videos/${fileId}/stream`;
return res.status(201).json({ fileId, filename: req.file.filename, streamUrl });
} catch (err) {
next(err);
}
};


export const createProduct = async (req, res, next) => {
try {
const { type, name, brand, quantity, videoFileId } = req.body;
if (!videoFileId) return res.status(400).json({ error: 'videoFileId is required' });
const videoUrl = `/videos/${videoFileId}/stream`;
const product = await ProductsModel.create({ type, name, brand, quantity, videoUrl });
res.status(201).json(product);
} catch (err) {
next(err);
}
};


export const listProducts = async (req, res, next) => {
try {
const page = Math.max(1, parseInt(req.query.page || '1', 10));
const limit = Math.max(1, parseInt(req.query.limit || '20', 10));
const skip = (page - 1) * limit;
const products = await ProductsModel.find().skip(skip).limit(limit).lean();
res.json(products);
} catch (err) {
next(err);
}
};


export const getProduct = async (req, res, next) => {
try {
const product = await ProductsModel.findById(req.params.id).lean();
if (!product) return res.status(404).json({ error: 'Product not found' });
res.json(product);
} catch (err) {
next(err);
}
};

export const searchProducts = async (req, res, next) => {
try {
const { q } = req.query;
if (!q || q.trim() === '') {
return res.status(400).json({ error: 'Search query is required' });
}
const regex = new RegExp(q, 'i'); // case-insensitive search
const products = await ProductsModel.find({ name: { $regex: regex } }).lean();
res.json(products);
} catch (err) {
next(err);
}
};


async function deleteGridFileIfPattern(videoUrl) {
if (!videoUrl) return;
const m = videoUrl.match(/\/videos\/([0-9a-fA-F]{24})\/stream/);
if (!m) return;
const id = new mongoose.Types.ObjectId(m[1]);
try {
const bucket = getGridFSBucket();
await bucket.delete(id);
} catch (err) {
// ignore not found
console.warn('Could not delete old gridfs file', err.message);
}
}
