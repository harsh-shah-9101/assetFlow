import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const allocations = await prisma.allocation.findMany({
      include: { asset: true, user: true },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });
    const bookings = await prisma.booking.findMany({
      include: { asset: true, user: true },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });
    const maintenance = await prisma.maintenanceRequest.findMany({
      include: { asset: true, requester: true },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    const logs: any[] = [];
    allocations.forEach(a => {
      logs.push({
        id: `alloc_${a.id}`,
        action: `${a.status === 'APPROVED' ? 'Approved' : a.status === 'REQUESTED' ? 'Requested' : 'Returned'} Allocation`,
        actor: a.user?.name || 'Unknown',
        role: a.user?.role || 'Unknown',
        target: a.asset?.name || 'Asset',
        time: a.updatedAt.toISOString(),
        type: 'allocation'
      });
    });

    bookings.forEach(b => {
      logs.push({
        id: `book_${b.id}`,
        action: `${b.status} Booking`,
        actor: b.user?.name || 'Unknown',
        role: b.user?.role || 'Unknown',
        target: b.asset?.name || 'Asset',
        time: b.updatedAt.toISOString(),
        type: 'booking'
      });
    });

    maintenance.forEach(m => {
      logs.push({
        id: `maint_${m.id}`,
        action: `${m.status} Maintenance Request`,
        actor: m.requester?.name || 'Unknown',
        role: m.requester?.role || 'Unknown',
        target: m.asset?.name || 'Asset',
        time: m.updatedAt.toISOString(),
        type: 'maintenance'
      });
    });

    // Sort by descending time and take top 20
    logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    // Format date string for the frontend
    const formattedLogs = logs.slice(0, 20).map(log => ({
      ...log,
      time: new Date(log.time).toLocaleString()
    }));

    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs', error });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications: any[] = [];
    
    // Check for overdue returns
    const overdueAllocations = await prisma.allocation.findMany({
      where: {
        status: 'APPROVED',
        expectedReturnDate: { lt: new Date() }
      },
      include: { asset: true, user: true }
    });
    
    overdueAllocations.forEach(a => {
      notifications.push({
        id: `notif_ovr_${a.id}`,
        title: 'Overdue Return Alert',
        message: `${a.asset.name} expected return date was ${a.expectedReturnDate?.toLocaleDateString()}. Currently held by ${a.user?.name}.`,
        type: 'danger',
        time: a.updatedAt.toISOString(),
        category: 'return'
      });
    });

    // Check for pending maintenance
    const pendingMaintenance = await prisma.maintenanceRequest.findMany({
      where: { status: 'PENDING' },
      include: { asset: true }
    });
    
    pendingMaintenance.forEach(m => {
      notifications.push({
        id: `notif_maint_${m.id}`,
        title: 'Pending Maintenance',
        message: `${m.asset.name} has a pending maintenance request.`,
        type: 'warning',
        time: m.createdAt.toISOString(),
        category: 'maintenance'
      });
    });
    
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const formattedNotifs = notifications.map(notif => {
      const msAgo = new Date().getTime() - new Date(notif.time).getTime();
      const hoursAgo = Math.floor(msAgo / (1000 * 60 * 60));
      return {
        ...notif,
        time: hoursAgo > 24 ? `${Math.floor(hoursAgo / 24)} days ago` : `${hoursAgo} hours ago`
      };
    });

    res.json(formattedNotifs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};
