export type PhilosophicalAnalysis = {
  school: string;
  influences: string[];
  keyThemes: string[];
  strengths: string[];
  areasForGrowth: string[];
  summary: string;
};

export type Message = {
  id: string;
  content: string;
  timestamp: string;
  role: 'user' | 'assistant';
};

