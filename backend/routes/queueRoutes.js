import express from 'express';
import { joinQueue, leaveQueue, getQueueStatus, getWashingMachineStatus } from '../controllers/queueController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/join', joinQueue);
router.post('/leave', leaveQueue);
router.get('/status', getQueueStatus);
router.get('/washing-machine', getWashingMachineStatus);

export default router;
