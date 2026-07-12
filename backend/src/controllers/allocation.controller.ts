import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const allocateAsset = async (req: Request, res: Response) => {
  try {
    const { assetId, userId, departmentId, expectedReturnDate } = req.body;

    // Conflict Rule: Check if asset is already allocated
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    if (asset.status === 'ALLOCATED' || asset.status === 'RESERVED') {
      return res.status(409).json({ message: 'Asset is already allocated or reserved. Request a transfer instead.' });
    }

    const allocation = await prisma.$transaction(async (tx) => {
      const newAllocation = await tx.allocation.create({
        data: {
          assetId,
          userId: userId || null,
          departmentId: departmentId || null,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          status: 'APPROVED'
        }
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'ALLOCATED' }
      });

      return newAllocation;
    });

    res.status(201).json(allocation);
  } catch (error: any) {
    res.status(500).json({ message: 'Error allocating asset', error: error.message });
  }
};

export const requestTransfer = async (req: Request, res: Response) => {
  try {
    const { assetId, targetUserId, targetDepartmentId, expectedReturnDate } = req.body;

    // Check if asset is actually allocated currently
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status !== 'ALLOCATED') {
      return res.status(400).json({ message: 'Asset must be allocated to request a transfer' });
    }

    const transferRequest = await prisma.allocation.create({
      data: {
        assetId,
        userId: targetUserId || null,
        departmentId: targetDepartmentId || null,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        status: 'REQUESTED'
      }
    });

    res.status(201).json(transferRequest);
  } catch (error: any) {
    res.status(500).json({ message: 'Error requesting transfer', error: error.message });
  }
};

export const approveTransfer = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // allocation request ID

    const allocationRequest = await prisma.allocation.findUnique({ where: { id } });
    if (!allocationRequest || allocationRequest.status !== 'REQUESTED') {
      return res.status(404).json({ message: 'Pending transfer request not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Find current active allocation and mark it as returned (transfer complete)
      await tx.allocation.updateMany({
        where: { 
          assetId: allocationRequest.assetId,
          status: 'APPROVED',
          id: { not: allocationRequest.id }
        },
        data: {
          status: 'RETURNED',
          actualReturnDate: new Date(),
          conditionCheckIn: 'Transferred automatically'
        }
      });

      // Approve new allocation
      await tx.allocation.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      // Asset status remains ALLOCATED
    });

    res.status(200).json({ message: 'Transfer approved successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error approving transfer', error: error.message });
  }
};

export const returnAsset = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // active allocation ID
    const { conditionCheckIn } = req.body;

    const allocation = await prisma.allocation.findUnique({ where: { id } });
    if (!allocation || allocation.status !== 'APPROVED') {
      return res.status(404).json({ message: 'Active allocation not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Mark returned
      await tx.allocation.update({
        where: { id },
        data: {
          status: 'RETURNED',
          actualReturnDate: new Date(),
          conditionCheckIn
        }
      });

      // Update asset to AVAILABLE
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: 'AVAILABLE', condition: conditionCheckIn || 'Unknown' } // Update condition based on return
      });
    });

    res.status(200).json({ message: 'Asset returned successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error returning asset', error: error.message });
  }
};

export const getAllocations = async (req: Request, res: Response) => {
  try {
    const allocations = await prisma.allocation.findMany({
      include: {
        asset: true,
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } }
      }
    });
    res.status(200).json(allocations);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching allocations', error: error.message });
  }
};
