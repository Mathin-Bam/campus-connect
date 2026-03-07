import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

// GET /api/users/me - full profile
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).user.id },
    include: { university: { select: { name: true, emailDomain: true } } },
  });
  res.json({ user });
});

// GET /api/users/:profileId/public - public profile view
router.get('/:profileId/public', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { profileId: req.params.profileId },
    select: {
      id: true, displayName: true, avatarUrl: true, profileId: true,
      university: { select: { name: true } },
      activityStatuses: {
        where: { expiresAt: { gt: new Date() } },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.patch('/profile', requireAuth, async (req, res) => {
  const { displayName, avatarUrl, interests } = req.body;
  const user = await prisma.user.update({
    where: { id: (req as any).user.id },
    data: {
      displayName,
      ...(avatarUrl && { avatarUrl }),
    },
  });
  res.json({ user });
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user!.id !== req.params.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const { displayName, avatarUrl, notificationPreferences } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(displayName && { displayName }),
        ...(avatarUrl && { avatarUrl }),
        ...(notificationPreferences && { notificationPreferences }),
      },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.patch('/fcm-token', requireAuth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }
    
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { pushToken: fcmToken },
    });
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Failed to update FCM token' });
  }
});

export default router;
