import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { auth, firebaseAdmin } from '../lib/firebase';
import { redis } from '../lib/redis';
import { requireAuth } from '../middleware/requireAuth';

const router: Router = Router();

// GET /api/universities?q=searchterm
router.get('/universities', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const universities = await prisma.university.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { emailDomain: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, emailDomain: true, city: true, country: true },
      take: 10,
    });

    return res.json({ universities });
  } catch (error) {
    console.error('University search error:', error);
    return res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, universityId, displayName } = req.body;
    if (!email || !universityId || !displayName) {
      res.status(400).json({ error: 'email, universityId and displayName are required' });
      return;
    }
    const university = await prisma.university.findUnique({
      where: { id: universityId },
    });
    if (!university) {
      res.status(400).json({ error: 'University not found' });
      return;
    }
    const emailDomain = email.split('@')[1];
    if (emailDomain !== university.emailDomain) {
      res.status(400).json({ error: `Email must end with @${university.emailDomain}` });
      return;
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({ email, displayName });
    } catch {
      firebaseUser = await auth.getUserByEmail(email);
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpKey = `otp:${email.toLowerCase().trim()}` 
    await redis.set(otpKey, otp, { ex: 600 })
    const user = await prisma.user.create({
      data: {
        firebaseUid: firebaseUser.uid,
        email,
        displayName,
        universityId,
        verified: false,
      },
    });
    // TODO Sprint 4: Send OTP via AWS SES email
    // For now returning OTP in response for testing
    res.status(201).json({
      message: 'OTP sent to email',
      userId: user.id,
      otp, // REMOVE THIS IN PRODUCTION
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: 'email and otp are required' });
      return;
    }
    const otpKey = `otp:${email.toLowerCase().trim()}` 
    const storedOtp = await redis.get<string>(otpKey)
    console.log('DEBUG verify - key:', otpKey)
    console.log('DEBUG verify - storedOtp:', storedOtp, typeof storedOtp)
    console.log('DEBUG verify - receivedOtp:', otp, typeof otp)
    console.log('DEBUG verify - match:', String(storedOtp) === String(otp))
    if (!storedOtp) return res.status(400).json({ error: 'OTP expired' })
    if (String(storedOtp) !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' })
    await redis.del(otpKey)
    await prisma.user.update({
      where: { email },
      data: { verified: true },
    });
    const firebaseUser = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(firebaseUser.uid);
    res.json({ customToken, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { university: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/users/profile
router.patch('/users/profile', requireAuth, async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(displayName && { displayName }),
        ...(avatarUrl && { avatarUrl }),
      },
    });
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PATCH /api/users/fcm-token
router.patch('/users/fcm-token', requireAuth, async (req, res) => {
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
