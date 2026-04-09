import { db, notifications } from '@mono/db';
import { eq, desc, and } from 'drizzle-orm';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async getNotifications(userId: string) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

 async markAsRead(notificationId: string, userId: string): Promise<any> {
    return await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId), 
          eq(notifications.userId, userId)
        )
      );
  }
}