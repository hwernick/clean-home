import { Router, Request, Response } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => 
  NotificationController.getNotifications(req, res)
);

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, (req: AuthRequest, res: Response) => 
  NotificationController.markAsRead(req, res)
);

// Get unread count
router.get('/unread/count', authenticateToken, (req: AuthRequest, res: Response) => 
  NotificationController.getUnreadCount(req, res)
);

export default router; 