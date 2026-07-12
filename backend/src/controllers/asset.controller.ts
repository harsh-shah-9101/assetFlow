import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getAssets = async (req: Request, res: Response) => {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        department: true
      }
    });
    res.status(200).json(assets);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching assets', error: error.message });
  }
};

export const registerAsset = async (req: Request, res: Response) => {
  try {
    const {
      name,
      categoryId,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      condition,
      location,
      isSharedBookable,
      departmentId
    } = req.body;

    // Generate Asset Tag (e.g., AF-0001)
    const count = await prisma.asset.count();
    const assetTag = `AF-${(count + 1).toString().padStart(4, '0')}`;

    const asset = await prisma.asset.create({
      data: {
        assetTag,
        name,
        serialNumber,
        acquisitionDate: new Date(acquisitionDate),
        acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : null,
        condition,
        location,
        isSharedBookable: isSharedBookable || false,
        categoryId,
        departmentId: departmentId || null,
        status: 'AVAILABLE'
      }
    });

    res.status(201).json(asset);
  } catch (error: any) {
    res.status(500).json({ message: 'Error registering asset', error: error.message });
  }
};

export const updateAssetStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const asset = await prisma.asset.update({
      where: { id },
      data: { status }
    });

    res.status(200).json(asset);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating asset status', error: error.message });
  }
};

export const getAssetById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        allocations: {
          include: { user: true, department: true }
        },
        maintenanceReqs: true
      }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.status(200).json(asset);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching asset', error: error.message });
  }
};
