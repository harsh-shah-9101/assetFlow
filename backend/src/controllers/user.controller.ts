import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        department: {
          select: { id: true, name: true }
        }
      }
    });
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role, departmentId, isActive } = req.body;

    const dataToUpdate: any = {};
    if (role) dataToUpdate.role = role;
    if (departmentId !== undefined) dataToUpdate.departmentId = departmentId || null;
    if (isActive !== undefined) dataToUpdate.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true
      }
    });

    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};
