import { Router } from 'express';
import { successResponse } from '@mono/shared';
import { db } from '@mono/db';
import { sql } from 'drizzle-orm';

const router: Router = Router();

router.get('/', (_req, res) => {
  res.json(
    successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'oauth-service',
    })
  );
});

router.get('/ready', async (_req, res) => {
  try {
    //doning simple command to check the database is respond
    await db.execute(sql`SELECT 1`);

    res.status(200).json(
      successResponse({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Database connection error in health check:', error);
    
    //if there is error inside database
    res.status(503).json({
      success: false,
      data: {
        status: 'unready',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      }
    });
  }
});

export { router as healthRouter };
