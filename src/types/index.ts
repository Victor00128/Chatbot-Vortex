export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  type: 'image' | 'pdf' | 'zip' | 'code' | 'text' | 'csv' | 'json' | 'audio' | 'video' | 'other';
  preview?: string;
  content?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  extension: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isTyping?: boolean;
  attachments?: FileAttachment[];
  deleted?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'light' | 'dark';

export type AIProvider = 'groq' | 'openai' | 'gemini' | 'deepseek' | 'openrouter' | 'offline';

export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  baseUrl: string;
  models: { id: string; name: string; description: string }[];
  free: boolean;
  apiKeyUrl: string;
}

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  sidebarOpen: boolean;
}
