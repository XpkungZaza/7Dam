# 🏛️ รายงานสรุปภาพรวม & คู่มือการใช้งานเบื้องต้น: FREY AI (Zeta Agent)
**Project 7Dam — Autonomous Market Intelligence & Quantitative Trading Engine**

---

## 📌 1. สิ่งที่ได้พัฒนาเสร็จสมบูรณ์แล้ว (What We Have Built)

ระบบของ **Frey AI** ได้รับการพัฒนาอย่างสมบูรณ์แบบทั้งในฝั่ง **Python Backend (MetaTrader 5 Autonomous Engine)** และฝั่ง **Frontend Web Dashboard** โดยแยกไฟล์ทั้งหมดไว้ในโฟลเดอร์ `Frey_AI/` อย่างเป็นระเบียบ:

### 📁 โครงสร้างไฟล์ทั้งหมดในระบบ (`Frey_AI/`)

| หมวดหมู่ | ไฟล์ | หน้าที่หลัก |
|---|---|---|
| **Web UI & Dashboard** | `frey-config.js` | ค่าคอนฟิกกลางสำหรับ Frontend (พารามิเตอร์ EURUSD & ETHUSD) |
| | `frey-dashboard.js` | ระบบเรนเดอร์กราฟแท่งเทียน Canvas สด, อินดิเคเตอร์, และมาตรวัดความน่าจะเป็น |
| | `frey-dashboard.css` | ธีม Cyber-Fintech Glassmorphism (มืด-นีออน มรกต/ฟ้า/ม่วง) |
| **Data & Feature Engine** | `asset_config.py` | Profile เฉพาะทางสำหรับ EURUSD (Forex) และ ETHUSD (Crypto CFD) |
| | `market_data.py` | ท่อเชื่อมต่อ MT5, ค้นหาชื่อคู่เงินอัตโนมัติ (Symbol Resolver), ดึง OHLCV |
| | `indicators.py` | คำนวณทางเทคนิค: EMA 20/50, RSI 14 (Wilder's Smoothing), ATR 14 |
| **Risk & Execution** | `risk_manager.py` | คำนวณ Lot Size ล็อกผลขาดทุนไม่เกิน **$3.00** (3% ของพอร์ต $100) |
| | `order_executor.py` | ตัวส่งออเดอร์ MT5 (Magic #777001) พร้อมวาง SL และ TP ทันที |
| | `safety_guard.py` | Circuit Breaker: ตัดขาดทุนรายวัน ($6), กรอง Spread, จำกัด 1 ออเดอร์ |
| | `position_tracker.py` | เลื่อน SL บังทุน (Break-Even) อัตโนมัติเมื่อกำไรถึง 1R ($3.00) และ Trailing Stop |
| **AI Intelligence** | `coach_context.py` | สร้าง Context ภาษา Markdown/JSON สำหรับส่งให้ LLM วิเคราะห์ |
| | `ai_agent.py` | ตัวเชื่อมต่อ AI (Gemini / OpenAI) วิเคราะห์ด้วย Strict JSON Schema |
| **Runner & Database** | `bot_runner.py` | สคริปต์รัน Loop อัตโนมัติตามแท่งเทียน (Candle-Close Trigger) |
| | `database.py` | ระบบบันทึกประวัติการตัดสินใจและการเทรดลง SQLite (`frey_trades.db`) |
| | `notifier.py` | แจ้งเตือนผ่าน Telegram Bot และ LINE Notify |
| **Hub Integration** | `index.html` & `js/app.js` | เปิดใช้งาน Slot 6 (F.R.E.Y.) ให้กดเข้า Dashboard ได้จาก 7Dam Hub |

---

## ⚡ 2. ระบบปัจจุบันสามารถทำอะไรได้บ้าง (Capabilities & Features)

### 1. 🧮 AI คำนวณตลาด & ทิศทางความน่าจะเป็น (Probability Engine)
* คำนวณคะแนน **ความน่าจะเป็น (Probability %)** แบบไดนามิก:
  * **`BUY %`**, **`SELL %`**, **`WAIT %`** โดยประเมินร่วมกันระหว่าง Trend Bias (EMA 20/50), Momentum (RSI 14) และ Volatility (ATR 14)
* ประเมินสภาวะตลาดแยกกันระหว่าง **EURUSD** (เน้นรอบเวลา London/NY) และ **ETHUSD** (เน้นเทรนด์ Crypto 24/7)

### 2. 🛡️ การคุมความเสี่ยงระดับสถาบันสำหรับพอร์ต $100 (Ironclad Risk Engine)
* **ล็อกผลขาดทุนสูงสุดไม้ละ $3.00 USD (3.0%):** คำนวณ Lot Size แม่นยำตาม Contract Size ของโบรกเกอร์ (เช่น EURUSD 0.01 lot / ETHUSD 0.06 lot)
* **ปฏิเสธคำสั่งเสี่ยงสูงอัตโนมัติ (Auto-Reject):** หากระยะ SL กว้างจนขนาด Lot ต่ำกว่า `0.01` ระบบจะระงับการเทรดทันทีเพื่อไม่ให้ขาดทุนเกิน $3.00
* **Daily Loss Circuit Breaker:** หากวันใดขาดทุนสะสมถึง **$6.00 (6%)** ระบบจะหยุดเทรด 24 ชม. ทันที
* **จำกัดสูงสุด 1 ไม้ในเวลาเดียวกัน:** เพื่อรักษา Margin และความปลอดภัยของพอร์ตเล็ก

### 3. 🎯 การบริหารออเดอร์อัตโนมัติ (Active Trade Management)
* ทุกออเดอร์มี **Stop Loss** และ **Take Profit** แนบไปในคำสั่งเสมอ (ไม่มีการเปิด Naked Order)
* เมื่อราคาวิ่งไปในทิศทางกำไรถึง **1R ($3.00)** ระบบจะเลื่อน SL มาที่ **Break-Even (จุดคุ้มทุน)** อัตโนมัติ

### 4. 🖥️ หน้าเว็บแดชบอร์ดล้ำสมัย (Interactive Web Dashboard)
* เข้าใช้งานได้โดยตรงผ่านหน้า **Project 7Dam Hub (`index.html`)** ที่ช่อง **Slot 06: F.R.E.Y.**
* มีกราฟแท่งเทียนแบบ Live HTML5 Canvas พร้อมเส้น EMA 20 (ฟ้า) และ EMA 50 (ม่วง)
* มาตรวัดเรดาร์ AI Direction Probability แบบวงแหวนเรืองแสง
* สลับดูกราฟและผลวิเคราะห์ระหว่าง **EURUSD (M15)** และ **ETHUSD (H1)** ได้ใน 1 คลิก
* แสดงกล่องข้อความจำลอง **AI Thought Stream (กระบวนการคิดสดของ Frey AI)**

---

## 📖 3. คู่มือการใช้งานเบื้องต้น ณ ตอนนี้ (Quick Start Guide)

### วิธีที่ 1: การเปิดใช้งานหน้า Web Dashboard ผ่าน Project 7Dam Hub
1. เปิดไฟล์ `index.html` บนเว็บเบราว์เซอร์ (Chrome, Edge ฯลฯ) หรือรัน Live Server
2. บนหน้าหลัก **PROJECT 7DAM** คุณจะเห็นช่องที่ 6 เปลี่ยนเป็น **`F.R.E.Y. (ACTIVE)`** พร้อมไอคอนกราฟการเงินสีเขียว-ฟ้า
3. คลิกที่การ์ด **F.R.E.Y.** เพื่อเข้าสู่หน้าแดชบอร์ด
4. คุณสามารถ:
   * กดปุ่มสลับสินทรัพย์ระหว่าง **`💶 EURUSD (M15)`** กับ **`⚡ ETHUSD (H1)`**
   * เลื่อนเมาส์บนกราฟเพื่อดูราคาปิด (Close Price) และเส้นค่าเฉลี่ย
   * สังเกตการอัปเดตของมาตรวัด **AI Direction Probability (%)** และค่า Lot Size
   * กดปุ่ม **`Back to 7Dam Hub`** ที่มุมซ้ายบนเพื่อกลับสู่หน้าเลือก Agent

---

### วิธีที่ 2: การสั่งรัน Python Trading Engine (MT5 Backend)

เปิด PowerShell หรือ Terminal เข้าไปที่โฟลเดอร์ `Frey_AI`:
```powershell
cd c:\Users\thana\Desktop\Dev-work\Project-7Dam\Frey_AI
```

#### 🟢 โหมดที่ 1: โหมดจำลองผล (DRY RUN) — *แนะนำสำหรับการทดสอบ*
รันเพื่อดูการคำนวณตลาด ตรวจสอบเงื่อนไขความปลอดภัย และดูผลวิเคราะห์ของ AI โดยไม่ส่งออเดอร์จริงเข้าพอร์ต:
```powershell
python bot_runner.py DRY_RUN
```

#### 🟡 โหมดที่ 2: โหมดที่ปรึกษา (ADVISOR)
AI จะวิเคราะห์ตลาดเมื่อปิดแท่งเทียน และส่งสัญญาณแจ้งเตือนเข้า Telegram/LINE เพื่อรอให้เราตัดสินใจกดยืนยัน:
```powershell
python bot_runner.py ADVISOR
```

#### 🔴 โหมดที่ 3: โหมดเทรดอัตโนมัติ 100% (AUTO)
AI จะส่งคำสั่งซื้อขายจริงเข้าโปรแกรม MT5 พร้อมตั้ง TP/SL และควบคุมความเสี่ยงอัตโนมัติ:
```powershell
python bot_runner.py AUTO
```

---

### 🔑 การตั้งค่าเพิ่มเติม (ไม่บังคับ / Optional):
หากต้องการเชื่อมต่อ **Google Gemini API** หรือ **Telegram Alerts** สามารถกำหนด Environment Variables ในเครื่องได้ดังนี้:
* `GEMINI_API_KEY`: คีย์สำหรับให้ AI สรุปเหตุผลเชิงลึก (ถ้าไม่ใส่ ระบบจะใช้ Rule-Based Fallback อัตโนมัติ)
* `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`: สำหรับรับสัญญาณแจ้งเตือนเข้ามือถือ

---

## 🚀 4. แผนงานขั้นถัดไปที่แนะนำ (Next Steps)
1. **10-Year Historical Ingestion (`historical_fetcher.py`)**: ดูดข้อมูลย้อนหลัง 10 ปี (2016-2026) ทั้ง EURUSD และ ETHUSD
2. **Walk-Forward Market Replay (`market_replay.py`)**: ระบบจำลองกราฟไหลตั้งแต่อดีตสู่ปัจจุบันเพื่อทดสอบความแม่นยำ (Backtest Validator)
3. **Replay Time Slider บน Dashboard**: เพิ่มแถบเลื่อนเวลาย้อนหลังบนหน้าเว็บแดชบอร์ด
