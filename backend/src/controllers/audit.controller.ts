import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getAuditCycles = async (req: Request, res: Response) => {
  try {
    const cycles = await prisma.auditCycle.findMany({
      include: {
        auditItems: {
          include: { asset: { select: { name: true, assetTag: true, location: true } } }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    res.status(200).json(cycles);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching audits', error: error.message });
  }
};

export const createAuditCycle = async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, departmentId } = req.body;

    // Optional: filter assets by department to include in cycle
    const assetQuery = departmentId ? { departmentId } : {};
    const assetsToAudit = await prisma.asset.findMany({ where: assetQuery });

    const auditCycle = await prisma.$transaction(async (tx) => {
      const cycle = await tx.auditCycle.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isClosed: false
        }
      });

      // Create an audit item for each asset in scope
      const itemsData = assetsToAudit.map(asset => ({
        auditCycleId: cycle.id,
        assetId: asset.id,
        status: 'PENDING' as const
      }));

      if (itemsData.length > 0) {
        await tx.auditItem.createMany({ data: itemsData });
      }

      return cycle;
    });

    res.status(201).json(auditCycle);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating audit cycle', error: error.message });
  }
};

export const updateAuditItem = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // audit item ID
    const { status, notes } = req.body; // VERIFIED, MISSING, DAMAGED

    const item = await prisma.auditItem.update({
      where: { id },
      data: { status, notes }
    });

    res.status(200).json(item);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating audit item', error: error.message });
  }
};

export const closeAuditCycle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const cycle = await prisma.auditCycle.findUnique({
      where: { id },
      include: { auditItems: true }
    });

    if (!cycle) {
      return res.status(404).json({ message: 'Audit cycle not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Close the cycle
      await tx.auditCycle.update({
        where: { id },
        data: { isClosed: true }
      });

      // Update asset statuses based on findings
      for (const item of cycle.auditItems) {
        if (item.status === 'MISSING') {
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: 'LOST' }
          });
        }
      }
    });

    res.status(200).json({ message: 'Audit cycle closed and assets updated' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error closing audit cycle', error: error.message });
  }
};
