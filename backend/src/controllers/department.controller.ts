import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: {
          select: { id: true, name: true, email: true }
        },
        parentDept: {
          select: { id: true, name: true }
        }
      }
    });
    res.status(200).json(departments);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, headId, parentDeptId, isActive } = req.body;
    
    // Check for duplicate name
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: 'Department name already exists' });
    }

    const department = await prisma.department.create({
      data: {
        name,
        headId: headId || null,
        parentDeptId: parentDeptId || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    // If headId is provided, optionally we could promote that user to DEPARTMENT_HEAD
    if (headId) {
      await prisma.user.update({
        where: { id: headId },
        data: { role: 'DEPARTMENT_HEAD', departmentId: department.id }
      });
    }

    res.status(201).json(department);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, headId, parentDeptId, isActive } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        headId: headId || null,
        parentDeptId: parentDeptId || null,
        isActive
      }
    });

    if (headId) {
      await prisma.user.update({
        where: { id: headId },
        data: { role: 'DEPARTMENT_HEAD', departmentId: department.id }
      });
    }

    res.status(200).json(department);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating department', error: error.message });
  }
};
