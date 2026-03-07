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
    
    // If no query, return first 10 universities
    if (!q || typeof q !== 'string') {
      const universities = await prisma.university.findMany({
        select: { id: true, name: true, emailDomain: true, city: true, country: true },
        take: 10,
        orderBy: { name: 'asc' },
      });
      return res.json({ universities });
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
      return res.status(400).json({ error: 'email, universityId and displayName are required' });
    }
    const university = await prisma.university.findUnique({
      where: { id: universityId },
    });
    if (!university) {
      return res.status(400).json({ error: 'University not found' });
    }
    const emailDomain = email.split('@')[1];
    if (emailDomain !== university.emailDomain) {
      return res.status(400).json({ error: `Email must end with @${university.emailDomain}` });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({ email, displayName });
    } catch {
      firebaseUser = await auth.getUserByEmail(email);
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpKey = `otp:${email.toLowerCase().trim()}` 
    await redis.set(otpKey, otp, { ex: 3600 })
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
    return res.status(201).json({
      message: 'OTP sent to email',
      userId: user.id,
      otp, // REMOVE THIS IN PRODUCTION
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
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
    console.log('VERIFY REQUEST - email:', email, 'otp received:', otp, typeof otp);
    const storedOtp = await redis.get<string>(otpKey)
    console.log('VERIFY - stored otp:', storedOtp, typeof storedOtp);
    console.log('VERIFY - match:', String(storedOtp) === String(otp));
    if (!storedOtp) return res.status(400).json({ error: 'OTP expired' })
    if (String(storedOtp) !== String(otp)) return res.status(400).json({ error: 'Invalid OTP' })
    await redis.del(otpKey)
    const firebaseUser = await auth.getUserByEmail(email);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        verified: true,
        firebaseUid: firebaseUser.uid,
      },
    });
    const customToken = await auth.createCustomToken(firebaseUser.uid);
    return res.json({ customToken, message: 'Email verified successfully', user: updatedUser });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Verification failed' });
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
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch user' });
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
    return res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
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
