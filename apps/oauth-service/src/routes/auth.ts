import { Router } from 'express';
import {
  githubLogin,
  githubCallback,
  getMe,
  loginWithEmailPassword,
  logout,
  registerWithEmailPassword,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router: Router = Router();

router.get('/github', githubLogin);
router.get('/callback/github', githubCallback);
router.post('/register', registerWithEmailPassword);
router.post('/login', loginWithEmailPassword);

router.get('/me', requireAuth, getMe); 
router.post('/logout', logout);

export { router as authRouter };
