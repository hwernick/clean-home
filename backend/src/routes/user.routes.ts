import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', (req: Request, res: Response) => UserController.register(req, res));

// Protected routes
router.get('/profile', authenticateToken, (req: AuthRequest, res: Response) => UserController.getProfile(req, res));
router.put('/profile', authenticateToken, (req: AuthRequest, res: Response) => UserController.updateProfile(req, res));

export default router; 