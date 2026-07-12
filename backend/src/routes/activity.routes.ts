import { Router } from 'express';
import { getLogs, getNotifications } from '../controllers/activity.controller';

const router = Router();

router.get('/logs', getLogs);
router.get('/notifications', getNotifications);

export default router;
