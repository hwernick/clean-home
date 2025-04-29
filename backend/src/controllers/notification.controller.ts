import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const notifications = await NotificationService.getUserNotifications(req.user.uid);
      res.json(notifications);
    } catch (error: any) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { notificationId } = req.params;
      await NotificationService.markAsRead(notificationId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const count = await NotificationService.getUnreadCount(req.user.uid);
      res.json({ count });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: error.message });
    }
  }
} 