"""
notifier.py - Alert & Telemetry Notifications for Frey AI
Supports Telegram Bot API and LINE Notify.
"""

import os
import logging
from typing import Optional
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("Notifier")


class Notifier:
    def __init__(
        self,
        telegram_token: Optional[str] = None,
        telegram_chat_id: Optional[str] = None,
        line_token: Optional[str] = None
    ):
        self.telegram_token = telegram_token or os.getenv("TELEGRAM_BOT_TOKEN")
        self.telegram_chat_id = telegram_chat_id or os.getenv("TELEGRAM_CHAT_ID")
        self.line_token = line_token or os.getenv("LINE_NOTIFY_TOKEN")

    def send_telegram(self, message: str) -> bool:
        if not self.telegram_token or not self.telegram_chat_id:
            return False
        try:
            url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
            payload = {
                "chat_id": self.telegram_chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            resp = requests.post(url, json=payload, timeout=10)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Telegram notification failed: {e}")
            return False

    def send_line(self, message: str) -> bool:
        if not self.line_token:
            return False
        try:
            url = "https://notify-api.line.me/api/notify"
            headers = {"Authorization": f"Bearer {self.line_token}"}
            payload = {"message": message}
            resp = requests.post(url, headers=headers, data=payload, timeout=10)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"LINE notification failed: {e}")
            return False

    def notify(self, title: str, body: str):
        """
        Sends notification to all configured channels and prints to console.
        """
        formatted_msg = f"*{title}*\n\n{body}"
        logger.info(f"[NOTIFIER] {title}\n{body}")

        self.send_telegram(formatted_msg)
        self.send_line(f"\n{title}\n{body}")


if __name__ == "__main__":
    notifier = Notifier()
    notifier.notify("🚀 FREY AI TEST", "Notifier module initialized successfully.")
