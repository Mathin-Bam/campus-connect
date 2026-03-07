import { Request, Response, NextFunction } from 'express';
import { auth as adminAuth } from '../lib/firebase';
import { prisma } from '../lib/prisma';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const idToken = authHeader.split(' ')[1];
  if (!idToken) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const conditions: any[] = [{ firebaseUid: decoded.uid }];
    if (decoded.email) {
      conditions.push({ email: decoded.email });
    }
    const user = await prisma.user.findFirst({
      where: { OR: conditions },
    });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    (req as any).user = user;
    next();
  } catch (e: any) {
    if (e.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
