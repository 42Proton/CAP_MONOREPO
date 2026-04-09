import { Router } from 'express';
import { getRepos, createProjectFromRepo } from '../github/github.js';
import { isAuth } from '../middleware/auth.js';

const router: Router = Router();

router.get('/my_repos', isAuth, getRepos);
router.post('/create', isAuth, createProjectFromRepo);

export { router as githubRouter };