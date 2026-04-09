import { Router, Request, Response } from 'express';
import { db } from '@mono/db';
import { sql } from 'drizzle-orm';

const router: Router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await db.execute(sql`SELECT 1`);

    res.status(200).json({
      status: 'healthy',
      service: 'ai-analyzer',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'ai-analyzer',
      error: (error as Error).message
    });
  }
});

export { router as healthRouter };