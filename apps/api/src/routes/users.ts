import { Router } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = Router();

router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user!.userId !== req.params.id) {
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

router.patch('/fcm-token', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { fcmToken },
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
});

export default router;
