import React from 'react';
import { AgentProfile } from '../../types/agent';
import { Bot, Shield, Terminal, Cpu, GraduationCap, Palette, Navigation, Lock } from 'lucide-react';

interface AgentCardProps {
    agent: AgentProfile;
    onSelect: (agentId: string) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect }) => {
    const isLocked = agent.status === 'LOCKED';

    const getIcon = () => {
        switch (agent.id) {
            case 'torine': return <Bot className="w-6 h-6" />;
            case 'zenith': return <Navigation className="w-6 h-6" />;
            case 'freedom': return <Terminal className="w-6 h-6" />;
            case 'morgan': return <Cpu className="w-6 h-6" />;
            case 'agent05': return <GraduationCap className="w-6 h-6" />;
            case 'frey': return <Palette className="w-6 h-6" />;
            case 'agent07': return <Shield className="w-6 h-6" />;
            default: return <Lock className="w-6 h-6" />;
        }
    };

    return (
        <div 
            className={`slot-card ${agent.status.toLowerCase()} ${agent.status === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => !isLocked && onSelect(agent.id)}
        >
            <div className="card-top">
                <span className="greek-tag">{agent.codeName}</span>
                <span className={`status-badge ${agent.status}`}>
                    {agent.status === 'ACTIVE' ? 'ACTIVE' : agent.status === 'IN_PROCESS' ? 'IN PROCESS' : 'LOCKED'}
                </span>
            </div>

            <div className="agent-icon-box">
                {getIcon()}
            </div>

            <h3 className="slot-name">{agent.name}</h3>
            <p className="slot-full-name">{agent.fullName}</p>
            <span className="domain-pill">{agent.domain}</span>
        </div>
    );
};
