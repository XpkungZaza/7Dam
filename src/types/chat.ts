export type MessageRole = 'user' | 'agent' | 'system';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
}

export interface ChatThread {
    id: string;
    agentId: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}
