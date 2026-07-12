import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getLogs = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Please use /notifications endpoint for the unified feed.' });
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications: any[] = [];
    const now = new Date();

    // 1. Allocations & Transfers (Approvals)
    const allocations = await prisma.allocation.findMany({
      where: { status: 'APPROVED' },
      include: { asset: { include: { category: true } }, user: true, department: true }
    });
    allocations.forEach(a => {
      if (a.departmentId) {
        // Transfer to department
        notifications.push({
          id: `trans_${a.id}`,
          message: `Transfer approved : ${a.asset.assetTag} to ${a.department?.name?.toLowerCase()} dept`,
          category: 'Approvals',
          dotStyle: 'hollow-red',
          timestamp: a.updatedAt
        });
      } else {
        // Assignment to user
        notifications.push({
          id: `alloc_${a.id}`,
          message: `${a.asset.category.name} ${a.asset.assetTag} assigned to ${a.user?.name}`,
          category: 'Approvals',
          dotStyle: 'solid-blue',
          timestamp: a.updatedAt
        });
      }
    });

    // 2. Overdue Returns (Alerts)
    const overdue = await prisma.allocation.findMany({
      where: { 
        status: 'APPROVED',
        expectedReturnDate: { lt: now },
        actualReturnDate: null
      },
      include: { asset: true }
    });
    overdue.forEach(a => {
      if (a.expectedReturnDate) {
        const diffTime = Math.abs(now.getTime() - a.expectedReturnDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        notifications.push({
          id: `overdue_${a.id}`,
          message: `Overdue return : ${a.asset.assetTag} was due ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`,
          category: 'Alerts',
          dotStyle: 'hollow-yellow',
          timestamp: a.expectedReturnDate // Use expected date as the anchor for sorting
        });
      }
    });

    // 3. Maintenance Approvals (Approvals)
    const maintenance = await prisma.maintenanceRequest.findMany({
      where: { status: 'APPROVED' },
      include: { asset: true }
    });
    maintenance.forEach(m => {
      notifications.push({
        id: `maint_${m.id}`,
        message: `Maintenance request ${m.asset.assetTag} approved`,
        category: 'Approvals',
        dotStyle: 'hollow-green',
        timestamp: m.updatedAt
      });
    });

    // 4. Bookings (Bookings)
    const bookings = await prisma.booking.findMany({
      where: { status: { in: ['UPCOMING', 'ONGOING'] } },
      include: { asset: true }
    });
    bookings.forEach(b => {
      // Format time: 2:00 to 3:00 PM
      const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      notifications.push({
        id: `book_${b.id}`,
        message: `Booking confirmed : ${b.asset.name} : ${formatTime(b.startTime)} to ${formatTime(b.endTime)}`,
        category: 'Bookings',
        dotStyle: 'solid-blue',
        timestamp: b.updatedAt
      });
    });

    // 5. Audit Discrepancies (Alerts)
    const auditItems = await prisma.auditItem.findMany({
      where: { status: { in: ['MISSING', 'DAMAGED'] } },
      include: { asset: true }
    });
    auditItems.forEach(i => {
      notifications.push({
        id: `audit_${i.id}`,
        message: `audit discrepancy flagged : ${i.asset.assetTag} ${i.status.toLowerCase()}`,
        category: 'Alerts',
        dotStyle: 'hollow-red',
        timestamp: i.updatedAt
      });
    });

    // Sort all by timestamp descending
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Compute relative time string exactly matching wireframe (e.g. "2m ago", "1h ago", "1d ago")
    const formatted = notifications.map(n => {
      const msAgo = now.getTime() - n.timestamp.getTime();
      const minsAgo = Math.floor(msAgo / (1000 * 60));
      const hoursAgo = Math.floor(msAgo / (1000 * 60 * 60));
      const daysAgo = Math.floor(msAgo / (1000 * 60 * 60 * 24));
      
      let relativeTime = 'Just now';
      if (daysAgo >= 1) relativeTime = `${daysAgo}d ago`;
      else if (hoursAgo >= 1) relativeTime = `${hoursAgo}h ago`;
      else if (minsAgo >= 1) relativeTime = `${minsAgo}m ago`;

      return {
        id: n.id,
        message: n.message,
        category: n.category,
        dotStyle: n.dotStyle,
        relativeTime
      };
    });

    // Return the unified feed
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching unified notifications', error: error.message });
  }
};
