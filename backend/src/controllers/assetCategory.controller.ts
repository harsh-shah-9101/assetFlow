import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.assetCategory.findMany();
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, warrantyPeriod } = req.body;
    
    const existing = await prisma.assetCategory.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const category = await prisma.assetCategory.create({
      data: {
        name,
        warrantyPeriod: warrantyPeriod ? parseInt(warrantyPeriod, 10) : null
      }
    });

    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, warrantyPeriod } = req.body;

    const category = await prisma.assetCategory.update({
      where: { id },
      data: {
        name,
        warrantyPeriod: warrantyPeriod !== undefined ? parseInt(warrantyPeriod, 10) : null
      }
    });

    res.status(200).json(category);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};
