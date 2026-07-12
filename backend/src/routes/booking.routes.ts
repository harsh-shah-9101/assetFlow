import { Router } from 'express';
import { getBookings, createBooking, updateBookingStatus } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getBookings);
router.post('/', createBooking);
router.put('/:id/status', updateBookingStatus);

export default router;
