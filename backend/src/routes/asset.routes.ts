import { Router } from 'express';
import { getAssets, registerAsset, updateAssetStatus, getAssetById } from '../controllers/asset.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// View assets - accessible by everyone (filtered on frontend or potentially here)
router.get('/', getAssets);
router.get('/:id', getAssetById);

// Asset Management - Asset Managers and Admins
router.post('/', authorize(['ASSET_MANAGER', 'ADMIN']), registerAsset);
router.put('/:id/status', authorize(['ASSET_MANAGER', 'ADMIN']), updateAssetStatus);

export default router;
