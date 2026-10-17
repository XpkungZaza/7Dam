import sys
import logging
import MetaTrader5 as mt5
from market_data import connect_mt5, get_ohlcv
from indicators import calculate_all_indicators
from risk_manager import calculate_position_size, suggest_stop_loss
from coach_context import build_market_context

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("FreyAI_Main")


def run_pipeline(symbol: str = "ETHUSD", timeframe: str = "H1", account_balance: float = 100.0, max_risk_usd: float = 3.0):
    logger.info(f"=== Starting Frey AI Pipeline for {symbol} ({timeframe}) ===")

    # 1. Connect to MT5
    connected = connect_mt5()
    if not connected:
        logger.error("Could not connect to MT5. Please make sure MetaTrader 5 terminal is running and Algo Trading is enabled.")
        return

    try:
        # 2. Fetch OHLCV Data
        df = get_ohlcv(symbol=symbol, timeframe=timeframe, count=300)
        if df is None or df.empty:
            logger.error("Failed to retrieve market data.")
            return

        # 3. Calculate Indicators
        df = calculate_all_indicators(df, ema_periods=[20, 50], rsi_period=14, atr_period=14)

        # Extract latest candle metrics
        latest = df.iloc[-1]
        current_price = float(latest["close"])
        atr_val = float(latest["ATR_14"])

        # Determine tentative direction based on EMA trend
        direction = "BUY" if latest["EMA_20"] >= latest["EMA_50"] else "SELL"
        suggested_sl = suggest_stop_loss(current_price, atr_val, direction=direction, multiplier=1.5)

        # 4. Calculate Risk & Position Sizing
        risk_info = calculate_position_size(
            symbol=symbol,
            entry_price=current_price,
            sl_price=suggested_sl,
            max_risk_usd=max_risk_usd,
            account_balance=account_balance
        )

        # 5. Build Coach Context for LLM
        context_md = build_market_context(
            df=df,
            risk_info=risk_info,
            symbol=symbol,
            timeframe=timeframe,
            account_balance=account_balance,
            output_format="markdown"
        )

        print("\n" + "=" * 60)
        print("🤖 FREY AI LLM INJECTION CONTEXT GENERATED:")
        print("=" * 60)
        print(context_md)
        print("=" * 60 + "\n")

        return {
            "df": df,
            "risk_info": risk_info,
            "context_prompt": context_md
        }

    finally:
        mt5.shutdown()
        logger.info("MT5 connection closed.")


if __name__ == "__main__":
    target_symbol = sys.argv[1] if len(sys.argv) > 1 else "ETHUSD"
    run_pipeline(symbol=target_symbol, timeframe="H1", account_balance=100.0, max_risk_usd=3.0)
