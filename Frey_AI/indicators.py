"""
indicators.py - Technical Indicator Feature Engineering for Frey AI
"""

from typing import List
import numpy as np
import pandas as pd


def add_ema(df: pd.DataFrame, periods: List[int] = [20, 50]) -> pd.DataFrame:
    """
    Calculates Exponential Moving Averages (EMA) for specified periods.

    Parameters:
        df (pd.DataFrame): DataFrame containing 'close' column.
        periods (List[int]): List of EMA periods (default: [20, 50]).

    Returns:
        pd.DataFrame: Enhanced DataFrame with columns 'EMA_<period>'.
    """
    df = df.copy()
    for period in periods:
        col_name = f"EMA_{period}"
        df[col_name] = df["close"].ewm(span=period, adjust=False).mean()
    return df


def add_rsi(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """
    Calculates Relative Strength Index (RSI) using standard Wilder's smoothing.

    Parameters:
        df (pd.DataFrame): DataFrame containing 'close' column.
        period (int): Lookback period (default: 14).

    Returns:
        pd.DataFrame: Enhanced DataFrame with column 'RSI_<period>'.
    """
    df = df.copy()
    delta = df["close"].diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    # Wilder's Exponential Smoothing: alpha = 1 / period
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()

    # Avoid zero division
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))

    # Fill 0 loss scenario where RSI is 100
    rsi = rsi.fillna(100.0)

    df[f"RSI_{period}"] = rsi.round(2)
    return df


def add_atr(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
    """
    Calculates Average True Range (ATR) for volatility and stop-loss placement.

    Parameters:
        df (pd.DataFrame): DataFrame containing 'high', 'low', and 'close' columns.
        period (int): Lookback period (default: 14).

    Returns:
        pd.DataFrame: Enhanced DataFrame with columns 'TR' and 'ATR_<period>'.
    """
    df = df.copy()
    prev_close = df["close"].shift(1)

    tr1 = df["high"] - df["low"]
    tr2 = (df["high"] - prev_close).abs()
    tr3 = (df["low"] - prev_close).abs()

    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    df["TR"] = tr

    # Wilder's Smoothing for ATR
    atr = tr.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    df[f"ATR_{period}"] = atr.round(4)
    return df


def calculate_all_indicators(df: pd.DataFrame, ema_periods: List[int] = [20, 50],
                             rsi_period: int = 14, atr_period: int = 14) -> pd.DataFrame:
    """
    Applies all core technical indicators (EMA, RSI, ATR) onto the OHLCV DataFrame.

    Returns:
        pd.DataFrame: Enhanced DataFrame with all computed indicator features.
    """
    df_enhanced = add_ema(df, periods=ema_periods)
    df_enhanced = add_rsi(df_enhanced, period=rsi_period)
    df_enhanced = add_atr(df_enhanced, period=atr_period)
    return df_enhanced


if __name__ == "__main__":
    # Quick synthetic test
    sample_data = {
        "time": pd.date_range("2026-01-01", periods=100, freq="h"),
        "open": np.linspace(2500, 2600, 100) + np.random.randn(100) * 5,
        "high": np.linspace(2505, 2610, 100) + np.random.randn(100) * 5,
        "low": np.linspace(2495, 2590, 100) + np.random.randn(100) * 5,
        "close": np.linspace(2500, 2600, 100) + np.random.randn(100) * 5,
        "volume": np.random.randint(100, 1000, 100)
    }
    test_df = pd.DataFrame(sample_data)
    result = calculate_all_indicators(test_df)
    print("Indicators calculated successfully:")
    print(result[["time", "close", "EMA_20", "EMA_50", "RSI_14", "ATR_14"]].tail())
