import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    userId: string;
    universityId: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const decoded = await adminAuth.verifyIdToken(token);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, universityId: true },
    });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    req.user = {
      uid: decoded.uid,
      userId: user.id,
      universityId: user.universityId,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
