import { db } from '../config/firebase.config';
import { Notification, NotificationCreateInput } from '../models/notification.model';

export class NotificationService {
  static async createNotification(input: NotificationCreateInput): Promise<Notification> {
    try {
      const notificationRef = db.collection('notifications').doc();
      const notification: Notification = {
        id: notificationRef.id,
        ...input,
        read: false,
        createdAt: new Date(),
      };

      await notificationRef.set(notification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const snapshot = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => doc.data() as Notification);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await db
        .collection('notifications')
        .doc(notificationId)
        .update({ read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const snapshot = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
} 