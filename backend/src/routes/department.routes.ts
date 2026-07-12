import { Router } from 'express';
import { getDepartments, createDepartment, updateDepartment } from '../controllers/department.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Only ADMIN can manage departments
router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/', getDepartments);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);

export default router;
