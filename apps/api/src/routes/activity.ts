import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

// POST /api/activity/status
router.post('/status', requireAuth, async (req, res) => {
  try {
    const { activityType, location, message, duration } = req.body;
    const user = req.user!;

    const durationMap: Record<string, number> = {
      '30m': 30, '1h': 60, '2h': 120, 'open': 99999
    };
    const minutes = durationMap[duration] ?? 60;
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    // Delete any existing activity status for this user
    await prisma.activityStatus.deleteMany({
      where: { userId: user.id }
    });

    const activityStatus = await prisma.activityStatus.create({
      data: {
        userId: user.id,
        universityId: user.universityId,
        activityType,
        locationName: location,
        message,
        expiresAt,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true }
        }
      }
    });

    // Emit Socket.io event to the user's university room
    const io = req.app.get('io');
    if (io) {
      io.to(`university_${user.universityId}`).emit('status_updated', {
        userId: user.id,
        displayName: user.displayName,
        activityType,
        location,
        message,
        expiresAt
      });
    }

    res.json(activityStatus);
  } catch (error) {
    console.error('Status creation error:', error);
    res.status(500).json({ error: 'Failed to create status' });
  }
});

// DELETE /api/activity/status
router.delete('/status', requireAuth, async (req, res) => {
  try {
    const user = req.user!;

    await prisma.activityStatus.deleteMany({
      where: { userId: user.id }
    });

    // Emit status cleared event
    const io = req.app.get('io');
    if (io) {
      io.to(`university_${user.universityId}`).emit('status_cleared', { 
        userId: user.id 
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Status deletion error:', error);
    res.status(500).json({ error: 'Failed to delete status' });
  }
});

// GET /api/activity/feed
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const user = req.user!;

    const statuses = await prisma.activityStatus.findMany({
      where: {
        universityId: user.universityId,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out blocked users (you'll need to implement this logic)
    const filteredStatuses = statuses.filter(status => status.user.id !== user.id);

    res.json({ feed: filteredStatuses });
  } catch (error) {
    console.error('Feed fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

export default router;
