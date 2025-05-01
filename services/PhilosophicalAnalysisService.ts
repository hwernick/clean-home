import { PhilosophicalAnalysis } from '../types/philosophy';

export class PhilosophicalAnalysisService {
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly MODEL = 'gpt-3.5-turbo';
  
  static async analyzePhilosophicalViewpoint(conversationHistory: string): Promise<PhilosophicalAnalysis> {
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
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: `Please analyze my philosophical viewpoint based on the following conversation history:\n\n${conversationHistory}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze philosophical viewpoint');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  private static getSystemPrompt(): string {
    return `You are an expert in philosophical analysis. Your task is to analyze the user's philosophical viewpoint based on their conversation history. 
              
Identify:
1. Which philosophical school or tradition their thinking most closely aligns with
2. Which philosophers or philosophical works have likely influenced their thinking
3. Key themes and recurring ideas in their philosophical discourse
4. Strengths in their philosophical reasoning
5. Areas where their philosophical thinking could be developed further

Provide a concise summary of their overall philosophical perspective.

Format your response as a JSON object with the following structure:
{
  "school": "Name of the philosophical school or tradition",
  "influences": ["Philosopher 1", "Philosopher 2", "Work 1", "Work 2"],
  "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasForGrowth": ["Area 1", "Area 2", "Area 3"],
  "summary": "A concise paragraph summarizing their philosophical perspective"
}`;
  }
} 