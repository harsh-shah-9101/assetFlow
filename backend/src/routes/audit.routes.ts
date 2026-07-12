import { Router } from 'express';
import { getAuditCycles, createAuditCycle, updateAuditItem, closeAuditCycle, deleteAuditCycle } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'])); // Based on who runs audits

router.get('/', getAuditCycles);
router.post('/', createAuditCycle);
router.put('/items/:id', updateAuditItem);
router.post('/:id/close', closeAuditCycle);
router.delete('/:id', deleteAuditCycle);

export default router;
