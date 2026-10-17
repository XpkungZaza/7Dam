import json
import sys
from typing import Dict, Any, Optional
import pandas as pd
from asset_config import get_asset_profile

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def extract_market_signals(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Extracts the latest market metrics and categorical signals from the enhanced DataFrame.
    """
    if df is None or len(df) == 0:
        raise ValueError("DataFrame is empty or None.")

    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest

    close_price = float(latest["close"])
    ema20 = float(latest.get("EMA_20", 0.0))
    ema50 = float(latest.get("EMA_50", 0.0))
    rsi = float(latest.get("RSI_14", 50.0))
    atr = float(latest.get("ATR_14", 0.0))

    # Trend Bias from EMAs
    if ema20 > ema50:
        trend_bias = "BULLISH"
        trend_desc = f"EMA 20 ({ema20:.2f}) is ABOVE EMA 50 ({ema50:.2f})"
    elif ema20 < ema50:
        trend_bias = "BEARISH"
        trend_desc = f"EMA 20 ({ema20:.2f}) is BELOW EMA 50 ({ema50:.2f})"
    else:
        trend_bias = "NEUTRAL"
        trend_desc = "EMA 20 and EMA 50 are convergent"

    # RSI Sentiment Level
    if rsi >= 70:
        rsi_condition = "OVERBOUGHT"
        rsi_desc = f"RSI 14 is at {rsi:.2f} (Potential pullback/reversal risk)"
    elif rsi <= 30:
        rsi_condition = "OVERSOLD"
        rsi_desc = f"RSI 14 is at {rsi:.2f} (Potential bounce/bottoming signal)"
    else:
        rsi_condition = "NEUTRAL"
        rsi_desc = f"RSI 14 is balanced at {rsi:.2f}"

    # Price momentum vs previous candle
    price_change = close_price - float(prev["close"])
    price_change_pct = (price_change / float(prev["close"])) * 100

    return {
        "timestamp": str(latest["time"]),
        "close_price": close_price,
        "high": float(latest["high"]),
        "low": float(latest["low"]),
        "open": float(latest["open"]),
        "volume": float(latest["volume"]),
        "ema_20": ema20,
        "ema_50": ema50,
        "trend_bias": trend_bias,
        "trend_desc": trend_desc,
        "rsi_14": rsi,
        "rsi_condition": rsi_condition,
        "rsi_desc": rsi_desc,
        "atr_14": atr,
        "price_change_pct": round(price_change_pct, 2)
    }


def build_market_context(
    df: pd.DataFrame,
    risk_info: Optional[Dict[str, Any]] = None,
    symbol: str = "ETHUSD",
    timeframe: str = "H1",
    account_balance: float = 100.0,
    output_format: str = "markdown"
) -> str:
    """
    Constructs a structured context summary formatted for Frey AI's LLM prompt.

    Parameters:
        df (pd.DataFrame): DataFrame containing indicators (EMA_20, EMA_50, RSI_14, ATR_14).
        risk_info (dict, optional): Position sizing dictionary from risk_manager.
        symbol (str): Asset name.
        timeframe (str): Candle timeframe.
        account_balance (float): Total account balance.
        output_format (str): 'markdown' (default) or 'json'.

    Returns:
        str: Ready-to-inject LLM system/user context string.
    """
    signals = extract_market_signals(df)

    if risk_info is None:
        risk_info = {}

    profile = get_asset_profile(symbol)

    context_data = {
        "account_overview": {
            "account_balance_usd": account_balance,
            "max_risk_per_trade_usd": risk_info.get("max_risk_usd", 3.0),
            "max_risk_pct": round((risk_info.get("max_risk_usd", 3.0) / account_balance) * 100, 1)
        },
        "asset_profile": {
            "symbol": symbol,
            "asset_type": profile["asset_type"],
            "description": profile["description"],
            "recommended_timeframe": profile["default_timeframe"],
            "min_rr_ratio": profile["min_rr_ratio"],
            "domain_focus": profile["llm_persona_focus"]
        },
        "market_status": {
            "symbol": symbol,
            "timeframe": timeframe,
            "timestamp": signals["timestamp"],
            "current_price": signals["close_price"],
            "atr_14_volatility": signals["atr_14"],
            "trend_bias": signals["trend_bias"],
            "trend_details": signals["trend_desc"],
            "rsi_status": signals["rsi_condition"],
            "rsi_details": signals["rsi_desc"],
            "recent_change_pct": f"{signals['price_change_pct']}%"
        },
        "risk_and_execution_parameters": {
            "suggested_lot_size": risk_info.get("lot_size", "N/A"),
            "estimated_loss_usd": risk_info.get("estimated_loss_usd", "N/A"),
            "risk_pct": f"{risk_info.get('risk_pct', 0.0)}%",
            "sl_distance": risk_info.get("sl_distance", "N/A"),
            "is_trade_valid": risk_info.get("is_valid", True),
            "risk_warning": risk_info.get("warning", "None - Risk capped strictly at $3.00")
        }
    }

    if output_format.lower() == "json":
        return json.dumps(context_data, indent=2)

    # Markdown format for LLM prompt injection
    warning_line = f"\n> ⚠️ **RISK WARNING**: {risk_info.get('warning')}" if risk_info.get("warning") else ""

    markdown_prompt = f"""### 📊 FREY AI SPECIALIZED MARKET CONTEXT ({profile['asset_type']})
**Specialized Asset**: `{symbol}` ({profile['description']})
**Timeframe**: `{timeframe}` | **Time**: `{signals['timestamp']}`
**Account Balance**: `${account_balance:.2f} USD` | **Strict Risk Cap**: `${risk_info.get('max_risk_usd', 3.0):.2f} USD` (3.0%)

---

#### 1. 📈 Price & Technical Indicators
- **Current Price**: `{signals['close_price']:.4f}`
- **Trend Bias (EMA 20/50)**: **{signals['trend_bias']}** ({signals['trend_desc']})
- **RSI (14)**: **{signals['rsi_14']:.2f}** [{signals['rsi_condition']}] - {signals['rsi_desc']}
- **ATR (14 Volatility)**: `{signals['atr_14']:.4f}`

#### 2. 🛡️ Risk & Position Sizing
- **Computed Lot Size**: `{risk_info.get('lot_size', 0.0)}` lots
- **Max Potential Loss**: `${risk_info.get('estimated_loss_usd', 0.0):.2f} USD` ({risk_info.get('risk_pct', 0.0)}% of account)
- **Stop Loss Distance**: `{risk_info.get('sl_distance', 'N/A')}`
- **Trade Execution Permitted**: `{'✅ YES' if risk_info.get('is_valid', True) else '❌ NO (Violates Risk Rule)'}`{warning_line}

#### 3. 🎯 Frey AI Specialized Focus for {symbol}
- **Strategy Directives**: {profile['llm_persona_focus']}
- **Target Risk-to-Reward**: Minimum `{profile['min_rr_ratio']}:1`

---
*Instructions for Frey AI:* Analyze the specialized market metrics above. Align your decision with the {profile['asset_type']} directives and output the final recommendation (BUY / SELL / WAIT) with entry, TP, SL, and rationale."""

    return markdown_prompt


if __name__ == "__main__":
    import numpy as np
    from indicators import calculate_all_indicators
    from risk_manager import calculate_position_size, suggest_stop_loss

    # Simulated test
    dates = pd.date_range("2026-08-16 12:00:00", periods=50, freq="h")
    sim_df = pd.DataFrame({
        "time": dates,
        "open": np.linspace(2600, 2750, 50),
        "high": np.linspace(2610, 2760, 50),
        "low": np.linspace(2590, 2740, 50),
        "close": np.linspace(2605, 2755, 50),
        "volume": np.random.randint(100, 500, 50)
    })
    sim_df = calculate_all_indicators(sim_df)

    latest_close = sim_df.iloc[-1]["close"]
    latest_atr = sim_df.iloc[-1]["ATR_14"]
    sl = suggest_stop_loss(latest_close, latest_atr, direction="BUY")
    risk = calculate_position_size("ETHUSD", latest_close, sl, max_risk_usd=3.0, account_balance=100.0)

    prompt = build_market_context(sim_df, risk, symbol="ETHUSD", timeframe="H1")
    print(prompt)
