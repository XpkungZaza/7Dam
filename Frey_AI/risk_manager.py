"""
risk_manager.py - Risk Management & Dynamic Position Sizing Engine for Frey AI
Tailored for micro accounts ($100 balance, strict $3.00 max risk per trade).
"""

import math
import logging
from typing import Dict, Any, Optional
import MetaTrader5 as mt5

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("RiskManager")


def calculate_position_size(
    symbol: str,
    entry_price: float,
    sl_price: float,
    max_risk_usd: float = 3.0,
    account_balance: float = 100.0
) -> Dict[str, Any]:
    """
    Computes exact lot size for a trade ensuring risk never exceeds max_risk_usd ($3.00 for $100 account = 3%).

    Parameters:
        symbol (str): Asset symbol (e.g. 'ETHUSD', 'EURUSD', 'XAUUSD').
        entry_price (float): Proposed entry price.
        sl_price (float): Proposed stop loss price.
        max_risk_usd (float): Maximum allowable dollar loss (default: $3.00).
        account_balance (float): Total account balance (default: $100.00).

    Returns:
        Dict[str, Any] containing:
            - lot_size: final executable lot size (rounded down to step)
            - estimated_loss_usd: potential loss at SL
            - sl_distance: price difference to SL
            - sl_pips: pip / point distance
            - risk_pct: risk percentage relative to balance
            - is_valid: boolean indicating if trade meets broker minimum constraints
            - warning: error/warning message if position size is below volume_min or invalid
            - symbol_specs: broker volume constraints and contract specs
    """
    sl_distance = abs(entry_price - sl_price)
    if sl_distance <= 0:
        return {
            "lot_size": 0.0,
            "estimated_loss_usd": 0.0,
            "sl_distance": 0.0,
            "risk_pct": 0.0,
            "is_valid": False,
            "warning": "Entry price and Stop Loss price cannot be identical.",
            "symbol_specs": {}
        }

    # Query MT5 for symbol specifications
    info = mt5.symbol_info(symbol) if mt5.terminal_info() is not None else None

    if info is None:
        logger.warning(f"Could not retrieve MT5 symbol_info for '{symbol}'. Using standard asset defaults.")
        clean = symbol.upper()
        if "XAU" in clean or "GOLD" in clean:
            contract_size = 100.0  # 100 oz per lot
            point = 0.01
            tick_size = 0.01
            tick_value = 1.0  # $1 per 0.01 price move on 1.0 lot ($100 per $1 move)
        elif any(c in clean for c in ["ETH", "BTC", "SOL"]):
            contract_size = 1.0
            point = 0.01
            tick_size = 0.01
            tick_value = 0.01
        else:
            contract_size = 100000.0
            point = 0.00001
            tick_size = 0.00001
            tick_value = 1.0
        volume_min = 0.01
        volume_max = 100.0
        volume_step = 0.01
    else:
        contract_size = float(info.trade_contract_size)
        volume_min = float(info.volume_min)
        volume_max = float(info.volume_max)
        volume_step = float(info.volume_step)
        point = float(info.point)
        tick_size = float(info.trade_tick_size) if info.trade_tick_size > 0 else point
        # Use trade_tick_value_loss if available, else trade_tick_value, else derive
        tick_value_loss = getattr(info, "trade_tick_value_loss", 0.0)
        if tick_value_loss and tick_value_loss > 0:
            tick_value = float(tick_value_loss)
        elif info.trade_tick_value > 0:
            tick_value = float(info.trade_tick_value)
        else:
            tick_value = tick_size * contract_size

    # Loss per 1.0 standard lot when SL is hit
    if tick_size > 0 and tick_value > 0:
        loss_per_lot = (sl_distance / tick_size) * tick_value
    else:
        loss_per_lot = sl_distance * contract_size

    if loss_per_lot <= 0:
        return {
            "lot_size": 0.0,
            "estimated_loss_usd": 0.0,
            "sl_distance": sl_distance,
            "risk_pct": 0.0,
            "is_valid": False,
            "warning": "Computed loss per lot is zero or negative.",
            "symbol_specs": {}
        }

    # Raw lot size to risk exactly max_risk_usd
    raw_lot = max_risk_usd / loss_per_lot

    # Round DOWN to broker volume_step with epsilon protection to guarantee risk does NOT exceed max_risk_usd
    step_precision = max(0, -int(math.floor(math.log10(volume_step)))) if volume_step > 0 else 2
    steps_count = math.floor((raw_lot + 1e-7) / volume_step)
    calculated_lot = round(steps_count * volume_step, step_precision)

    # Check minimum and maximum boundaries
    warning = None
    is_valid = True

    if calculated_lot + 1e-7 < volume_min:
        warning = (
            f"WARNING: Calculated lot size ({raw_lot:.4f}) is SMALLER than broker's minimum allowable "
            f"volume ({volume_min}). Executing minimum lot {volume_min} would risk "
            f"${(volume_min * loss_per_lot):.2f} USD, which EXCEEDS the ${max_risk_usd:.2f} max risk limit. "
            f"Action Recommended: Tighten Stop-Loss (reduce SL distance) or skip this trade."
        )
        logger.warning(warning)
        is_valid = False
        final_lot = volume_min  # reference minimum
    elif calculated_lot > volume_max:
        logger.warning(f"Calculated lot size ({calculated_lot}) exceeds volume_max ({volume_max}). Clamping.")
        final_lot = volume_max
    else:
        final_lot = calculated_lot

    estimated_loss = round(final_lot * loss_per_lot, 2)
    risk_pct = round((estimated_loss / account_balance) * 100, 2) if account_balance > 0 else 0.0

    return {
        "lot_size": final_lot if is_valid else 0.0,
        "raw_lot_calculated": round(raw_lot, 5),
        "actual_lot_if_executed": final_lot,
        "max_risk_usd": max_risk_usd,
        "estimated_loss_usd": estimated_loss,
        "sl_distance": round(sl_distance, 4),
        "risk_pct": risk_pct,
        "is_valid": is_valid,
        "warning": warning,
        "symbol_specs": {
            "contract_size": contract_size,
            "volume_min": volume_min,
            "volume_step": volume_step,
            "volume_max": volume_max,
        }
    }


def suggest_stop_loss(entry_price: float, atr_value: float, direction: str = "BUY", multiplier: float = 1.5) -> float:
    """
    Calculates volatility-based Stop Loss price using ATR.
    """
    sl_offset = atr_value * multiplier
    if direction.upper() in ["BUY", "LONG"]:
        return round(entry_price - sl_offset, 2)
    else:
        return round(entry_price + sl_offset, 2)


if __name__ == "__main__":
    print("Testing risk_manager.py with simulated ETHUSD trade:")
    entry = 2700.0
    sl = 2650.0  # $50 SL distance
    res = calculate_position_size("ETHUSD", entry, sl, max_risk_usd=3.0, account_balance=100.0)
    print(res)

    print("\nTesting too tight SL trigger warning:")
    tight_sl = 2698.0  # $2 SL distance
    res_tight = calculate_position_size("ETHUSD", entry, tight_sl, max_risk_usd=3.0, account_balance=100.0)
    print(res_tight)
