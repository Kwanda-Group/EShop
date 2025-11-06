// routes/orderRoutes.js
import express from 'express';
import * as orderCtrl from '../controllers/orders.controller.js';
import { adminProtect } from '../middlewares/adminAuth.js';
import { protect } from '../middlewares/auth.middleware.js';


const router = express.Router();


router.post('/',protect , orderCtrl.createOrder);
router.get('/:id',protect , orderCtrl.getOrder);
router.get('/',adminProtect , orderCtrl.getAllOrders);
router.post('/:id/decision',adminProtect , orderCtrl.decideOrder);


export default router;