"""
market_data.py - MetaTrader 5 Data Pipeline for Frey AI
"""

import logging
from datetime import datetime
from typing import Optional, Union
import MetaTrader5 as mt5
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("MarketData")

# Timeframe mapping dictionary
TIMEFRAME_MAP = {
    "M1": mt5.TIMEFRAME_M1,
    "M5": mt5.TIMEFRAME_M5,
    "M15": mt5.TIMEFRAME_M15,
    "M30": mt5.TIMEFRAME_M30,
    "H1": mt5.TIMEFRAME_H1,
    "H4": mt5.TIMEFRAME_H4,
    "D1": mt5.TIMEFRAME_D1,
    "W1": mt5.TIMEFRAME_W1,
    "MN1": mt5.TIMEFRAME_MN1,
}


def connect_mt5(path: Optional[str] = None, login: Optional[int] = None, 
                password: Optional[str] = None, server: Optional[str] = None,
                timeout: int = 5000) -> bool:
    """
    Initializes and connects to the active MetaTrader 5 terminal instance.
    If credentials are not provided, it connects to the currently running terminal.
    """
    init_kwargs = {"timeout": timeout}
    if path:
        init_kwargs["path"] = path
    if login and password and server:
        init_kwargs["login"] = login
        init_kwargs["password"] = password
        init_kwargs["server"] = server

    if not mt5.initialize(**init_kwargs):
        error_code, error_desc = mt5.last_error()
        logger.error(f"MT5 Initialization failed: [{error_code}] {error_desc}")
        return False

    terminal_info = mt5.terminal_info()
    if terminal_info is None:
        logger.error("Connected to MT5, but failed to retrieve terminal info.")
        return False

    account_info = mt5.account_info()
    account_str = f"Account: {account_info.login} ({account_info.server})" if account_info else "Account: Unauthenticated"
    logger.info(f"Connected to MT5 Terminal: {terminal_info.name} | {account_str}")
    return True


def resolve_symbol(symbol: str) -> Optional[str]:
    """
    Finds the exact matching symbol name in the broker's market watch,
    handling common broker suffixes/prefixes (e.g., ETHUSD.m, ETHUSD_i, ETHUSDm).
    """
    # 1. Direct check
    info = mt5.symbol_info(symbol)
    if info is not None:
        if not info.visible:
            mt5.symbol_select(symbol, True)
        return symbol

    # 2. Search by matching substring
    all_symbols = mt5.symbols_get()
    if all_symbols:
        clean_target = symbol.upper().replace("/", "").replace("-", "")
        for s in all_symbols:
            clean_s = s.name.upper()
            if clean_target in clean_s or clean_s in clean_target:
                logger.info(f"Resolved symbol variant: '{symbol}' -> '{s.name}'")
                mt5.symbol_select(s.name, True)
                return s.name

    logger.warning(f"Symbol '{symbol}' not found on broker symbol list.")
    return None


def get_ohlcv(symbol: str = "ETHUSD", timeframe: Union[str, int] = "H1", count: int = 500) -> Optional[pd.DataFrame]:
    """
    Fetches historical candlestick data from MetaTrader 5 and returns a clean DataFrame.

    Parameters:
        symbol (str): Target trading symbol (e.g. 'ETHUSD', 'BTCUSD', 'EURUSD').
        timeframe (str | int): Timeframe string ('M1', 'M5', 'H1', 'D1') or mt5 TIMEFRAME constant.
        count (int): Number of candles to fetch (default: 500).

    Returns:
        pd.DataFrame with columns: ['time', 'open', 'high', 'low', 'close', 'volume']
    """
    # Ensure MT5 is initialized
    if mt5.terminal_info() is None:
        logger.info("MT5 not initialized. Attempting auto-connection...")
        if not connect_mt5():
            logger.error("Cannot fetch OHLCV: Failed to connect to MT5.")
            return None

    # Resolve symbol name for broker
    resolved_sym = resolve_symbol(symbol)
    if not resolved_sym:
        logger.error(f"Cannot fetch data: Symbol '{symbol}' cannot be resolved.")
        return None

    # Parse timeframe
    if isinstance(timeframe, str):
        tf_key = timeframe.upper()
        if tf_key not in TIMEFRAME_MAP:
            logger.error(f"Invalid timeframe string '{timeframe}'. Available: {list(TIMEFRAME_MAP.keys())}")
            return None
        tf = TIMEFRAME_MAP[tf_key]
    else:
        tf = timeframe

    # Fetch rates from position 0 (most recent)
    rates = mt5.copy_rates_from_pos(resolved_sym, tf, 0, count)

    if rates is None or len(rates) == 0:
        error_code, error_desc = mt5.last_error()
        logger.error(f"Failed to fetch rates for {resolved_sym} ({timeframe}): [{error_code}] {error_desc}")
        return None

    # Convert to DataFrame
    df = pd.DataFrame(rates)

    # Convert timestamp to standard datetime
    df["time"] = pd.to_datetime(df["time"], unit="s")

    # Select volume (use tick_volume if real_volume is 0 or missing)
    if "real_volume" in df.columns and (df["real_volume"] > 0).any():
        df["volume"] = df["real_volume"]
    elif "tick_volume" in df.columns:
        df["volume"] = df["tick_volume"]
    else:
        df["volume"] = 0

    # Format output into clean DataFrame
    clean_columns = ["time", "open", "high", "low", "close", "volume"]
    df = df[clean_columns].copy()

    # Ensure correct data types
    for col in ["open", "high", "low", "close"]:
        df[col] = df[col].astype(float)
    df["volume"] = df["volume"].astype(float)

    # Sort ascending in chronological order
    df.sort_values(by="time", ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)

    logger.info(f"Successfully fetched {len(df)} candles for {resolved_sym} [{timeframe}] (Latest: {df['time'].iloc[-1]})")
    return df


if __name__ == "__main__":
    print("Testing market_data.py standalone connection...")
    if connect_mt5():
        data = get_ohlcv(symbol="ETHUSD", timeframe="H1", count=10)
        if data is not None:
            print(data.tail())
        mt5.shutdown()
