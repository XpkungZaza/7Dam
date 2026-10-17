"""
asset_config.py - Specialized Asset Profiles for Frey AI (XAUUSD, BTCUSD, EURUSD & ETHUSD)
"""

from typing import Dict, Any

# Dedicated profiles for Frey AI's specialized assets
ASSET_PROFILES: Dict[str, Dict[str, Any]] = {
    "XAUUSD": {
        "asset_type": "COMMODITY_PRECIOUS_METAL",
        "symbol_key": "XAUUSD",
        "description": "Gold / US Dollar Spot & CFD",
        "default_timeframe": "M15",
        "secondary_timeframe": "H1",
        "contract_size": 100.0,  # 1 standard lot = 100 troy ounces
        "pip_size": 0.01,
        "digits": 2,
        "max_allowable_spread_usd": 0.45,
        "atr_sl_multiplier": 1.8,  # Dynamic buffer for Gold volatility
        "atr_tp_multiplier": 2.8,
        "min_rr_ratio": 1.5,
        "trading_sessions": ["LONDON", "NEW_YORK"],
        "llm_persona_focus": (
            "Focus on US Dollar DXY strength/weakness, 10-Year Treasury Yields, "
            "Safe-Haven Geopolitical Flows, London/NY Overlap Volume (19:00 - 23:00 BKK), "
            "and Clean Key Support/Resistance Reversals. Caution during High-Impact USD Data (CPI, NFP, FOMC)."
        )
    },
    "BTCUSD": {
        "asset_type": "CRYPTO_MAJOR",
        "symbol_key": "BTCUSD",
        "description": "Bitcoin / US Dollar Leading Cryptocurrency",
        "default_timeframe": "H1",
        "secondary_timeframe": "H4",
        "contract_size": 1.0,  # 1 lot = 1 BTC
        "pip_size": 0.01,
        "digits": 2,
        "max_allowable_spread_usd": 15.0,
        "atr_sl_multiplier": 2.2,  # Wide cushion against crypto wicks & liquidity sweeps
        "atr_tp_multiplier": 3.5,
        "min_rr_ratio": 1.5,
        "trading_sessions": ["24/7"],
        "llm_persona_focus": (
            "Focus on Macro Halving Cycle, Institutional Spot ETF Flow Inflows/Outflows, "
            "Key $1,000 / $5,000 Psychological Round Numbers, EMA 20/50 Trend Alignment, "
            "and Weekend Low-Liquidity Stop Sweeps. Alert when RSI reaches Extended Overbought/Oversold."
        )
    },
    "EURUSD": {
        "asset_type": "FOREX_MAJOR",
        "symbol_key": "EURUSD",
        "description": "Euro / US Dollar Major Forex Pair",
        "default_timeframe": "M15",
        "secondary_timeframe": "H1",
        "contract_size": 100000.0,
        "pip_size": 0.0001,
        "digits": 5,
        "max_allowable_spread_pips": 2.5,
        "atr_sl_multiplier": 1.5,
        "atr_tp_multiplier": 2.5,
        "min_rr_ratio": 1.5,
        "trading_sessions": ["LONDON", "NEW_YORK"],
        "llm_persona_focus": (
            "Focus on Session Highs/Lows, London/NY Breakouts, USD Macro Bias, "
            "and Clean EMA Pullbacks. Avoid trading during major High-Impact USD/EUR News (CPI/NFP/FOMC)."
        )
    },
    "ETHUSD": {
        "asset_type": "CRYPTO_CFD",
        "symbol_key": "ETHUSD",
        "description": "Ethereum / US Dollar Cryptocurrency CFD",
        "default_timeframe": "H1",
        "secondary_timeframe": "H4",
        "contract_size": 1.0,
        "pip_size": 0.01,
        "digits": 2,
        "max_allowable_spread_usd": 3.0,
        "atr_sl_multiplier": 2.0,  # Wider buffer for crypto volatility
        "atr_tp_multiplier": 3.0,
        "min_rr_ratio": 1.5,
        "trading_sessions": ["24/7"],
        "llm_persona_focus": (
            "Focus on Trend Continuations, EMA 20/50 Dynamic Support/Resistance, "
            "RSI Divergence/Exhaustion, and 24/7 Crypto Momentum. Watch out for weekend liquidity sweeps."
        )
    }
}


def get_asset_profile(symbol: str) -> Dict[str, Any]:
    """
    Retrieves the specialized profile for XAUUSD, BTCUSD, EURUSD or ETHUSD.
    Handles broker symbol variations (e.g. 'XAUUSD.m', 'GOLD', 'BTCUSD_i', 'EURUSD.m').
    """
    clean_symbol = symbol.upper()
    if "XAU" in clean_symbol or "GOLD" in clean_symbol:
        return ASSET_PROFILES["XAUUSD"]
    elif "BTC" in clean_symbol:
        return ASSET_PROFILES["BTCUSD"]
    elif "EUR" in clean_symbol and "USD" in clean_symbol:
        return ASSET_PROFILES["EURUSD"]
    elif "ETH" in clean_symbol:
        return ASSET_PROFILES["ETHUSD"]
    else:
        return {
            "asset_type": "GENERIC",
            "symbol_key": symbol,
            "description": symbol,
            "default_timeframe": "H1",
            "contract_size": 1.0,
            "pip_size": 0.01,
            "atr_sl_multiplier": 1.5,
            "atr_tp_multiplier": 2.0,
            "min_rr_ratio": 1.5,
            "llm_persona_focus": "Standard technical analysis and trend following."
        }
