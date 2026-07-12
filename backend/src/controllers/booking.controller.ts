import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getBookings = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.query;
    const whereClause = assetId ? { assetId: String(assetId) } : {};

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        user: { select: { id: true, name: true } }
      },
      orderBy: { startTime: 'asc' }
    });
    res.status(200).json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { assetId, startTime, endTime } = req.body;
    const user = (req as any).user;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || !asset.isSharedBookable) {
      return res.status(400).json({ message: 'Asset is not a shared bookable resource' });
    }

    // Overlap validation
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        assetId,
        status: { in: ['UPCOMING', 'ONGOING'] },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start }
          }
        ]
      }
    });

    if (overlappingBookings.length > 0) {
      return res.status(409).json({ message: 'Time slot overlaps with an existing booking' });
    }

    const booking = await prisma.booking.create({
      data: {
        assetId,
        userId: user.id,
        startTime: start,
        endTime: end,
        status: 'UPCOMING'
      }
    });

    res.status(201).json(booking);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // CANCELLED, ONGOING, COMPLETED

    const booking = await prisma.booking.update({
      where: { id },
      data: { status }
    });

    res.status(200).json(booking);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
};
