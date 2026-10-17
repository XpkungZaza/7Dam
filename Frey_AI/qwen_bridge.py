"""
qwen_bridge.py - Intelligent Tool-Augmented Gateway for Local Qwen & Project 7Dam
Provides:
1. Tool-Calling integration with Local Ollama (Qwen 2.5)
2. Real-time Market Data & Indicator Calculation (MT5 + Binance/Yahoo Fallback)
3. Web Reader & Real-Time Search Tool
4. HTTP / SSE endpoint for live streaming chat with Web Dashboard
"""

import sys
import re
import json
import logging
from typing import Dict, Any, List, Optional
from urllib.parse import quote_plus
import requests
import pandas as pd
import numpy as np

# Internal modules from Frey_AI
try:
    from indicators import calculate_all_indicators
    from trade_planner import TradePlanner
    from market_data import get_ohlcv
except ImportError:
    from Frey_AI.indicators import calculate_all_indicators
    from Frey_AI.trade_planner import TradePlanner
    from Frey_AI.market_data import get_ohlcv

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("QwenBridge")

OLLAMA_BASE_URL = "http://127.0.0.1:11434"
DEFAULT_MODEL = "qwen2.5:3b"


# ==============================================================================
# TOOL 1: REAL-TIME MARKET DATA & QUANTITATIVE CALCULATOR
# ==============================================================================

