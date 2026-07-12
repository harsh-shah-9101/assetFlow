import { Router } from 'express';
import { getMaintenanceRequests, raiseRequest, updateRequestStatus } from '../controllers/maintenance.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// View requests
router.get('/', getMaintenanceRequests);

// Anyone can raise a request for an asset
router.post('/', raiseRequest);

// Only Managers and Admins can approve/reject and manage workflow
router.put('/:id/status', authorize(['ASSET_MANAGER', 'ADMIN']), updateRequestStatus);

export default router;
