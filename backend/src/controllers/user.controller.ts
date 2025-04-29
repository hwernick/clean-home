import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class UserController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, displayName } = req.body;
      const user = await UserService.createUser({ email, password, displayName });
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await UserService.getUserProfile(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { displayName, preferences } = req.body;
      const user = await UserService.updateUserProfile(req.user.uid, {
        displayName,
        preferences,
      });

      res.json(user);
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }
} 