import { MAJOR_PHILOSOPHERS } from '../utils/philosophers';
import { constructWikidataUrl } from '../utils/wikidataApi';

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

  static async sendMessage(philosopherId: string, message: string, conversationHistory: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const systemPrompt = await this.getPhilosopherSystemPrompt(philosopherId);
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...conversationHistory,
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(`Failed to get response from OpenAI: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('Error in PhilosopherChatService:', error);
      throw new Error(`Failed to get AI response: ${error.message || 'Unknown error'}`);
    }
  }
} 