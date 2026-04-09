import { Router } from 'express';
import { getUserNotifications, internalCreateNotify, markNotificationAsRead } from '../controllers/notification.controller';
import { isAuth } from '../middleware/auth';

const router: Router = Router();

router.get('/', isAuth, getUserNotifications); 
router.post('/internal/create', internalCreateNotify);
router.patch('/:id/read', isAuth, markNotificationAsRead);
//http://localhost:3001/api/notifications/123/read
export { router as notifyrouter };