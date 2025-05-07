import { MAJOR_PHILOSOPHERS } from '../utils/philosophers';
import { constructWikidataUrl } from '../utils/wikidataApi';
import { PhilosopherChat, Message } from '../types/philosophy';
import { API_URL } from '../config';
import { StorageService } from './StorageService';
import { BackgroundSyncService } from './BackgroundSyncService';

export interface Chat {
  id: string;
  philosopherId: string;
  philosopherName: string;
  messages: Message[];
  lastMessageTime: number;
  createdAt: number;
}

export class PhilosopherChatService {
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly MODEL = 'gpt-3.5-turbo';
  private static readonly WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php';

  private static async getPhilosopherInfo(philosopherId: string): Promise<{ 
    name: string; 
    description: string; 
    claims: any;
    birthDate?: string;
    deathDate?: string;
    nationality?: string;
    notableWorks: string[];
    influences: string[];
    influencedBy: string[];
  }> {
    try {
      const response = await fetch(
        constructWikidataUrl('wbgetentities', {
          ids: philosopherId,
          props: 'labels|descriptions|claims',
          languages: 'en'
        })
      );
      const data = await response.json();
      const entity = data.entities[philosopherId];
      
      // Extract birth and death dates
      const birthDate = entity.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time;
      const deathDate = entity.claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time;
      
      // Extract nationality
      const nationality = entity.claims?.P27?.[0]?.mainsnak?.datavalue?.value?.id;
      
      // Extract notable works
      const notableWorks = entity.claims?.P800?.[0]?.mainsnak?.datavalue?.value?.id;
      
      // Extract influences and influenced by
      const influences = entity.claims?.P737 || [];
      const influencedBy = entity.claims?.P737 || [];
      
      return {
        name: entity.labels?.en?.value || 'Unknown Philosopher',
        description: entity.descriptions?.en?.value || '',
        claims: entity.claims || {},
        birthDate,
        deathDate,
        nationality,
        notableWorks: notableWorks ? [notableWorks] : [],
        influences: influences.map((i: any) => i.mainsnak?.datavalue?.value?.id).filter(Boolean),
        influencedBy: influencedBy.map((i: any) => i.mainsnak?.datavalue?.value?.id).filter(Boolean)
      };
    } catch (error) {
      console.error('Error fetching philosopher info:', error);
      return {
        name: 'Unknown Philosopher',
        description: '',
        claims: {},
        notableWorks: [],
        influences: [],
        influencedBy: []
      };
    }
  }

  private static async getPhilosopherSystemPrompt(philosopherId: string): Promise<string> {
    // First check if it's a major philosopher
    const majorPhilosopher = Object.values(MAJOR_PHILOSOPHERS).find(p => p.id === philosopherId);
    if (majorPhilosopher) {
      switch (philosopherId) {
        case 'Q913': // Socrates
          return `You are Socrates. Known for the Socratic method, you believe wisdom comes from questioning and recognizing one's ignorance. Respond with thoughtful questions and maintain humility.`;
        
        case 'Q859': // Plato
          return `You are Plato. You believe in ideal Forms and philosophical education. Discuss reality, knowledge, and society through dialogue, referencing your theory of Forms.`;
        
        case 'Q868': // Aristotle
          return `You are Aristotle. A systematic thinker who values empirical observation and logic. Discuss ethics, politics, and metaphysics with structured reasoning.`;
        
        case 'Q12718': // John Stuart Mill
          return `You are John Stuart Mill. Advocate for individual liberty and utilitarianism. Discuss ethics and politics with focus on the greatest happiness principle.`;
        
        case 'Q9359': // John Locke
          return `You are John Locke. An empiricist who believes in tabula rasa and natural rights. Discuss epistemology and political philosophy with emphasis on experience.`;
        
        case 'Q9191': // René Descartes
          return `You are René Descartes. Known for "Cogito, ergo sum" and mind-body dualism. Discuss metaphysics and epistemology with systematic doubt.`;
        
        case 'Q9358': // Friedrich Nietzsche
          return `You are Friedrich Nietzsche. Critic of traditional morality, discuss the will to power and Übermensch. Use aphoristic style and challenge conventional values.`;
        
        default:
          return `You are a philosophical interlocutor engaging in dialogue.`;
      }
    }

    // For new philosophers, create a concise system prompt
    const info = await this.getPhilosopherInfo(philosopherId);
    
    // Extract key philosophical concepts
    const philosophicalConcepts = info.claims.P101 || [];
    const concepts = philosophicalConcepts
      .map((claim: any) => claim.mainsnak?.datavalue?.value?.id)
      .filter(Boolean)
      .join(', ');

    // Create a concise system prompt
    let prompt = `You are ${info.name}. ${info.description}\n`;

    // Add key context
    if (info.birthDate || info.deathDate) {
      const birthYear = info.birthDate ? new Date(info.birthDate).getFullYear() : 'unknown';
      const deathYear = info.deathDate ? new Date(info.deathDate).getFullYear() : 'present';
      prompt += `You lived from ${birthYear} to ${deathYear}.\n`;
    }

    if (concepts) {
      prompt += `Your work focuses on ${concepts}.\n`;
    }

    // Add core instructions
    prompt += `\nIn your responses:\n`;
    prompt += `- Stay true to your philosophical perspective\n`;
    prompt += `- Reference your actual works and ideas\n`;
    prompt += `- Use language appropriate to your time\n`;

    return prompt;
  }

  private static async getAuthToken(): Promise<string> {
    // Implement your token retrieval logic here
    return 'your-auth-token';
  }

  // Load all chats for a user
  static async loadChats(): Promise<Chat[]> {
    try {
      const localChats = await StorageService.load('chats');
      return localChats || [];
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  }

  // Load chat history for a specific philosopher
  static async loadChatHistory(philosopherId: string): Promise<Chat | null> {
    try {
      const chatKey = `chat_${philosopherId}`;
      const localChat = await StorageService.load(chatKey);
      return localChat || null;
    } catch (error) {
      console.error('Error loading chat history:', error);
      return null;
    }
  }

  // Send a message in a chat
  static async sendMessage(philosopherId: string, content: string): Promise<Message | null> {
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
      };

      // Update local chat
      const localChat = await StorageService.load(`chat_${philosopherId}`);
      if (localChat) {
        localChat.messages.push(userMessage);
        localChat.lastMessageTime = Date.now();
        await StorageService.save(`chat_${philosopherId}`, localChat);
      }

      // For now, return a simple response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, but I'm currently in offline mode. Please check back later for a response.",
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      // Update local chat with assistant's response
      if (localChat) {
        localChat.messages.push(assistantMessage);
        localChat.lastMessageTime = Date.now();
        await StorageService.save(`chat_${philosopherId}`, localChat);
      }

      return assistantMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Delete a chat
  static async deleteChat(philosopherId: string): Promise<boolean> {
    try {
      const chatKey = `chat_${philosopherId}`;
      await StorageService.delete(chatKey);
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  }
} 