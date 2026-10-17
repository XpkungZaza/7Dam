"""
order_executor.py - MetaTrader 5 Order Execution & Management Engine for Frey AI
"""

import time
import logging
from typing import Dict, Any, Optional
import MetaTrader5 as mt5
from market_data import resolve_symbol

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("OrderExecutor")

MAGIC_NUMBER = 777001  # Frey AI Identifier


class OrderExecutor:
    def __init__(self, magic_number: int = MAGIC_NUMBER, deviation_points: int = 20):
        self.magic_number = magic_number
        self.deviation_points = deviation_points

    def send_market_order(
        self,
        symbol: str,
        action: str,  # 'BUY' or 'SELL'
        lot_size: float,
        stop_loss: float,
        take_profit: float,
        comment: str = "FreyAI_Auto"
    ) -> Dict[str, Any]:
        """
        Executes a market order with mandatory Stop Loss and Take Profit attached.
        """
        if mt5.terminal_info() is None:
            return {"success": False, "error": "MT5 not connected.", "order_ticket": None}

        resolved_sym = resolve_symbol(symbol)
        if not resolved_sym:
            return {"success": False, "error": f"Symbol {symbol} cannot be resolved.", "order_ticket": None}

        tick = mt5.symbol_info_tick(resolved_sym)
        if tick is None:
            return {"success": False, "error": f"Cannot get price tick for {resolved_sym}.", "order_ticket": None}

        action_upper = action.upper()
        if action_upper == "BUY":
            order_type = mt5.ORDER_TYPE_BUY
            price = tick.ask
        elif action_upper == "SELL":
            order_type = mt5.ORDER_TYPE_SELL
            price = tick.bid
        else:
            return {"success": False, "error": f"Invalid order action '{action}'. Use BUY or SELL.", "order_ticket": None}

        # Build execution request
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": resolved_sym,
            "volume": float(lot_size),
            "type": order_type,
            "price": float(price),
            "sl": float(stop_loss),
            "tp": float(take_profit),
            "deviation": self.deviation_points,
            "magic": self.magic_number,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,  # IOC / FOK depending on broker
        }

        # Check and send order with retry on requote
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            logger.info(f"Submitting {action_upper} {lot_size} lots on {resolved_sym} @ {price:.4f} (Attempt {attempt}/{max_retries})...")
            result = mt5.order_send(request)

            if result is None:
                err_code, err_desc = mt5.last_error()
                logger.error(f"Order submission returned None: [{err_code}] {err_desc}")
                time.sleep(1)
                continue

            if result.retcode == mt5.TRADE_RETCODE_DONE:
                logger.info(
                    f"🎉 ORDER EXECUTED SUCCESSFULLY! Ticket: #{result.order} | "
                    f"Volume: {result.volume} | Exec Price: {result.price:.4f} | SL: {stop_loss} | TP: {take_profit}"
                )
                return {
                    "success": True,
                    "order_ticket": result.order,
                    "deal_ticket": result.deal,
                    "volume": result.volume,
                    "price": result.price,
                    "sl": stop_loss,
                    "tp": take_profit,
                    "comment": comment,
                    "retcode": result.retcode
                }
            elif result.retcode in [mt5.TRADE_RETCODE_REQUOTE, mt5.TRADE_RETCODE_PRICE_CHANGED]:
                logger.warning(f"Requote / Price changed ({result.retcode}). Refreshing tick...")
                new_tick = mt5.symbol_info_tick(resolved_sym)
                if new_tick:
                    request["price"] = new_tick.ask if action_upper == "BUY" else new_tick.bid
                time.sleep(0.5)
            else:
                logger.error(f"Order failed with retcode {result.retcode}: {result.comment}")
                # Try fallback filling mode if filling type was rejected
                if result.retcode == mt5.TRADE_RETCODE_INVALID_FILL:
                    request["type_filling"] = mt5.ORDER_FILLING_RETURN
                    logger.info("Retrying with ORDER_FILLING_RETURN filling mode...")
                time.sleep(1)

        return {
            "success": False,
            "error": f"Order failed after {max_retries} attempts. Last comment: {getattr(result, 'comment', 'N/A')}",
            "retcode": getattr(result, "retcode", None),
            "order_ticket": None
        }

    def modify_position_sl_tp(self, ticket: int, new_sl: float, new_tp: Optional[float] = None) -> bool:
        """
        Modifies the Stop Loss and/or Take Profit of an existing active position.
        Used by Trailing Stop and Break-Even managers.
        """
        positions = mt5.positions_get(ticket=ticket)
        if not positions or len(positions) == 0:
            logger.error(f"Cannot modify: Position #{ticket} not found.")
            return False

        pos = positions[0]
        tp_to_set = new_tp if new_tp is not None else pos.tp

        request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": ticket,
            "symbol": pos.symbol,
            "sl": float(new_sl),
            "tp": float(tp_to_set),
            "magic": self.magic_number
        }

        result = mt5.order_send(request)
        if result and result.retcode == mt5.TRADE_RETCODE_DONE:
            logger.info(f"Position #{ticket} modified -> New SL: {new_sl:.4f} | TP: {tp_to_set:.4f}")
            return True
        else:
            logger.error(f"Failed to modify SL/TP for #{ticket}: {getattr(result, 'comment', 'Error')}")
            return False

    def close_position(self, ticket: int, comment: str = "FreyAI_Close") -> bool:
        """
        Closes an existing open position at market price.
        """
        positions = mt5.positions_get(ticket=ticket)
        if not positions or len(positions) == 0:
            logger.warning(f"Position #{ticket} already closed or not found.")
            return True

        pos = positions[0]
        tick = mt5.symbol_info_tick(pos.symbol)
        if not tick:
            logger.error(f"Cannot get current tick to close position #{ticket}.")
            return False

        close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
        price = tick.bid if pos.type == mt5.ORDER_TYPE_BUY else tick.ask

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "position": ticket,
            "symbol": pos.symbol,
            "volume": float(pos.volume),
            "type": close_type,
            "price": float(price),
            "deviation": self.deviation_points,
            "magic": self.magic_number,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC
        }

        result = mt5.order_send(request)
        if result and result.retcode == mt5.TRADE_RETCODE_DONE:
            logger.info(f"Position #{ticket} successfully closed @ {price:.4f}.")
            return True
        else:
            logger.error(f"Failed to close position #{ticket}: {getattr(result, 'comment', 'Error')}")
            return False


if __name__ == "__main__":
    executor = OrderExecutor()
    print("OrderExecutor initialized successfully with Magic Number:", executor.magic_number)
