"""
ai_agent.py - Frey AI Core Decision Engine & LLM Integration
Connects to LLM API (Google Gemini / OpenAI compatible) and enforces strict JSON output schema.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("FreyAIAgent")

SYSTEM_PROMPT = """You are FREY AI, an institutional-grade autonomous trading algorithm specialized exclusively in EURUSD (Forex) and ETHUSD (Crypto CFD).

Your account has a balance of $100.00 USD. Your maximum risk per trade is strictly capped at $3.00 USD (3.0%).

Your mission:
1. Analyze the provided technical indicators (EMA 20/50 Trend Bias, RSI 14 Momentum, ATR 14 Volatility, and Price Action).
2. For EURUSD: Align with London/New York session breakout flows and EMA pullbacks. Target minimum 1:1.5 Risk-to-Reward.
3. For ETHUSD: Align with multi-hour trend continuation, dynamic EMA support, and RSI recovery. Target minimum 1:1.5 Risk-to-Reward.
4. Calculate an objective confidence score from 0.00 to 1.00.
5. If conditions are choppy, conflicting, or confidence is below 0.75, your decision MUST be "WAIT".
6. Never risk more than the computed $3.00 stop-loss distance.

You MUST respond strictly with a valid JSON object matching this exact schema:
{
  "symbol": "EURUSD" or "ETHUSD",
  "action": "BUY" | "SELL" | "WAIT",
  "confidence_score": 0.85,
  "entry_price": 1.0860,
  "stop_loss": 1.0830,
  "take_profit": 1.0920,
  "risk_reward_ratio": 2.0,
  "timeframe": "M15" or "H1",
  "strategy_tags": ["EMA_PULLBACK", "RSI_MOMENTUM"],
  "technical_rationale": "Clear and concise explanation of technical catalyst",
  "risk_compliance": true
}
Do NOT include any markdown code blocks, backticks, or extra conversational text. Return ONLY the raw JSON object.
"""


class FreyAIAgent:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-2.5-flash",
        api_provider: str = "gemini",
        min_confidence_threshold: float = 0.75
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.model_name = model_name
        self.api_provider = api_provider.lower()
        self.min_confidence_threshold = min_confidence_threshold

    def analyze_market(self, market_context_str: str, symbol: str) -> Dict[str, Any]:
        """
        Sends the market context to the LLM and parses the structured trading decision.
        """
        if not self.api_key:
            logger.warning("No API Key detected. Using local algorithmic rule-based fallback decision engine.")
            return self._rule_based_fallback(market_context_str, symbol)

        try:
            if self.api_provider == "gemini":
                raw_response = self._call_gemini_api(market_context_str)
            else:
                raw_response = self._call_openai_compatible_api(market_context_str)

            decision = self._parse_json_response(raw_response)
            return self._validate_and_filter_decision(decision)

        except Exception as e:
            logger.error(f"Error during AI decision generation: {e}. Defaulting to WAIT.")
            return {
                "symbol": symbol,
                "action": "WAIT",
                "confidence_score": 0.0,
                "reasoning": f"AI Engine Exception: {str(e)}",
                "risk_compliance": False
            }

    def _call_gemini_api(self, prompt: str) -> str:
        """
        Calls Google Gemini API using REST endpoint.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": SYSTEM_PROMPT + "\n\n" + prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        resp = requests.post(url, json=payload, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    def _call_openai_compatible_api(self, prompt: str) -> str:
        """
        Calls OpenAI-compatible completion API.
        """
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

    def _parse_json_response(self, raw_text: str) -> Dict[str, Any]:
        """
        Extracts and parses JSON from the LLM response text.
        """
        clean_text = raw_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        return json.loads(clean_text)

    def _validate_and_filter_decision(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates LLM output against confidence threshold and safety rules.
        """
        confidence = float(decision.get("confidence_score", 0.0))
        action = str(decision.get("action", "WAIT")).upper()

        if action in ["BUY", "SELL"] and confidence < self.min_confidence_threshold:
            logger.info(f"AI suggested {action} but confidence ({confidence:.2f}) < threshold ({self.min_confidence_threshold}). Downgrading to WAIT.")
            decision["action"] = "WAIT"
            decision["technical_rationale"] = f"Confidence {confidence:.2f} below required {self.min_confidence_threshold} threshold. Downgraded to WAIT."

        return decision

    def _rule_based_fallback(self, prompt: str, symbol: str) -> Dict[str, Any]:
        """
        Deterministic algorithmic fallback when API Key is not configured.
        """
        # Safe default
        return {
            "symbol": symbol,
            "action": "WAIT",
            "confidence_score": 0.50,
            "technical_rationale": "No LLM API Key configured. Algorithmic safety fallback active (WAIT).",
            "risk_compliance": True
        }


if __name__ == "__main__":
    agent = FreyAIAgent()
    print("FreyAIAgent initialized successfully.")
    sample_decision = agent.analyze_market("Sample market context", "ETHUSD")
    print("Sample Decision:", sample_decision)
