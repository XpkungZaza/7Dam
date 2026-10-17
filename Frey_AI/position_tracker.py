"""
position_tracker.py - Active Position Management & Trailing SL for Frey AI
Handles Break-Even shifts (1R) and dynamic trailing stop adjustments.
"""

import logging
from typing import List, Dict, Any
import MetaTrader5 as mt5
from order_executor import OrderExecutor, MAGIC_NUMBER

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("PositionTracker")


class PositionTracker:
    def __init__(self, executor: OrderExecutor, be_activation_r: float = 1.0, trailing_step_r: float = 0.5):
        self.executor = executor
        self.be_activation_r = be_activation_r  # Move to BE at 1R profit
        self.trailing_step_r = trailing_step_r

    def get_active_positions(self) -> List[Dict[str, Any]]:
        """
        Fetches all active open positions managed by Frey AI.
        """
        if mt5.terminal_info() is None:
            return []

        positions = mt5.positions_get()
        if not positions:
            return []

        active_list = []
        for pos in positions:
            if pos.magic == self.executor.magic_number or pos.magic == 0:
                active_list.append({
                    "ticket": pos.ticket,
                    "symbol": pos.symbol,
                    "type": "BUY" if pos.type == mt5.ORDER_TYPE_BUY else "SELL",
                    "volume": pos.volume,
                    "price_open": pos.price_open,
                    "price_current": pos.price_current,
                    "sl": pos.sl,
                    "tp": pos.tp,
                    "profit": pos.profit,
                    "comment": pos.comment,
                    "time": pos.time
                })
        return active_list

    def monitor_and_manage(self):
        """
        Scans all active positions and executes Break-Even or Trailing Stop updates.
        """
        positions = self.get_active_positions()
        if not positions:
            return

        for pos in positions:
            ticket = pos["ticket"]
            symbol = pos["symbol"]
            pos_type = pos["type"]
            open_price = pos["price_open"]
            curr_price = pos["price_current"]
            curr_sl = pos["sl"]
            profit_usd = pos["profit"]

            if curr_sl == 0:
                continue

            initial_risk_dist = abs(open_price - curr_sl)
            if initial_risk_dist <= 0:
                continue

            # 1. Break-Even Check: If profit has reached 1R (or approx $3.00)
            if pos_type == "BUY":
                gain_dist = curr_price - open_price
                # Check if moved at least 1R in profit
                if gain_dist >= initial_risk_dist * self.be_activation_r:
                    # Target BE = entry price + 10% of risk distance (buffer for fees)
                    target_be_sl = round(open_price + (initial_risk_dist * 0.10), 4)
                    if curr_sl < target_be_sl:
                        logger.info(f"🎯 BREAK-EVEN TRIGGERED for BUY #{ticket} ({symbol})! Moving SL from {curr_sl:.4f} -> {target_be_sl:.4f}")
                        self.executor.modify_position_sl_tp(ticket=ticket, new_sl=target_be_sl)

            elif pos_type == "SELL":
                gain_dist = open_price - curr_price
                if gain_dist >= initial_risk_dist * self.be_activation_r:
                    target_be_sl = round(open_price - (initial_risk_dist * 0.10), 4)
                    if curr_sl > target_be_sl:
                        logger.info(f"🎯 BREAK-EVEN TRIGGERED for SELL #{ticket} ({symbol})! Moving SL from {curr_sl:.4f} -> {target_be_sl:.4f}")
                        self.executor.modify_position_sl_tp(ticket=ticket, new_sl=target_be_sl)


if __name__ == "__main__":
    exec_inst = OrderExecutor()
    tracker = PositionTracker(exec_inst)
    print("PositionTracker initialized successfully.")
    tracker.monitor_and_manage()
