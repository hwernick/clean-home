import { Message } from '../types';

const API_URL = 'https://classicai-backend.onrender.com';

export const sendMessage = async (messages: Message[]): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from server');
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}; 