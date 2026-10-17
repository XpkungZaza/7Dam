"""
api_server.py - Real-Time MT5, Quant Engine & Local Qwen AI REST API Server
Provides live endpoints for:
  - GET  /api/health
  - GET  /api/market_data?symbol=EURUSD&timeframe=M15
  - GET  /api/analysis?symbol=EURUSD
  - GET  /api/qwen/status
  - GET  /api/qwen/market?symbol=EURUSD&timeframe=M15
  - POST /api/qwen/chat
  - POST /api/qwen/read_web
"""

import sys
import json
import logging
from typing import Optional
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Internal modules
try:
    from market_data import connect_mt5, get_ohlcv
    from indicators import calculate_all_indicators
    from risk_manager import calculate_position_size, suggest_stop_loss
    from asset_config import get_asset_profile
    from qwen_bridge import (
        QwenLocalEngine,
        get_live_market_analysis,
        read_web_page,
        search_web_information
    )
except ImportError:
    from Frey_AI.market_data import connect_mt5, get_ohlcv
    from Frey_AI.indicators import calculate_all_indicators
    from Frey_AI.risk_manager import calculate_position_size, suggest_stop_loss
    from Frey_AI.asset_config import get_asset_profile
    from Frey_AI.qwen_bridge import (
        QwenLocalEngine,
        get_live_market_analysis,
        read_web_page,
        search_web_information
    )

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("APIServer")

PORT = 8000
qwen_engine = QwenLocalEngine()


class FreyAPIHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json; charset=utf-8")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        symbol = params.get("symbol", ["EURUSD"])[0].upper()
        timeframe = params.get("timeframe", ["M15"])[0].upper()

        if path == "/api/health":
            self.send_response(200)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ONLINE",
                "engine": "Frey AI Quant Core & Local Qwen Bridge"
            }).encode("utf-8"))

        elif path == "/api/qwen/status":
            ollama_ready = qwen_engine.is_ollama_ready()
            self.send_response(200)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "ollama_ready": ollama_ready,
                "model_name": qwen_engine.model_name,
                "api_endpoint": "http://127.0.0.1:11434"
            }).encode("utf-8"))

        elif path == "/api/qwen/market":
            analysis = get_live_market_analysis(symbol=symbol, timeframe=timeframe)
            self.send_response(200)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(analysis, ensure_ascii=False).encode("utf-8"))

        elif path == "/api/market_data":
            try:
                df = get_ohlcv(symbol=symbol, timeframe=timeframe, count=70)
                if df is not None and not df.empty:
                    df = calculate_all_indicators(df)
                    records = df.to_dict(orient="records")
                    for r in records:
                        r["time"] = str(r["time"])
                    
                    self.send_response(200)
                    self._set_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "symbol": symbol,
                        "timeframe": timeframe,
                        "candles": records
                    }).encode("utf-8"))
                else:
                    # Try fallback to live analysis via Binance / Yahoo
                    fb = get_live_market_analysis(symbol, timeframe)
                    self.send_response(200)
                    self._set_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps(fb, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

        elif path == "/api/analysis":
            analysis = get_live_market_analysis(symbol=symbol, timeframe=timeframe)
            self.send_response(200)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(analysis, ensure_ascii=False).encode("utf-8"))

        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            body = json.loads(post_data)
        except Exception:
            body = {}

        if path == "/api/qwen/stream":
            messages = body.get("messages", [])
            enable_tools = body.get("enable_tools", False)
            if not messages:
                user_msg = body.get("message", "")
                if user_msg:
                    messages = [{"role": "user", "content": user_msg}]

            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()

            try:
                for chunk in qwen_engine.chat_stream(messages=messages, enable_tools=enable_tools):
                    payload = f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                    self.wfile.write(payload.encode("utf-8"))
                    self.wfile.flush()
            except Exception as e:
                logger.error(f"SSE stream error: {e}")
            return

        elif path == "/api/qwen/chat":
            messages = body.get("messages", [])
            enable_tools = body.get("enable_tools", True)
            if not messages:
                user_msg = body.get("message", "")
                if user_msg:
                    messages = [{"role": "user", "content": user_msg}]

            reply = qwen_engine.chat_completion(messages=messages, enable_tools=enable_tools)
            self.send_response(200)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "message": reply
            }, ensure_ascii=False).encode("utf-8"))

        elif path == "/api/qwen/read_web":
            url = body.get("url", "")
            if not url:
                self.send_response(400)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing url in JSON body"}).encode("utf-8"))
                return

            result = read_web_page(url)
            self.send_response(200)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))

        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))


def run_api_server(port: int = PORT):
    import threading
    def try_mt5_bg():
        try:
            connect_mt5(timeout=1500)
        except Exception as e:
            logger.warning(f"MT5 auto-connect skipped: {e}")

    threading.Thread(target=try_mt5_bg, daemon=True).start()

    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, FreyAPIHandler)
    logger.info(f"🚀 Frey AI & Qwen Local API Server running on http://localhost:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping API Server...")
        httpd.server_close()


if __name__ == "__main__":
    run_api_server()
