import React, { useState } from 'react';
import { AgentProfile } from '../../types/agent';
import { ChatMessage } from '../../types/chat';
import { sendAgentMessage } from '../../core/GroqAdapter';
import { KanaDojo } from '../../agents/Alpha_Torine/components/KanaDojo';
import { ArrowLeft, Send, Sparkles, MessageSquare, ShieldAlert, Award } from 'lucide-react';

interface ChatInterfaceProps {
    agent: AgentProfile;
    onBackToHub: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent, onBackToHub }) => {
    const [viewMode, setViewMode] = useState<'chat' | 'dojo'>('chat');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init',
            role: 'system',
            content: `${agent.name} (${agent.codeName}) Communication Channel Initialized. Ready for input.`,
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: 'user_' + Date.now(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await sendAgentMessage(agent, userMsg.content);
            const agentMsg: ChatMessage = {
                id: 'agent_' + Date.now(),
                role: 'agent',
                content: aiResponse,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: 'err_' + Date.now(),
                role: 'system',
                content: 'Error communicating with AI Agent API.',
                timestamp: Date.now()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="agent-layout">
            <div className="chat-area">
                <header className="chat-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="back-btn" onClick={onBackToHub}>
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Hub</span>
                        </button>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                                {agent.name} <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>({agent.codeName})</span>
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{agent.fullName}</p>
                        </div>
                    </div>

                    {/* Torine Special Mode Switcher */}
                    {agent.id === 'torine' && (
                        <div className="mode-toggle-group" style={{ display: 'flex', gap: '0.5rem', background: 'var(--slate-850)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--slate-700)' }}>
                            <button 
                                className={`mode-btn ${viewMode === 'chat' ? 'active' : ''}`}
                                onClick={() => setViewMode('chat')}
                                style={{
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    background: viewMode === 'chat' ? 'var(--accent-primary)' : 'transparent',
                                    color: '#ffffff',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Communication Channel</span>
                            </button>
                            <button 
                                className={`mode-btn ${viewMode === 'dojo' ? 'active' : ''}`}
                                onClick={() => setViewMode('dojo')}
                                style={{
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    background: viewMode === 'dojo' ? 'var(--accent-emerald)' : 'transparent',
                                    color: '#ffffff',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}
                            >
                                <Award className="w-3.5 h-3.5" />
                                <span>KanaDOJO</span>
                            </button>
                        </div>
                    )}
                </header>

                {viewMode === 'dojo' && agent.id === 'torine' ? (
                    <KanaDojo onSpeak={(text) => agent.speak && agent.speak(text)} />
                ) : (
                    <>
                        <div className="messages-container">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`message-bubble ${msg.role}`}>
                                    <p>{msg.content}</p>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="message-bubble agent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                                    <span>{agent.name} is processing response...</span>
                                </div>
                            )}
                        </div>

                        <div className="chat-input-bar">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder={`Message ${agent.name}...`}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading}
                            />
                            <button className="send-btn" onClick={handleSend} disabled={isLoading}>
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
