import React from 'react';
import { AgentProfile } from '../../types/agent';
import { AgentCard } from './AgentCard';

interface AgentGridProps {
    agents: AgentProfile[];
    onSelectAgent: (agentId: string) => void;
}

export const AgentGrid: React.FC<AgentGridProps> = ({ agents, onSelectAgent }) => {
    return (
        <div className="container">
            <header className="hub-header">
                <span className="hub-title-badge">ETA AGENTS COLLECTIVE</span>
                <h1 className="hub-title">PROJECT ETADAM</h1>
                <p className="hub-subtitle">Advanced Multi-Agent Command Interface</p>
            </header>

            <main>
                <div className="slots-grid">
                    {agents.map((agent) => (
                        <AgentCard 
                            key={agent.id} 
                            agent={agent} 
                            onSelect={onSelectAgent} 
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};
