import { Router } from 'express';
import { prisma } from '../config/database';
import { adminAuth } from '../config/firebase';
import { redis } from '../config/upstash';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: Router = Router();

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
      firebaseUser = await adminAuth.createUser({ email, displayName });
    } catch {
      firebaseUser = await adminAuth.getUserByEmail(email);
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.setex(`otp:${email}`, 600, otp);
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
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) {
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }
    await redis.del(`otp:${email}`);
    await prisma.user.update({
      where: { email },
      data: { verified: true },
    });
    const firebaseUser = await adminAuth.getUserByEmail(email);
    const customToken = await adminAuth.createCustomToken(firebaseUser.uid);
    res.json({ customToken, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
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

export default router;
