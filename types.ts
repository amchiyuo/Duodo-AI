
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
  excludeFromHistory?: boolean;
  startTime?: number;
  endTime?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  modelId: string;
  difyConversationId?: string; // Dify API 外部会话 ID (用于维持 API 链路)
  innerConversationId?: string; // 工作流内部业务 ID (用于维持智能体上下文)
}

export interface DifyModelConfig {
  id: string;
  name: string;
  difyApiKey: string;
  clinkAk: string;
  clinkSk: string;
  agentId: string;
}

export interface SavedSystemPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string;
  isLoading: boolean;
}
