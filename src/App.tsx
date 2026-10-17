import React, { useState } from 'react';
import { getAllAgents, getAgentConfig } from './core/AgentRegistry';
import { AgentGrid } from './components/Hub/AgentGrid';
import { ChatInterface } from './components/Chat/ChatInterface';
import './styles/tech-slate.css';

export const App: React.FC = () => {
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const agents = getAllAgents();
    const activeAgent = selectedAgentId ? getAgentConfig(selectedAgentId) : null;

    return (
        <div className="app-root">
            {activeAgent ? (
                <ChatInterface 
                    agent={activeAgent} 
                    onBackToHub={() => setSelectedAgentId(null)} 
                />
            ) : (
                <AgentGrid 
                    agents={agents} 
                    onSelectAgent={(agentId) => setSelectedAgentId(agentId)} 
                />
            )}
        </div>
    );
};

export default App;
