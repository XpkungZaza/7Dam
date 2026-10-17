import sys
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from indicators import calculate_all_indicators

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


class TradePlanner:
    def __init__(self, account_balance: float = 100.0, max_risk_usd: float = 3.0):
        self.account_balance = account_balance
        self.max_risk_usd = max_risk_usd

    def analyze_long_term_horizon(self, df_higher_tf: pd.DataFrame) -> Dict[str, Any]:
        """
        Long-Term / Macro Horizon (H4 / D1 / H1):
        Identifies structural trend, major support/resistance levels, and market regime.
        """
        if df_higher_tf is None or len(df_higher_tf) < 20:
            return {"trend": "NEUTRAL", "regime": "INSUFFICIENT_DATA", "support": 0, "resistance": 0}

        df = calculate_all_indicators(df_higher_tf)
        last = df.iloc[-1]
        close = last["close"]
        ema20 = last.get("EMA_20", close)
        ema50 = last.get("EMA_50", close)

        # Recent 30 bars support & resistance
        recent_bars = df.tail(30)
        major_support = float(recent_bars["low"].min())
        major_resistance = float(recent_bars["high"].max())

        # Trend and Regime Determination
        if ema20 > ema50 and close > ema20:
            trend = "STRONG_BULLISH"
            regime = "TRENDING_EXPANSION"
        elif ema20 > ema50 and close <= ema20:
            trend = "BULLISH_PULLBACK"
            regime = "HEALTHY_RETEST"
        elif ema20 < ema50 and close < ema20:
            trend = "STRONG_BEARISH"
            regime = "TRENDING_EXPANSION"
        elif ema20 < ema50 and close >= ema20:
            trend = "BEARISH_PULLBACK"
            regime = "HEALTHY_RETEST"
        else:
            trend = "NEUTRAL"
            regime = "RANGE_CONSOLIDATION"

        return {
            "trend": trend,
            "regime": regime,
            "major_support": round(major_support, 4),
            "major_resistance": round(major_resistance, 4),
            "ema20": round(ema20, 4),
            "ema50": round(ema50, 4),
            "distance_to_support": round(abs(close - major_support), 4),
            "distance_to_resistance": round(abs(close - major_resistance), 4)
        }

    def analyze_short_term_horizon(self, df_lower_tf: pd.DataFrame) -> Dict[str, Any]:
        """
        Short-Term / Micro Horizon (M1 / M5 / M15):
        Identifies precision trigger setups, momentum exhaustion, and micro swing pivots.
        """
        if df_lower_tf is None or len(df_lower_tf) < 20:
            return {"trigger": "WAIT", "rsi": 50, "atr": 0.001}

        df = calculate_all_indicators(df_lower_tf)
        last = df.iloc[-1]
        prev = df.iloc[-2]
        close = last["close"]
        rsi = last.get("RSI_14", 50.0)
        atr = last.get("ATR_14", 0.001)

        # Recent 10 bars swing levels for tight SL placement
        micro_bars = df.tail(10)
        local_swing_low = float(micro_bars["low"].min())
        local_swing_high = float(micro_bars["high"].max())

        # Trigger conditions
        trigger = "WAIT"
        trigger_strength = "WEAK"
        trigger_reason = "No clear confluence trigger."

        if rsi < 35 and close > prev["close"]:
            trigger = "BUY_REVERSAL"
            trigger_strength = "STRONG"
            trigger_reason = f"RSI oversold rebound ({rsi:.1f}) with bullish tick reversal."
        elif rsi > 68 and close < prev["close"]:
            trigger = "SELL_REVERSAL"
            trigger_strength = "STRONG"
            trigger_reason = f"RSI overbought exhaustion ({rsi:.1f}) with bearish tick reversal."
        elif last.get("EMA_20", close) > last.get("EMA_50", close) and (close >= last.get("EMA_20", close) * 0.999):
            trigger = "BUY_CONTINUATION"
            trigger_strength = "MODERATE"
            trigger_reason = "Price bouncing off short-term EMA 20 dynamic support."
        elif last.get("EMA_20", close) < last.get("EMA_50", close) and (close <= last.get("EMA_20", close) * 1.001):
            trigger = "SELL_CONTINUATION"
            trigger_strength = "MODERATE"
            trigger_reason = "Price rejected from short-term EMA 20 dynamic resistance."

        return {
            "trigger": trigger,
            "trigger_strength": trigger_strength,
            "trigger_reason": trigger_reason,
            "current_price": round(close, 4),
            "rsi_14": round(rsi, 2),
            "atr_14": round(atr, 4),
            "local_swing_low": round(local_swing_low, 4),
            "local_swing_high": round(local_swing_high, 4)
        }

    def generate_trade_plan(
        self,
        symbol: str,
        df_long_term: pd.DataFrame,
        df_short_term: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Combines Long-term Macro Trend with Short-term Precision Trigger
        to output a complete, institutional Trade Planning Blueprint.
        """
        macro = self.analyze_long_term_horizon(df_long_term)
        micro = self.analyze_short_term_horizon(df_short_term)

        current_price = micro.get("current_price", 0.0)
        atr = micro.get("atr_14", 0.001)
        is_crypto = "ETH" in symbol.upper()

        # Decision Matrix (Align Micro with Macro)
        plan_action = "WAIT"
        plan_grade = "NO_TRADE"
        confluence_points = []

        # Bullish alignment
        if "BULLISH" in macro["trend"]:
            confluence_points.append(f"Macro Trend: {macro['trend']}")
            if "BUY" in micro["trigger"]:
                confluence_points.append(f"Micro Trigger: {micro['trigger']}")
                plan_action = "BUY"
                plan_grade = "A+" if micro["trigger_strength"] == "STRONG" else "A"

        # Bearish alignment
        elif "BEARISH" in macro["trend"]:
            confluence_points.append(f"Macro Trend: {macro['trend']}")
            if "SELL" in micro["trigger"]:
                confluence_points.append(f"Micro Trigger: {micro['trigger']}")
                plan_action = "SELL"
                plan_grade = "A+" if micro["trigger_strength"] == "STRONG" else "A"

        # Calculate exact Entry, SL, TP1, TP2, Invalidation
        sl_multiplier = 2.0 if is_crypto else 1.5
        sl_distance = max(atr * sl_multiplier, (0.0015 if not is_crypto else 15.0))

        if plan_action == "BUY":
            entry_price = current_price
            stop_loss = round(current_price - sl_distance, 4 if not is_crypto else 2)
            take_profit_1 = round(current_price + (sl_distance * 1.5), 4 if not is_crypto else 2)  # 1:1.5 R:R
            take_profit_2 = round(current_price + (sl_distance * 2.8), 4 if not is_crypto else 2)  # 1:2.8 R:R
            invalidation_level = round(macro["major_support"] - (atr * 0.5), 4 if not is_crypto else 2)
        elif plan_action == "SELL":
            entry_price = current_price
            stop_loss = round(current_price + sl_distance, 4 if not is_crypto else 2)
            take_profit_1 = round(current_price - (sl_distance * 1.5), 4 if not is_crypto else 2)
            take_profit_2 = round(current_price - (sl_distance * 2.8), 4 if not is_crypto else 2)
            invalidation_level = round(macro["major_resistance"] + (atr * 0.5), 4 if not is_crypto else 2)
        else:
            entry_price = current_price
            stop_loss = 0.0
            take_profit_1 = 0.0
            take_profit_2 = 0.0
            invalidation_level = 0.0

        # Exact Lot Sizing for $3.00 max risk
        if is_crypto:
            loss_per_lot = sl_distance * 1.0  # 1 ETH contract
        else:
            loss_per_lot = (sl_distance / 0.0001) * 10.0  # EURUSD standard pip value

        raw_lot = self.max_risk_usd / loss_per_lot if loss_per_lot > 0 else 0.01
        lot_size = round(max(0.01, raw_lot), 2)

        return {
            "symbol": symbol,
            "plan_action": plan_action,
            "plan_grade": plan_grade,
            "confluence_score": f"{len(confluence_points)}/4 Criteria Met",
            "confluence_details": confluence_points,
            "entry_point": entry_price,
            "stop_loss": stop_loss,
            "take_profit_1": take_profit_1,
            "take_profit_2": take_profit_2,
            "invalidation_level": invalidation_level,
            "risk_reward_ratio_tp1": "1:1.5 (Lock Break-Even)",
            "risk_reward_ratio_tp2": "1:2.8 (Major Expansion)",
            "calculated_lot_size": lot_size,
            "max_dollar_risk": f"${self.max_risk_usd:.2f} USD",
            "macro_overview": macro,
            "micro_overview": micro,
            "action_checklist": [
                f"1. เข้าออเดอร์ {plan_action} ที่ราคา {entry_price}",
                f"2. ตั้ง Stop Loss ทันทีที่ {stop_loss} (ขาดทุนไม่เกิน ${self.max_risk_usd:.2f})",
                f"3. เมื่อราคาถึง TP1 ({take_profit_1}) ให้เลื่อน SL มาบังทุน (Break-Even) ทันที",
                f"4. ปล่อยรันกำไรต่อไปยังเป้าหมายหลัก TP2 ({take_profit_2})",
                f"5. ยกเลิกแผนทันทีหากราคาหลุดแนวต้าน/รับหลัก ({invalidation_level}) ก่อนถึงจุดเข้า"
            ]
        }


if __name__ == "__main__":
    print("Testing TradePlanner...")
    planner = TradePlanner()
    dummy_h1 = pd.DataFrame({
        "time": pd.date_range("2026-08-18", periods=40, freq="h"),
        "open": np.linspace(2700, 2750, 40),
        "high": np.linspace(2710, 2760, 40),
        "low": np.linspace(2690, 2740, 40),
        "close": np.linspace(2705, 2755, 40),
        "volume": 300
    })
    dummy_m15 = dummy_h1.tail(25).copy()

    plan = planner.generate_trade_plan("ETHUSD", dummy_h1, dummy_m15)
    print("Trade Plan Output:")
    print(plan)
