import { Request, Response, NextFunction } from 'express'
import { auth } from '../lib/firebase'
import { prisma } from '../lib/prisma'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  try {
    const decoded = await auth.verifyIdToken(token)
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid }
    })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    
    // Add user to request object
    (req as any).user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
    return
  }
}
