/**
 * Project Etadam (Project 7Dam) - Central Agent Registry
 * Manages configuration and status for all 7 AI Agents
 */

const AGENT_REGISTRY = {
    torine: typeof TORINE_CONFIG !== 'undefined' ? TORINE_CONFIG : {
        id: "torine",
        codeName: "Alpha",
        name: "T.O.R.I.N.E.",
        fullName: "Tactical Omni-lingual Recursive Intelligence for Neo Education",
        domain: "Japanese Language & Neo Education",
        status: "ACTIVE"
    },
    zenith: {
        id: "zenith",
        codeName: "Beta",
        name: "Z.E.N.I.T.H.",
        fullName: "Zero-error Enhanced Navigational Intelligence & Trajectory Heuristics",
        domain: "Navigation, Data Strategy & Trajectory Planning",
        status: "IN_PROCESS"
    },
    freedom: {
        id: "freedom",
        codeName: "Gamma",
        name: "F.R.E.E.D.O.M.",
        fullName: "Fault Recognition & Execution Engine for Debugging, Optimization & Maintenance",
        domain: "Software Engineering, Code Debugging & System Maintenance",
        status: "IN_PROCESS"
    },
    morgan: {
        id: "morgan",
        codeName: "Delta",
        name: "M.O.R.G.A.N.",
        fullName: "Multi-Objective Robotic Grid & Autonomous Nexus",
        domain: "Robotics, Automation & Grid Networks",
        status: "IN_PROCESS"
    },
    agent05: {
        id: "agent05",
        codeName: "Epsilon",
        name: "AGENT 05",
        fullName: "Graduation Project AI (Classified)",
        domain: "Graduation Project Specialist",
        status: "IN_PROGRESS"
    },
    frey: typeof FREY_CONFIG !== 'undefined' ? FREY_CONFIG : {
        id: "frey",
        codeName: "Zeta",
        name: "F.R.E.Y.",
        fullName: "Fault-tolerant Responsive Execution Yield",
        domain: "Autonomous Market Intelligence & Quantitative Trading (EURUSD & ETHUSD)",
        status: "ACTIVE"
    },
    agent07: {
        id: "agent07",
        codeName: "Eta",
        name: "AGENT 07",
        fullName: "Classified",
        domain: "Cybersecurity & Security Operations",
        status: "LOCKED"
    }
};

/**
 * Get Agent Configuration by ID
 * @param {string} agentId 
 * @returns {object|null}
 */
function getAgentConfig(agentId) {
    // Refresh TORINE_CONFIG reference if loaded
    if (agentId === 'torine' && typeof TORINE_CONFIG !== 'undefined') {
        return TORINE_CONFIG;
    }
    return AGENT_REGISTRY[agentId] || null;
}

if (typeof window !== 'undefined') {
    window.AGENT_REGISTRY = AGENT_REGISTRY;
    window.getAgentConfig = getAgentConfig;
}
