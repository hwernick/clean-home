import { Request, Response } from 'express';
import PhilosopherChat from '../models/PhilosopherChat.model';
import { IPhilosopherChat } from '../models/PhilosopherChat.model';

export class PhilosopherChatController {
  // Get all chats for a user
  static async getUserChats(req: Request, res: Response) {
    try {
      const userId = req.user.id; // Assuming you have auth middleware
      const chats = await PhilosopherChat.find({ userId })
        .sort({ lastMessageTime: -1 });
      
      res.json(chats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  }

  // Get chat history for a specific philosopher
  static async getChatHistory(req: Request, res: Response) {
    try {
      const { philosopherId } = req.params;
      const userId = req.user.id;

      const chat = await PhilosopherChat.findOne({ userId, philosopherId });
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      res.json(chat);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  }

  // Send a message in a chat
  static async sendMessage(req: Request, res: Response) {
    try {
      const { philosopherId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const chat = await PhilosopherChat.findOneAndUpdate(
        { userId, philosopherId },
        {
          $push: {
            messages: {
              role: 'user',
              content,
              timestamp: new Date()
            }
          },
          $set: { lastMessageTime: new Date() }
        },
        { upsert: true, new: true }
      );

      res.json(chat);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Delete a chat
  static async deleteChat(req: Request, res: Response) {
    try {
      const { philosopherId } = req.params;
      const userId = req.user.id;

      await PhilosopherChat.findOneAndDelete({ userId, philosopherId });
      res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ error: 'Failed to delete chat' });
    }
  }
} 