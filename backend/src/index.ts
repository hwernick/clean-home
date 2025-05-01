import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import philosopherChatRoutes from './routes/philosopherChat.routes';
import syncDataRoutes from './routes/syncData.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const router = express.Router();
const PORT = process.env.PORT || 5000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/classical')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
router.get('/', ((req: Request, res: Response) => {
  res.send('ClassicaI API is running');
}) as express.RequestHandler);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chats', philosopherChatRoutes);
app.use('/api/sync', syncDataRoutes);

// OpenAI API endpoint
router.post('/api/chat', (async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a Socratic guide using classical Western thought. Engage users through concise, probing questions to stimulate critical thinking. Focus on one question at a time, guiding users to explore their reasoning and challenge assumptions. Keep responses concise and focused on the text at hand. Use clear, precise language without modern jargon.`,
        },
        ...messages,
      ],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
}) as express.RequestHandler);

app.use(router);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: err.message,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 