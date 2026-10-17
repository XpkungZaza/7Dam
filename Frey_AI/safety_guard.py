"""
safety_guard.py - Circuit Breakers and Safety Guardrails for Frey AI
Enforces strict account preservation rules for $100 micro account.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
import MetaTrader5 as mt5
from asset_config import get_asset_profile

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("SafetyGuard")

MAGIC_NUMBER = 777001  # Unique identifier for Frey AI orders


class SafetyGuard:
    def __init__(
        self,
        max_daily_loss_usd: float = 6.0,
        max_open_positions: int = 1,
        max_risk_per_trade_usd: float = 3.0,
        magic_number: int = MAGIC_NUMBER
    ):
        self.max_daily_loss_usd = max_daily_loss_usd
        self.max_open_positions = max_open_positions
        self.max_risk_per_trade_usd = max_risk_per_trade_usd
        self.magic_number = magic_number

    def get_today_realized_pnl(self) -> float:
        """
        Calculates today's cumulative realized profit/loss from closed deals.
        """
        if mt5.terminal_info() is None:
            logger.warning("MT5 not connected. Cannot fetch deal history.")
            return 0.0

        now = datetime.now()
        start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
        
        deals = mt5.history_deals_get(start_of_day, now)
        if deals is None or len(deals) == 0:
            return 0.0

        today_pnl = 0.0
        for deal in deals:
            # Filter deals belonging to this magic number or all trades on the account
            if deal.entry == mt5.DEAL_ENTRY_OUT or deal.entry == mt5.DEAL_ENTRY_OUT_BY:
                today_pnl += (deal.profit + deal.swap + deal.commission)

        return round(today_pnl, 2)

    def check_daily_loss_limit(self) -> Tuple[bool, str]:
        """
        Circuit Breaker: Checks if daily realized loss has hit the maximum drawdown threshold.
        Returns (is_allowed, reason).
        """
        today_pnl = self.get_today_realized_pnl()
        if today_pnl <= -self.max_daily_loss_usd:
            msg = (
                f"🚨 CIRCUIT BREAKER TRIGGERED: Daily loss (${abs(today_pnl):.2f}) reached or exceeded "
                f"the maximum allowed daily limit (${self.max_daily_loss_usd:.2f}). Trading halted for today."
            )
            logger.error(msg)
            return False, msg
        return True, f"Daily PnL is healthy (${today_pnl:+.2f} USD)."

    def check_open_positions_limit(self, symbol: Optional[str] = None) -> Tuple[bool, str]:
        """
        Checks if total open positions exceed allowable limit (Max 1 for $100 account).
        """
        if mt5.terminal_info() is None:
            return True, "MT5 offline check bypassed."

        positions = mt5.positions_get()
        if positions is None:
            return True, "No open positions."

        # Filter active positions managed by Frey AI or account-wide
        frey_positions = [p for p in positions if p.magic == self.magic_number or p.magic == 0]
        total_open = len(frey_positions)

        if total_open >= self.max_open_positions:
            msg = (
                f"🛡️ POSITION LIMIT REACHED: Currently {total_open} position(s) open. "
                f"Maximum allowed is {self.max_open_positions}. Rejecting new entry."
            )
            logger.warning(msg)
            return False, msg

        return True, f"Open positions count OK ({total_open}/{self.max_open_positions})."

    def check_spread(self, symbol: str) -> Tuple[bool, str]:
        """
        Validates whether current market spread is within the acceptable threshold for EURUSD / ETHUSD.
        """
        if mt5.terminal_info() is None:
            return True, "MT5 offline: spread check assumed OK."

        info = mt5.symbol_info(symbol)
        if info is None:
            return False, f"Cannot get symbol_info for {symbol} to check spread."

        profile = get_asset_profile(symbol)
        spread_points = info.spread
        point = info.point

        if profile["asset_type"] == "FOREX_MAJOR":
            # 1 pip = 10 points (for 5-digit broker)
            spread_pips = spread_points / 10.0 if info.digits == 5 else spread_points
            max_pips = profile.get("max_allowable_spread_pips", 2.5)
            if spread_pips > max_pips:
                msg = f"⚠️ SPREAD TOO WIDE: Current EURUSD spread is {spread_pips:.1f} pips (Max allowed: {max_pips} pips)."
                logger.warning(msg)
                return False, msg
            return True, f"EURUSD Spread OK ({spread_pips:.1f} pips)."

        elif profile["asset_type"] == "CRYPTO_CFD":
            spread_usd = spread_points * point
            max_spread = profile.get("max_allowable_spread_usd", 3.0)
            if spread_usd > max_spread:
                msg = f"⚠️ SPREAD TOO WIDE: Current ETHUSD spread is ${spread_usd:.2f} USD (Max allowed: ${max_spread:.2f})."
                logger.warning(msg)
                return False, msg
            return True, f"ETHUSD Spread OK (${spread_usd:.2f} USD)."

        return True, "Spread OK."

    def validate_trade_request(self, symbol: str, risk_info: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Comprehensive pre-trade safety inspection.
        Passes through all 4 safety checkpoints before allowing order execution.
        """
        # Checkpoint 1: Risk Engine validation & $3 limit
        if not risk_info.get("is_valid", False):
            return False, f"Risk Engine Block: {risk_info.get('warning', 'Invalid risk parameters')}"

        if risk_info.get("estimated_loss_usd", 0.0) > (self.max_risk_per_trade_usd + 0.05):
            return False, f"Risk Cap Exceeded: Estimated loss ${risk_info.get('estimated_loss_usd')} > ${self.max_risk_per_trade_usd}"

        # Checkpoint 2: Daily Drawdown Circuit Breaker
        allowed_daily, reason_daily = self.check_daily_loss_limit()
        if not allowed_daily:
            return False, reason_daily

        # Checkpoint 3: Maximum Concurrent Positions
        allowed_pos, reason_pos = self.check_open_positions_limit(symbol)
        if not allowed_pos:
            return False, reason_pos

        # Checkpoint 4: Spread Filter
        allowed_spread, reason_spread = self.check_spread(symbol)
        if not allowed_spread:
            return False, reason_spread

        logger.info(f"✅ ALL SAFETY CHECKS PASSED for {symbol}. Order execution permitted.")
        return True, "All safety criteria satisfied."


if __name__ == "__main__":
    guard = SafetyGuard()
    print("Testing SafetyGuard standalone:")
    daily_ok, d_msg = guard.check_daily_loss_limit()
    print(f"Daily Limit Check: {daily_ok} | {d_msg}")
    pos_ok, p_msg = guard.check_open_positions_limit()
    print(f"Position Limit Check: {pos_ok} | {p_msg}")
