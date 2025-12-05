export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
  isStreaming?: boolean;
  excludeFromHistory?: boolean; // New flag to prevent system messages from polluting context
  startTime?: number; // Track when generation started
  endTime?: number; // Track when generation ended
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  model: string;
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string;
  isLoading: boolean;
}

export interface SavedSystemPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}