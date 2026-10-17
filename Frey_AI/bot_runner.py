"""
bot_runner.py - Main Autonomous Loop Runner for Frey AI
Coordinates EURUSD & ETHUSD analysis, risk checks, LLM decisions, and MT5 execution.
"""

import os
import sys
import time
import logging
from datetime import datetime
import MetaTrader5 as mt5

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from market_data import connect_mt5, get_ohlcv
from indicators import calculate_all_indicators
from risk_manager import calculate_position_size, suggest_stop_loss
from coach_context import build_market_context
from asset_config import get_asset_profile
from safety_guard import SafetyGuard, MAGIC_NUMBER
from order_executor import OrderExecutor
from ai_agent import FreyAIAgent
from position_tracker import PositionTracker
from database import TradeDatabase
from notifier import Notifier

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("FreyAIBot")


class FreyAIBot:
    def __init__(self, mode: str = "DRY_RUN", account_balance: float = 100.0, max_risk_usd: float = 3.0):
        """
        Modes:
          - 'DRY_RUN': Analyzes market, evaluates rules, logs decisions without executing.
          - 'ADVISOR': Analyzes and sends notification alerts for manual approval.
          - 'AUTO': Fully autonomous execution on MT5 with strict safety guardrails.
        """
        self.mode = mode.upper()
        self.account_balance = account_balance
        self.max_risk_usd = max_risk_usd

        # Initialize sub-components
        self.guard = SafetyGuard(max_daily_loss_usd=6.0, max_open_positions=1, max_risk_per_trade_usd=max_risk_usd)
        self.executor = OrderExecutor(magic_number=MAGIC_NUMBER)
        self.agent = FreyAIAgent()
        self.tracker = PositionTracker(self.executor)
        self.db = TradeDatabase()
        self.notifier = Notifier()

        self.last_candle_times = {"EURUSD": None, "ETHUSD": None}

    def run_cycle_for_symbol(self, symbol: str, timeframe: str):
        profile = get_asset_profile(symbol)
        logger.info(f"\n--- 🔍 Checking {symbol} [{timeframe}] ({profile['description']}) ---")

        # 1. Fetch Market Data
        df = get_ohlcv(symbol=symbol, timeframe=timeframe, count=300)
        if df is None or df.empty:
            logger.warning(f"Could not retrieve data for {symbol}.")
            return

        # 2. Check if a new candle has closed
        latest_candle_time = str(df["time"].iloc[-1])
        if self.last_candle_times.get(symbol) == latest_candle_time:
            # Same candle, skip analysis to avoid noise
            return
        self.last_candle_times[symbol] = latest_candle_time
        logger.info(f"🕯️ New candle closed on {symbol} [{timeframe}] at {latest_candle_time}")

        # 3. Calculate Technical Indicators
        df = calculate_all_indicators(df, ema_periods=[20, 50], rsi_period=14, atr_period=14)
        latest = df.iloc[-1]
        current_price = float(latest["close"])
        atr_val = float(latest["ATR_14"])

        # Determine direction bias & SL
        bias = "BUY" if latest["EMA_20"] >= latest["EMA_50"] else "SELL"
        sl_mult = profile.get("atr_sl_multiplier", 1.5)
        suggested_sl = suggest_stop_loss(current_price, atr_val, direction=bias, multiplier=sl_mult)

        # 4. Precision Risk Calculation (Strict $3.00 Cap)
        risk_info = calculate_position_size(
            symbol=symbol,
            entry_price=current_price,
            sl_price=suggested_sl,
            max_risk_usd=self.max_risk_usd,
            account_balance=self.account_balance
        )

        # 5. Build Coach Context for LLM
        prompt_context = build_market_context(
            df=df,
            risk_info=risk_info,
            symbol=symbol,
            timeframe=timeframe,
            account_balance=self.account_balance,
            output_format="markdown"
        )

        # 6. LLM Decision Analysis
        decision = self.agent.analyze_market(prompt_context, symbol)
        action = decision.get("action", "WAIT").upper()
        confidence = decision.get("confidence_score", 0.0)

        # Log AI decision to SQLite
        self.db.log_ai_decision(symbol, timeframe, decision, current_price)

        logger.info(f"🤖 AI Decision for {symbol}: {action} (Confidence: {confidence:.2f})")
        logger.info(f"Rationale: {decision.get('technical_rationale', 'N/A')}")

        if action not in ["BUY", "SELL"]:
            return

        # Calculate TP based on minimum R:R
        rr = profile.get("min_rr_ratio", 1.5)
        sl_dist = abs(current_price - suggested_sl)
        tp_price = round(current_price + (sl_dist * rr) if action == "BUY" else current_price - (sl_dist * rr), profile.get("digits", 2))

        # 7. Pass through Safety Guardrails
        is_safe, safety_msg = self.guard.validate_trade_request(symbol, risk_info)
        if not is_safe:
            logger.warning(f"🛑 Trade for {symbol} BLOCKED by Safety Guard: {safety_msg}")
            self.notifier.notify(f"⚠️ FREY AI BLOCKED TRADE ({symbol})", f"Reason: {safety_msg}")
            return

        # 8. Execution based on Operating Mode
        lot_size = risk_info["lot_size"]
        trade_summary = (
            f"Symbol: {symbol}\nAction: {action} {lot_size} lots @ {current_price}\n"
            f"SL: {suggested_sl} | TP: {tp_price}\nRisk: ${risk_info.get('estimated_loss_usd')} USD\n"
            f"Confidence: {confidence:.2f}\nRationale: {decision.get('technical_rationale')}"
        )

        if self.mode == "DRY_RUN":
            logger.info(f"🧪 [DRY RUN] Simulated Execution:\n{trade_summary}")
            self.notifier.notify(f"🧪 DRY RUN SIGNAL ({symbol})", trade_summary)

        elif self.mode == "ADVISOR":
            logger.info(f"📢 [ADVISOR] Signal alert sent for approval:\n{trade_summary}")
            self.notifier.notify(f"📢 NEW TRADE SIGNAL ({symbol})", trade_summary)

        elif self.mode == "AUTO":
            logger.info(f"⚡ [AUTO] Executing live order on MT5...")
            order_res = self.executor.send_market_order(
                symbol=symbol,
                action=action,
                lot_size=lot_size,
                stop_loss=suggested_sl,
                take_profit=tp_price,
                comment=f"Frey_{symbol}_{decision.get('strategy_tags', ['AI'])[0]}"
            )

            if order_res["success"]:
                ticket = order_res["order_ticket"]
                self.db.log_trade_opened(
                    ticket=ticket,
                    symbol=symbol,
                    action=action,
                    lot_size=lot_size,
                    entry_price=order_res["price"],
                    sl=suggested_sl,
                    tp=tp_price,
                    risk_usd=risk_info.get("estimated_loss_usd", self.max_risk_usd)
                )
                self.notifier.notify(f"🚀 ORDER EXECUTED (#{ticket})", trade_summary)
            else:
                self.notifier.notify(f"❌ EXECUTION FAILED ({symbol})", f"Error: {order_res.get('error')}")

    def run_once(self):
        """Runs a single pass across both EURUSD and ETHUSD + manages active positions."""
        if not connect_mt5():
            logger.error("MT5 terminal connection failed.")
            return

        try:
            # 1. Manage existing positions (Break-Even & Trailing)
            self.tracker.monitor_and_manage()

            # 2. Check EURUSD (M15)
            self.run_cycle_for_symbol("EURUSD", "M15")

            # 3. Check ETHUSD (H1)
            self.run_cycle_for_symbol("ETHUSD", "H1")

        finally:
            mt5.shutdown()


if __name__ == "__main__":
    mode_arg = sys.argv[1] if len(sys.argv) > 1 else "DRY_RUN"
    bot = FreyAIBot(mode=mode_arg, account_balance=100.0, max_risk_usd=3.0)
    print(f"Starting Frey AI Bot in mode: [{bot.mode}]...")
    bot.run_once()
