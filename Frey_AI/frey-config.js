/**
 * F.R.E.Y. Module Configuration
 * Fault-tolerant Responsive Execution Yield
 * Autonomous Market Intelligence & Quantitative Trading Engine (EURUSD & ETHUSD)
 */

const FREY_CONFIG = {
    id: "frey",
    codeName: "Zeta",
    name: "F.R.E.Y.",
    fullName: "Fault-tolerant Responsive Execution Yield",
    domain: "Autonomous Market Intelligence & Quantitative Trading",
    specialization: ["XAUUSD (Gold Spot)", "BTCUSD (Bitcoin)", "EURUSD (Forex Major)", "ETHUSD (Crypto CFD)"],
    status: "ACTIVE",
    version: "2.1.0-QuadAsset",
    accountBalance: 100.00,
    maxRiskPerTrade: 3.00,
    dailyLossLimit: 6.00,
    maxOpenPositions: 1,

    // Market Profiles
    assets: {
        XAUUSD: {
            name: "XAUUSD",
            type: "Precious Metals",
            basePrice: 2742.50,
            spread: "$0.35",
            timeframes: ["M15", "H1", "H4"],
            activeTimeframe: "M15",
            contractSize: 100.0,
            pipSize: 0.01,
            slMultiplier: 1.8,
            minRR: 1.5,
            activeSessions: "London & New York Overlap"
        },
        BTCUSD: {
            name: "BTCUSD",
            type: "Leading Crypto",
            basePrice: 67850.00,
            spread: "$12.00",
            timeframes: ["H1", "H4", "D1"],
            activeTimeframe: "H1",
            contractSize: 1.0,
            pipSize: 0.01,
            slMultiplier: 2.2,
            minRR: 2.0,
            activeSessions: "24/7 Global Crypto"
        },
        EURUSD: {
            name: "EURUSD",
            type: "Forex Major",
            basePrice: 1.0865,
            spread: "1.2 pips",
            timeframes: ["M15", "H1", "H4"],
            activeTimeframe: "M15",
            contractSize: 100000,
            pipSize: 0.0001,
            slMultiplier: 1.5,
            minRR: 1.5,
            activeSessions: "London & New York Overlap"
        },
        ETHUSD: {
            name: "ETHUSD",
            type: "Crypto CFD",
            basePrice: 2645.00,
            spread: "$1.80",
            timeframes: ["H1", "H4", "D1"],
            activeTimeframe: "H1",
            contractSize: 1.0,
            pipSize: 0.01,
            slMultiplier: 2.0,
            minRR: 2.0,
            activeSessions: "24/7 Global Crypto"
        }
    }
};

// Export to global scope
if (typeof window !== 'undefined') {
    window.FREY_CONFIG = FREY_CONFIG;
}
