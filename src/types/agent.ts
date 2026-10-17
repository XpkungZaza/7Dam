export type GreekCode = 'Alpha' | 'Beta' | 'Gamma' | 'Delta' | 'Epsilon' | 'Zeta' | 'Eta';

export type AgentStatus = 'ACTIVE' | 'IN_PROCESS' | 'LOCKED';

export interface AgentProfile {
    id: string;
    codeName: GreekCode;
    name: string;
    fullName: string;
    domain: string;
    status: AgentStatus;
    subtitle?: string;
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    speechConfig?: {
        lang: string;
        rate: number;
        pitch: number;
        volume: number;
    };
    capabilities?: string[];
    speak?: (text: string) => void;
}
