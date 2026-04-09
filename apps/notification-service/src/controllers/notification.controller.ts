import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { successResponse, HTTP_STATUS } from '@mono/shared';

const service = new NotificationService();

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId; 
    if (!userId) 
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Missing User ID' });
    const list = await service.getNotifications(userId);
    return res.status(HTTP_STATUS.OK).json(successResponse(list));
  } 
  catch (error) {
    next(error);
  }
};

export const internalCreateNotify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notify = await service.createNotification(req.body);
    return res.status(HTTP_STATUS.CREATED).json(successResponse(notify));
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) 
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Missing User ID' });

    await service.markAsRead(id, userId); 
    
    return res.status(HTTP_STATUS.OK).json(successResponse({ message: 'Notification marked as read' }));
  } 
  catch (error) {
    next(error);
  }
};