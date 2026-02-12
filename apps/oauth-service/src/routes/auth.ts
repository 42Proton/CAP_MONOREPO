import { Router } from 'express';
import { githubLogin, githubCallback, getMe, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

router.get('/github', githubLogin);
router.get('/callback/github', githubCallback);

router.get('/me', requireAuth, getMe); 
router.post('/logout', logout);

export { router as authRouter };