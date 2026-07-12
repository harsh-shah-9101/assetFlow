import { Router } from 'express';
import { getUsers, updateUserRole } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Directory is visible to all authenticated users
router.get('/', getUsers);

// Only ADMIN can update user roles and status
router.put('/:id/role', authorize(['ADMIN']), updateUserRole);

export default router;
