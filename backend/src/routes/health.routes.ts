import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/health', async (_req, res) => {
  let db = 'down';
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    db = 'up';
  } catch {
    db = 'down';
  }
  res.json({
    status: db === 'up' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: db,
  });
});

export default router;
