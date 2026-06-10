import express from 'express';
import { getQueueHistory } from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getQueueHistory);

export default router;
