// routes/productRoutes.js
import express from 'express';
import * as productCtrl from '../controllers/productController.js';
import { createGridFsUpload } from '../uploads/gridfs.js';
import { getGridFSBucket } from '../config/db.js';
import { adminProtect } from '../middlewares/adminAuth.js';


const router = express.Router();


// multer instance (uses MONGO_URI from process.env)
const upload = createGridFsUpload(process.env.MONGO_URI);


// upload video (multipart/form-data -> field `video`)
router.post('/upload/video', upload.single('video'), productCtrl.uploadVideoHandler);


// product CRUD
router.post('/',adminProtect , productCtrl.createProduct);
router.get('/', productCtrl.listProducts);
router.get('/search',productCtrl.searchProducts);
router.get('/:id', productCtrl.getProduct);
router.put('/:id',adminProtect , productCtrl.updateProduct);
router.delete('/:id',adminProtect , productCtrl.deleteProduct);


export default router;