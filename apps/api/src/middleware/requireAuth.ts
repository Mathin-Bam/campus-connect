import { Request, Response, NextFunction } from 'express'
import { auth } from '../lib/firebase'
import { prisma } from '../lib/prisma'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token provided' })

  try {
    const decoded = await auth.verifyIdToken(token)
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        firebaseUid: string;
        email: string;
        displayName: string;
        universityId: string;
        verified: boolean;
      }
    }
  }
}
