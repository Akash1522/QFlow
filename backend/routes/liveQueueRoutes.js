import express from 'express';
import { getLiveQueues } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);
router.get('/', getLiveQueues);

export default router;
