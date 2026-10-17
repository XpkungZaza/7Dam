import { AgentProfile } from '../types/agent';
import { TORINE_AGENT } from '../agents/Alpha_Torine/config';

export const AGENT_REGISTRY: Record<string, AgentProfile> = {
    torine: TORINE_AGENT,
    zenith: {
        id: "zenith",
        codeName: "Beta",
        name: "Z.E.N.I.T.H.",
        fullName: "Zero-error Enhanced Navigational Intelligence & Trajectory Heuristics",
        domain: "Navigation, Data Strategy & Trajectory Planning",
        status: "IN_PROCESS",
        subtitle: "Tactical Navigation & Data Strategy",
        capabilities: ["Trajectory Optimization", "Data Stream Analysis", "Pathfinding Algorithms"]
    },
    freedom: {
        id: "freedom",
        codeName: "Gamma",
        name: "F.R.E.E.D.O.M.",
        fullName: "Fault Recognition & Execution Engine for Debugging, Optimization & Maintenance",
        domain: "Software Engineering, Code Debugging & System Maintenance",
        status: "IN_PROCESS",
        subtitle: "System Engineer & Debugging Engine",
        capabilities: ["Static Code Analysis", "Automated Refactoring", "Memory Leak Hunter"]
    },
    morgan: {
        id: "morgan",
        codeName: "Delta",
        name: "M.O.R.G.A.N.",
        fullName: "Multi-Objective Robotic Grid & Autonomous Nexus",
        domain: "Robotics, Automation & Grid Networks",
        status: "IN_PROCESS",
        subtitle: "Robotic Grid & IoT Controller",
        capabilities: ["Hardware Telemetry", "Grid Optimization", "Autonomous Agent Routing"]
    },
    agent05: {
        id: "agent05",
        codeName: "Epsilon",
        name: "AGENT 05",
        fullName: "Graduation Project AI (Classified)",
        domain: "Graduation Project Specialist",
        status: "LOCKED",
        subtitle: "Senior High Graduation AI Project",
        capabilities: ["Classified Domain"]
    },
    frey: {
        id: "frey",
        codeName: "Zeta",
        name: "F.R.E.Y.",
        fullName: "Fault-tolerant Responsive Execution Yield",
        domain: "Creative Design, Art & Content Synthesis",
        status: "IN_PROCESS",
        subtitle: "Creative Design & Asset Synthesizer",
        capabilities: ["UI/UX Mockup Generation", "Color Palette Curation", "Design System Engineering"]
    },
    agent07: {
        id: "agent07",
        codeName: "Eta",
        name: "AGENT 07",
        fullName: "Classified",
        domain: "Cybersecurity & Security Operations",
        status: "LOCKED",
        subtitle: "Security Operations Specialist",
        capabilities: ["Threat Intelligence", "Vulnerability Auditing"]
    }
};

export function getAgentConfig(agentId: string): AgentProfile | null {
    return AGENT_REGISTRY[agentId] || null;
}

export function getAllAgents(): AgentProfile[] {
    return Object.values(AGENT_REGISTRY);
}
