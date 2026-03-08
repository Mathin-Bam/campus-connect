import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

// POST /api/activity/status
router.post('/status', requireAuth, async (req, res) => {
  try {
    const { activityId, label, emoji, location, message, duration } = req.body;
    const userId = (req as any).user.id;
    const universityId = (req as any).user.universityId;
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
    const user = (req as any).user;
    const statuses = await prisma.activityStatus.findMany({
      where: {
        expiresAt: { gt: new Date() },
        user: { universityId: user.universityId },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

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
