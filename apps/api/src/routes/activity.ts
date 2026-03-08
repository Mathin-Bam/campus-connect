import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

router.post('/status', requireAuth, async (req, res) => {
  try {
    const { activityId, label, emoji, location, message, duration } = req.body;
    const userId = (req as any).user.id;
    const universityId = (req as any).user.universityId;
    const displayName = (req as any).user.displayName;
    if (!activityId || !label) {
      res.status(400).json({ error: 'activityId and label required' });
      return;
    }
    
    // Replace existing status
    await prisma.activityStatus.deleteMany({ where: { userId } });
    
    const status = await prisma.activityStatus.create({
      data: {
        userId,
        universityId,
        activityId: activityId as any,
        label,
        emoji: emoji || '📍',
        locationName: location || null,
        message: message || null,
        expiresAt: new Date(Date.now() + (Number(duration) || 60) * 60 * 1000),
      } as any,
    });
    
    // Emit Socket.io event to user's university room
    const io = req.app.get('io');
    if (io) {
      io.to(`university_${universityId}`).emit('status_updated', {
        userId: userId,
        displayName: displayName,
        activityId: activityId,
        location,
        message,
        expiresAt: status.expiresAt
      });

      // Emit active count update
      const activeCount = await prisma.activityStatus.count({
        where: { expiresAt: { gt: new Date() }, user: { universityId: universityId } },
      });
      io.to(`university_${universityId}`).emit('active_count', { count: activeCount });

      // Emit new status event
      io.to(`university_${universityId}`).emit('new_status', { status });
    }
    
    res.json({ status });
    return;
  } catch (e: any) {
    res.status(500).json({ error: e.message });
    return;
  }
});

// DELETE /api/activity/status
router.delete('/status', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const universityId = user.universityId;

    await prisma.activityStatus.deleteMany({
      where: { userId: user.id }
    });

    // Emit status cleared event
    const io = req.app.get('io');
    if (io) {
      io.to(`university_${universityId}`).emit('status_cleared', { 
        userId: user.id 
      });

      // Emit active count update
      const activeCount = await prisma.activityStatus.count({
        where: { expiresAt: { gt: new Date() }, user: { universityId: universityId } },
      });
      io.to(`university_${universityId}`).emit('active_count', { count: activeCount });
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
    const user = (req as any).user;
    console.log('FEED - user:', user?.id, 'universityId:', user?.universityId);
    console.log('FEED REQUEST - userId:', user.id, 'universityId:', user.universityId);
    const statuses = await prisma.activityStatus.findMany({
      where: {
        expiresAt: { gt: new Date() },
        ...(user.universityId ? { user: { universityId: user.universityId } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
    console.log('FEED RESULTS COUNT:', statuses.length);

    const feed = statuses.map((s: any) => ({
      id: s.id,
      userId: s.userId,   // real UUID — this is what Say Hi uses
      name: s.user.displayName || 'User',
      initials: (s.user.displayName || 'U')
        .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
      activity: s.label,
      activityId: s.activityId,
      emoji: s.emoji || '📍',
      location: s.locationName || '',
      message: s.message || '',
      minutesAgo: Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 60000),
      color: ({
        study:'#3498DB', gym:'#8E44AD', food:'#F39C12',
        sports:'#E74C3C', gaming:'#E67E22', social:'#1ABC9C',
        music:'#9B59B6', art:'#2ECC71', movies:'#E91E63', other:'#607D8B',
      } as any)[s.activityId] || '#1B6CA8',
    }));

    res.json(feed);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/activity/active-count
router.get('/active-count', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const count = await prisma.activityStatus.count({
      where: { expiresAt: { gt: new Date() }, user: { universityId: user.universityId } },
    });
    res.json({ count });
    return;
  } catch (e: any) { 
    res.status(500).json({ error: e.message });
    return;
  }
});

export default router;
