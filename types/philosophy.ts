export type PhilosophicalAnalysis = {
  school: string;
  influences: string[];
  keyThemes: string[];
  strengths: string[];
  areasForGrowth: string[];
  summary: string;
};

export type PhilosopherChat = {
  id: string;
  philosopherId: string;
  philosopherName: string;
  philosopherImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Array<{
    id: string;
    content: string;
    timestamp: string;
    isUser: boolean;
  }>;
}; 