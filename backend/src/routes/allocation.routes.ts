import { Router } from 'express';
import { allocateAsset, requestTransfer, approveTransfer, returnAsset, getAllocations } from '../controllers/allocation.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Everyone can view allocations
router.get('/', getAllocations);

// Employees can request transfers
router.post('/transfer', requestTransfer);

// Managers and Admins can allocate directly, approve transfers, and process returns
router.post('/', authorize(['ASSET_MANAGER', 'DEPARTMENT_HEAD', 'ADMIN']), allocateAsset);
router.post('/:id/approve-transfer', authorize(['ASSET_MANAGER', 'DEPARTMENT_HEAD', 'ADMIN']), approveTransfer);
router.post('/:id/return', authorize(['ASSET_MANAGER', 'DEPARTMENT_HEAD', 'ADMIN']), returnAsset);

export default router;
