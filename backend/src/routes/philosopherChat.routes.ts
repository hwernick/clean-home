import express from 'express';
import { PhilosopherChatController } from '../controllers/PhilosopherChat.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all chats for the authenticated user
router.get('/', PhilosopherChatController.getUserChats);

// Get chat history for a specific philosopher
router.get('/:philosopherId', PhilosopherChatController.getChatHistory);

// Send a message in a chat
router.post('/:philosopherId/messages', PhilosopherChatController.sendMessage);

// Delete a chat
router.delete('/:philosopherId', PhilosopherChatController.deleteChat);

export default router; 