def fetch_binance_klines(symbol: str = "ETHUSDT", interval: str = "1h", limit: int = 60) -> Optional[pd.DataFrame]:
    """
    Fetches live klines from Binance Public API (No API key needed).
    Supports crypto like BTCUSDT, ETHUSDT, SOLUSDT.
    """
    clean_symbol = symbol.upper().replace("/", "").replace("-", "")
    if "XAU" in clean_symbol or "GOLD" in clean_symbol:
        clean_symbol = "PAXGUSDT"
    elif clean_symbol.endswith("USD") and not clean_symbol.endswith("USDT"):
        clean_symbol += "T"
    
    interval_map = {"M1": "1m", "M5": "5m", "M15": "15m", "M30": "30m", "H1": "1h", "H4": "4h", "D1": "1d"}
    binance_interval = interval_map.get(interval.upper(), "1h")

    url = f"https://api.binance.com/api/v3/klines?symbol={clean_symbol}&interval={binance_interval}&limit={limit}"
    try:
        resp = requests.get(url, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            rows = []
            for item in data:
                rows.append({
                    "time": pd.to_datetime(item[0], unit="ms"),
                    "open": float(item[1]),
                    "high": float(item[2]),
                    "low": float(item[3]),
                    "close": float(item[4]),
                    "volume": float(item[5])
                })
            return pd.DataFrame(rows)
    except Exception as e:
        logger.warning(f"Binance fetch failed for {clean_symbol}: {e}")
    return None


def fetch_yahoo_klines(symbol: str = "EURUSD=X", interval: str = "15m", range_str: str = "5d") -> Optional[pd.DataFrame]:
    """
    Fetches Forex / Index klines from Yahoo Finance public API.
    """
    interval_map = {
        "M1": "1m", "1M": "1m",
        "M5": "5m", "5M": "5m",
        "M15": "15m", "15M": "15m",
        "M30": "30m", "30M": "30m",
        "H1": "1h", "1H": "1h",
        "H4": "1d", "4H": "1d", # Yahoo free API doesn't have 4h, use 1h or 1d
        "D1": "1d", "1D": "1d"
    }
    clean_interval = interval_map.get(interval.upper(), "15m")

    ticker = symbol
    if "EURUSD" in symbol.upper():
        ticker = "EURUSD=X"
    elif "GBPUSD" in symbol.upper():
        ticker = "GBPUSD=X"
    elif "XAUUSD" in symbol.upper() or "GOLD" in symbol.upper():
        ticker = "GC=F"
    elif "BTC" in symbol.upper():
        ticker = "BTC-USD"
    elif "ETH" in symbol.upper():
        ticker = "ETH-USD"
    
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval={clean_interval}&range={range_str}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        resp = requests.get(url, headers=headers, timeout=8)
        if resp.status_code == 200:
            result = resp.json()["chart"]["result"][0]
            timestamps = result["timestamp"]
            quote = result["indicators"]["quote"][0]
            
            rows = []
            for i in range(len(timestamps)):
                if quote["close"][i] is not None:
                    rows.append({
                        "time": pd.to_datetime(timestamps[i], unit="s"),
                        "open": float(quote["open"][i]),
                        "high": float(quote["high"][i]),
                        "low": float(quote["low"][i]),
                        "close": float(quote["close"][i]),
                        "volume": float(quote["volume"][i] or 0)
                    })
            if rows:
                return pd.DataFrame(rows)
    except Exception as e:
        logger.warning(f"Yahoo fetch failed for {symbol}: {e}")
    return None


import time

_mt5_last_check = 0
_mt5_is_online = False

def check_mt5_fast():
    global _mt5_last_check, _mt5_is_online
    now = time.time()
    # Cache failure for 30 seconds to avoid blocking latency
    if not _mt5_is_online and (now - _mt5_last_check) < 30:
        return False
    _mt5_last_check = now
    try:
        import MetaTrader5 as mt5
        terminal = mt5.terminal_info()
        if terminal is not None:
            _mt5_is_online = True
            return True
        # Quick 300ms attempt
        if mt5.initialize(timeout=300):
            _mt5_is_online = True
            return True
    except Exception:
        pass
    _mt5_is_online = False
    return False


def get_live_market_analysis(symbol: str = "EURUSD", timeframe: str = "M15") -> Dict[str, Any]:
    """
    Tool function: Obtains live real-time price & calculates quantitative indicators (EMA 20/50, RSI 14, ATR 14, Trade Plan).
    """
    df = None
    source = "MT5"

    # 1. Try MT5 if available
    if check_mt5_fast():
        try:
            df = get_ohlcv(symbol=symbol, timeframe=timeframe, count=70)
        except Exception:
            df = None

    # 2. Fallback to Binance if Crypto
    if df is None or df.empty:
        if any(c in symbol.upper() for c in ["ETH", "BTC", "SOL", "BNB"]):
            df = fetch_binance_klines(symbol, interval=timeframe, limit=70)
            source = "Binance Live Feed"

    # 3. Fallback to Yahoo Finance for Forex / Commodities
    if df is None or df.empty:
        df = fetch_yahoo_klines(symbol, interval=timeframe.lower())
        source = "Yahoo Finance Live Feed"

    if df is None or df.empty:
        return {
            "status": "error",
            "message": f"Unable to fetch live market data for {symbol}. Make sure MT5 or internet connection is active."
        }

    # Calculate indicators
    df_enhanced = calculate_all_indicators(df)
    latest = df_enhanced.iloc[-1]
    prev = df_enhanced.iloc[-2] if len(df_enhanced) > 1 else latest

    planner = TradePlanner(account_balance=100.0, max_risk_usd=3.0)
    trade_plan = planner.generate_trade_plan(symbol, df_enhanced, df_enhanced.tail(30))

    current_price = float(latest["close"])
    ema20 = float(latest.get("EMA_20", current_price))
    ema50 = float(latest.get("EMA_50", current_price))
    rsi = float(latest.get("RSI_14", 50.0))
    atr = float(latest.get("ATR_14", 0.001))

    return {
        "status": "success",
        "symbol": symbol.upper(),
        "timeframe": timeframe.upper(),
        "data_source": source,
        "timestamp": str(latest["time"]),
        "current_price": round(current_price, 5),
        "price_change": round(current_price - float(prev["close"]), 5),
        "technical_indicators": {
            "EMA_20": round(ema20, 5),
            "EMA_50": round(ema50, 5),
            "EMA_Bias": "BULLISH (EMA20 > EMA50)" if ema20 > ema50 else "BEARISH (EMA20 < EMA50)",
            "RSI_14": round(rsi, 2),
            "RSI_State": "OVERSOLD" if rsi < 35 else ("OVERBOUGHT" if rsi > 68 else "BALANCED"),
            "ATR_14_Volatility": round(atr, 5)
        },
        "quantitative_trade_plan": {
            "recommended_action": trade_plan.get("plan_action"),
            "plan_grade": trade_plan.get("plan_grade"),
            "confluence": trade_plan.get("confluence_score"),
            "entry_price": trade_plan.get("entry_point"),
            "stop_loss": trade_plan.get("stop_loss"),
            "take_profit_1": trade_plan.get("take_profit_1"),
            "take_profit_2": trade_plan.get("take_profit_2"),
            "max_risk_cap": "$3.00 USD",
            "calculated_lot_size": trade_plan.get("calculated_lot_size")
        }
    }


# ==============================================================================
# TOOL 2: WEB READER & SEARCH
# ==============================================================================

def read_web_page(url: str, max_chars: int = 3500) -> Dict[str, Any]:
    """
    Tool function: Reads and extracts clean text content from a given web URL.
    """
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.encoding = resp.apparent_encoding or "utf-8"
        html = resp.text

        clean = re.sub(r"<(script|style|nav|header|footer)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
        clean = re.sub(r"<[^>]+>", " ", clean)
        clean = re.sub(r"\s+", " ", clean).strip()

        if len(clean) > max_chars:
            clean = clean[:max_chars] + "... [TRUNCATED]"

        title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
        title = title_match.group(1).strip() if title_match else "Web Page"

        return {
            "status": "success",
            "url": url,
            "title": title,
            "content": clean
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to read web page: {str(e)}"}


def search_web_information(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Tool function: Performs a live web search for up-to-date market news, economic calendar, or general information.
    """
    encoded = quote_plus(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        
        pattern = r'<a class="result__snippet"[^>]*>(.*?)</a>'
        snippets = re.findall(pattern, resp.text, re.DOTALL)
        
        title_pattern = r'<a class="result__url"[^>]*href="([^"]+)"[^>]*>(.*?)</a>'
        urls = re.findall(title_pattern, resp.text, re.DOTALL)

        results = []
        for i in range(min(len(snippets), max_results)):
            raw_url = urls[i][0] if i < len(urls) else ""
            clean_snippet = re.sub(r"<[^>]+>", "", snippets[i]).strip()
            results.append({
                "rank": i + 1,
                "snippet": clean_snippet,
                "url": raw_url
            })

        return {
            "status": "success",
            "query": query,
            "results_count": len(results),
            "results": results
        }
    except Exception as e:
        return {"status": "error", "message": f"Web search error: {str(e)}"}


# ==============================================================================
# TOOL DEFINITIONS FOR OLLAMA / QWEN 2.5
# ==============================================================================

AVAILABLE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_live_market_analysis",
            "description": "Get real-time live price, calculated technical indicators (EMA 20/50, RSI 14, ATR 14), and an exact quantitative trade plan for EURUSD, ETHUSD, BTCUSD, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Trading pair symbol e.g. EURUSD, ETHUSD, BTCUSD, XAUUSD"
                    },
                    "timeframe": {
                        "type": "string",
                        "description": "Timeframe e.g. M15, H1, H4",
                        "enum": ["M5", "M15", "H1", "H4", "D1"]
                    }
                },
                "required": ["symbol"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_web_page",
            "description": "Fetch and read the text content of any given web URL (e.g. news article, financial report, website link).",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The full HTTP/HTTPS URL of the web page to read."
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_web_information",
            "description": "Search the live web for recent financial news, economic events (Fed, CPI, NFP), or real-time online information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query string."
                    }
                },
                "required": ["query"]
            }
        }
    }
]

TOOL_MAPPING = {
    "get_live_market_analysis": get_live_market_analysis,
    "read_web_page": read_web_page,
    "search_web_information": search_web_information
}


# ==============================================================================
# OLLAMA QWEN CHAT AGENT (TOOL-AUGMENTED DECISION LOOP)
# ==============================================================================

SYSTEM_PROMPT = """คุณคือ "Frey AI / Qwen Strategic Co-Pilot" ผู้ช่วยวิเคราะห์การเทรดเชิงปริมาณความเร็วสูง (RTX 4050 Acceleration)
สไตล์การตอบ:
1. กระชับ ตรงประเด็น สรุปชัดเจน ไม่เกริ่นน้ำท่วมทุ่ง
2. หากมีข้อมูล [บริบทตลาดปัจจุบัน] หรือแผนเทรด ให้ดึงตัวเลข Entry, Stop Loss, Take Profit, RSI, Trend มาสรุปให้ผู้ใช้ทันที
3. วิเคราะห์สัดส่วน Risk/Reward และแนวรับ-แนวต้านอย่างเป็นรูปธรรม
4. สรุปคำแนะนำ Actionable ใน 3-5 บรรทัดจบ เพื่อความรวดเร็วในการตัดสินใจ
"""

class QwenLocalEngine:
    def __init__(self, model_name: str = DEFAULT_MODEL, base_url: str = OLLAMA_BASE_URL):
        self.model_name = model_name
        self.base_url = base_url

    def is_ollama_ready(self) -> bool:
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=3)
            return r.status_code == 200
        except Exception:
            return False

    def chat_stream(self, messages: List[Dict[str, str]], enable_tools: bool = False, model: Optional[str] = None):
        """
        Fast-Track Token Streaming Generator using Server-Sent Events format.
        Yields json chunks: {"token": "...", "done": bool}
        """
        if not self.is_ollama_ready():
            yield {"token": "⚠️ **Ollama ไม่ได้ทำงานบนเครื่อง Local**\nกรุณาเปิด Ollama ก่อนครับ", "done": True}
            return

        selected_model = model or self.model_name
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in messages:
            full_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        # Speed-optimized generation options for RTX 4050 6GB
        fast_options = {
            "temperature": 0.2,
            "top_p": 0.9,
            "num_predict": 350,  # Cap token output to finish in 2-4 seconds
            "num_ctx": 2048      # Keep KV cache compact for instant generation
        }

        # Fast-Pass: Direct Token Streaming (Zero Tool Loop Overhead)
        if not enable_tools:
            try:
                payload = {
                    "model": selected_model,
                    "messages": full_messages,
                    "stream": True,
                    "options": fast_options
                }
                resp = requests.post(f"{self.base_url}/api/chat", json=payload, stream=True, timeout=60)
                for line in resp.iter_lines():
                    if line:
                        chunk = json.loads(line.decode("utf-8"))
                        content = chunk.get("message", {}).get("content", "")
                        done = chunk.get("done", False)
                        if content or done:
                            yield {"token": content, "done": done}
            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield {"token": f"\n[Stream Error: {e}]", "done": True}
            return

        # If tools enabled: check tool calls first (non-streaming), then stream synthesis
        try:
            payload = {
                "model": selected_model,
                "messages": full_messages,
                "stream": False,
                "tools": AVAILABLE_TOOLS,
                "options": fast_options
            }
            resp = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=30)
            if resp.status_code != 200:
                yield {"token": f"Ollama Error: {resp.text}", "done": True}
                return

            res_json = resp.json()
            assistant_msg = res_json.get("message", {})
            tool_calls = assistant_msg.get("tool_calls", [])

            if not tool_calls:
                # No tool called, return content directly
                yield {"token": assistant_msg.get("content", ""), "done": True}
                return

            full_messages.append(assistant_msg)
            for tool in tool_calls:
                fn_name = tool.get("function", {}).get("name")
                fn_args = tool.get("function", {}).get("arguments", {})
                if isinstance(fn_args, str):
                    try:
                        fn_args = json.loads(fn_args)
                    except Exception:
                        fn_args = {}

                if fn_name in TOOL_MAPPING:
                    logger.info(f"Tool {fn_name} with args {fn_args}")
                    tool_output = TOOL_MAPPING[fn_name](**fn_args)
                else:
                    tool_output = {"error": f"Unknown tool {fn_name}"}

                full_messages.append({
                    "role": "tool",
                    "content": json.dumps(tool_output, ensure_ascii=False)
                })

            # Stream final synthesis
            second_payload = {
                "model": selected_model,
                "messages": full_messages,
                "stream": True,
                "options": fast_options
            }
            final_resp = requests.post(f"{self.base_url}/api/chat", json=second_payload, stream=True, timeout=60)
            for line in final_resp.iter_lines():
                if line:
                    chunk = json.loads(line.decode("utf-8"))
                    content = chunk.get("message", {}).get("content", "")
                    done = chunk.get("done", False)
                    if content or done:
                        yield {"token": content, "done": done}

        except Exception as e:
            logger.error(f"Error in tool-augmented stream: {e}")
            yield {"token": f"\n[Tool Execution Error: {e}]", "done": True}

    def chat_completion(self, messages: List[Dict[str, str]], enable_tools: bool = True, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Non-streaming chat completion fallback.
        """
        if not self.is_ollama_ready():
            return {
                "role": "assistant",
                "content": "⚠️ **Ollama ยังไม่ได้เริ่มต้นทำงานบนเครื่อง Local**\nกรุณาเปิดโปรแกรม Ollama หรือตรวจสอบที่ `http://127.0.0.1:11434`"
            }

        selected_model = model or self.model_name
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in messages:
            full_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        fast_options = {
            "temperature": 0.2,
            "top_p": 0.9,
            "num_predict": 350,
            "num_ctx": 2048
        }

        payload = {
            "model": selected_model,
            "messages": full_messages,
            "stream": False,
            "options": fast_options
        }
        if enable_tools:
            payload["tools"] = AVAILABLE_TOOLS

        try:
            resp = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=60)
            if resp.status_code != 200:
                return {"role": "assistant", "content": f"Ollama API Error: {resp.text}"}

            res_json = resp.json()
            assistant_msg = res_json.get("message", {})
            tool_calls = assistant_msg.get("tool_calls", [])
            if not tool_calls:
                return assistant_msg

            logger.info(f"Qwen ({selected_model}) invoked {len(tool_calls)} tools: {[t.get('function', {}).get('name') for t in tool_calls]}")
            full_messages.append(assistant_msg)

            for tool in tool_calls:
                fn_name = tool.get("function", {}).get("name")
                fn_args = tool.get("function", {}).get("arguments", {})
                if isinstance(fn_args, str):
                    try:
                        fn_args = json.loads(fn_args)
                    except Exception:
                        fn_args = {}

                if fn_name in TOOL_MAPPING:
                    tool_output = TOOL_MAPPING[fn_name](**fn_args)
                else:
                    tool_output = {"error": f"Unknown tool {fn_name}"}

                full_messages.append({
                    "role": "tool",
                    "content": json.dumps(tool_output, ensure_ascii=False)
                })

            second_payload = {
                "model": selected_model,
                "messages": full_messages,
                "stream": False,
                "options": fast_options
            }
            final_resp = requests.post(f"{self.base_url}/api/chat", json=second_payload, timeout=60)
            if final_resp.status_code == 200:
                return final_resp.json().get("message", {})
            else:
                return {"role": "assistant", "content": "Failed to synthesize final answer from tools."}

        except Exception as e:
            logger.error(f"Error in chat_completion: {e}")
            return {"role": "assistant", "content": f"Bridge Exception: {str(e)}"}
