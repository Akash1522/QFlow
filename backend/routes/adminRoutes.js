import express from 'express';
import { getStudents, getAnalytics, getSystemSettings, getLiveQueues, getLogs, getQueueReports, actionLiveQueue, getStudentHistory, getAllResources, addResource, updateResourceStatus, deleteResource, getAdmins, createAdmin, deleteAdmin, deleteAllStudents, sendAdminCreationOtp } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, admin);

router.get('/students', getStudents);
router.get('/analytics', getAnalytics);
router.get('/settings', getSystemSettings);
router.get('/live-queues', getLiveQueues);
router.put('/live-queues/:id/action', actionLiveQueue);
router.get('/students/:id/history', getStudentHistory);
router.get('/logs', getLogs);
router.get('/reports', getQueueReports);

// Resource Management
router.get('/resources', getAllResources);
router.post('/resources', addResource);
router.put('/resources/:type/:id/status', updateResourceStatus);
router.delete('/resources/:type/:id', deleteResource);

// Admin Management
router.get('/admins', getAdmins);
router.post('/admins/send-otp', sendAdminCreationOtp);
router.post('/admins', createAdmin);
router.delete('/admins/:id', deleteAdmin);
router.delete('/students/all', deleteAllStudents);

export default router;
