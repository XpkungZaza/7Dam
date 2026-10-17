"""
database.py - SQLite Trade Journal and Telemetry Database for Frey AI
"""

import sqlite3
import logging
from datetime import datetime
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("Database")

DB_PATH = "frey_trades.db"


class TradeDatabase:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Table for AI Market Analysis decisions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ai_decisions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    symbol TEXT,
                    timeframe TEXT,
                    action TEXT,
                    confidence_score REAL,
                    current_price REAL,
                    suggested_sl REAL,
                    suggested_tp REAL,
                    risk_reward_ratio REAL,
                    rationale TEXT,
                    strategy_tags TEXT,
                    executed INTEGER DEFAULT 0
                )
            """)

            # Table for actual Executed Trades
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket INTEGER UNIQUE,
                    timestamp_open TEXT,
                    symbol TEXT,
                    action TEXT,
                    lot_size REAL,
                    entry_price REAL,
                    sl_price REAL,
                    tp_price REAL,
                    estimated_risk_usd REAL,
                    status TEXT DEFAULT 'OPEN',
                    timestamp_close TEXT,
                    close_price REAL,
                    realized_pnl_usd REAL,
                    close_reason TEXT
                )
            """)
            conn.commit()

    def log_ai_decision(self, symbol: str, timeframe: str, decision: Dict[str, Any], current_price: float) -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO ai_decisions (
                    timestamp, symbol, timeframe, action, confidence_score,
                    current_price, suggested_sl, suggested_tp, risk_reward_ratio,
                    rationale, strategy_tags, executed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                datetime.now().isoformat(),
                symbol,
                timeframe,
                decision.get("action", "WAIT"),
                decision.get("confidence_score", 0.0),
                current_price,
                decision.get("stop_loss", 0.0),
                decision.get("take_profit", 0.0),
                decision.get("risk_reward_ratio", 0.0),
                decision.get("technical_rationale", ""),
                str(decision.get("strategy_tags", [])),
                1 if decision.get("action") in ["BUY", "SELL"] else 0
            ))
            conn.commit()
            return cursor.lastrowid

    def log_trade_opened(self, ticket: int, symbol: str, action: str, lot_size: float,
                         entry_price: float, sl: float, tp: float, risk_usd: float):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO trades (
                    ticket, timestamp_open, symbol, action, lot_size,
                    entry_price, sl_price, tp_price, estimated_risk_usd, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
            """, (
                ticket,
                datetime.now().isoformat(),
                symbol,
                action,
                lot_size,
                entry_price,
                sl,
                tp,
                risk_usd
            ))
            conn.commit()
            logger.info(f"💾 Trade #{ticket} logged in SQLite database.")


if __name__ == "__main__":
    db = TradeDatabase()
    print("Database initialized successfully at:", DB_PATH)
