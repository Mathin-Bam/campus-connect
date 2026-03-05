import { Router } from 'express';
import { prisma } from '../config/database';

const router: Router = Router();

router.get('/', async (req, res) => {
  try {
    const { q, domain } = req.query;
    const universities = await prisma.university.findMany({
      where: {
        active: true,
        ...(q && {
          name: { contains: String(q) },
        }),
        ...(domain && {
          emailDomain: String(domain),
        }),
      },
      select: { id: true, name: true, emailDomain: true, city: true },
      take: 10,
    });
    res.json(universities);
  } catch {
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

export default router;
