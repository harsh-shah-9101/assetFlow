import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getMaintenanceRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        requester: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(requests);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching maintenance requests', error: error.message });
  }
};

export const raiseRequest = async (req: Request, res: Response) => {
  try {
    const { assetId, issue, priority, photoUrl } = req.body;
    const user = (req as any).user;

    const request = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        requesterId: user.id,
        issue,
        priority: priority || 'MEDIUM',
        photoUrl,
        status: 'PENDING'
      }
    });

    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: 'Error raising maintenance request', error: error.message });
  }
};

export const updateRequestStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // APPROVED, REJECTED, IN_PROGRESS, RESOLVED

    const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRequest.update({
        where: { id },
        data: { status }
      });

      // If approved, set asset to UNDER_MAINTENANCE
      if (status === 'APPROVED') {
        await tx.asset.update({
          where: { id: request.assetId },
          data: { status: 'UNDER_MAINTENANCE' }
        });
      }

      // If resolved, set asset back to AVAILABLE
      if (status === 'RESOLVED') {
        await tx.asset.update({
          where: { id: request.assetId },
          data: { status: 'AVAILABLE' }
        });
      }
    });

    res.status(200).json({ message: 'Maintenance status updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating maintenance request', error: error.message });
  }
};
