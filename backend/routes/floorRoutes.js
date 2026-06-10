import express from 'express';
import { getFloors, getWashroomsByFloor } from '../controllers/floorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getFloors);
router.get('/:floorId/washrooms', getWashroomsByFloor);

export default router;
