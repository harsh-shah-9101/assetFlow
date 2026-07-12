import { Router } from 'express';
import { getCategories, createCategory, updateCategory } from '../controllers/assetCategory.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Everyone can view categories
router.get('/', getCategories);

// Only ADMIN can manage asset categories
router.post('/', authorize(['ADMIN']), createCategory);
router.put('/:id', authorize(['ADMIN']), updateCategory);

export default router;
