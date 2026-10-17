import { AgentProfile } from '../types/agent';

const GROQ_API_KEY = "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";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

export async function sendAgentMessage(agent: AgentProfile, userMessage: string): Promise<string> {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const systemPrompt = agent.systemPrompt || `You are ${agent.name}, an AI specialist in ${agent.domain}.`;
    const model = agent.model || DEFAULT_MODEL;
    const temperature = agent.temperature ?? 0.7;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                temperature: temperature
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse: string = data.choices[0]?.message?.content || "No response received.";

        // Execute Speech Synthesis if supported by Agent
        if (agent.speak) {
            agent.speak(aiResponse);
        }

        return aiResponse;
    } catch (error: any) {
        console.error('Groq Error:', error);
        return `ขออภัยครับมาสเตอร์ ระบบ Groq ขัดข้อง: ${error.message || error}`;
    }
}
