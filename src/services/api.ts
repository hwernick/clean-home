import { Message } from '../types';

const API_URL = 'https://classicai-backend.onrender.com';

export const sendMessage = async (messages: Message[]): Promise<string> => {
  try {
    console.log('Sending request to:', `${API_URL}/api/chat`);
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server response:', response.status, errorData);
      throw new Error(`Server error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Detailed error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
    throw error;
  }
}; 