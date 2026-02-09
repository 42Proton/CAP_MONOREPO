import { Router, type Router as RouterType } from 'express';

import { successResponse } from '@mono/shared';

const router: RouterType = Router();

router.get('/', (_req, res) => {
  res.json(
    successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    })
  );
});

router.get('/ready', (_req, res) => {
  // Add database connectivity check here
  res.json(
    successResponse({
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  );
});

export { router as healthRouter };
