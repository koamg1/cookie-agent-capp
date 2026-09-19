"""
App-level Real Burn Tracker for CookieAgent cApp
Tracks real cumulative $COOKIE burns executed specifically through this application.
Persisted in SQLite across restarts.
"""

import os
import sqlite3
import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app_burns.db")


class BurnRecord(BaseModel):
    id: str
    timestamp: float
    user_address: str
    amount_cookie: float
    source: str  # 'user_oven', 'hyper_arb', 'radar_capture'
    tx_signature: str
    slot: Optional[int] = None


class AppBurnTracker:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS app_burn_records (
                    id TEXT PRIMARY KEY,
                    timestamp REAL NOT NULL,
                    user_address TEXT NOT NULL,
                    amount_cookie REAL NOT NULL,
                    source TEXT NOT NULL,
                    tx_signature TEXT NOT NULL,
                    slot INTEGER
                )
            """)
            conn.commit()

    def record_burn(
        self,
        user_address: str,
        amount_cookie: float,
        tx_signature: str,
        source: str = "user_oven",
        slot: Optional[int] = None
    ) -> BurnRecord:
        record_id = f"BURN-{int(time.time())}-{abs(hash(tx_signature)) % 100000:05d}"
        rec = BurnRecord(
            id=record_id,
            timestamp=time.time(),
            user_address=user_address,
            amount_cookie=round(float(amount_cookie), 4),
            source=source,
            tx_signature=tx_signature,
            slot=slot
        )
        with self._get_conn() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO app_burn_records (id, timestamp, user_address, amount_cookie, source, tx_signature, slot)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (rec.id, rec.timestamp, rec.user_address, rec.amount_cookie, rec.source, rec.tx_signature, rec.slot))
            conn.commit()
        return rec

    def get_total_burned(self) -> Dict[str, Any]:
        with self._get_conn() as conn:
            row = conn.execute("""
                SELECT 
                    COALESCE(SUM(amount_cookie), 0.0) as total_burned,
                    COUNT(*) as total_events
                FROM app_burn_records
            """).fetchone()

            recent_rows = conn.execute("""
                SELECT * FROM app_burn_records
                ORDER BY timestamp DESC
                LIMIT 10
            """).fetchall()

            recent = [
                {
                    "id": r["id"],
                    "timestamp": r["timestamp"],
                    "user_address": r["user_address"],
                    "amount_cookie": r["amount_cookie"],
                    "source": r["source"],
                    "tx_signature": r["tx_signature"],
                    "slot": r["slot"]
                }
                for r in recent_rows
            ]

            total_burned = float(row["total_burned"]) if row else 0.0
            total_events = int(row["total_events"]) if row else 0

            return {
                "total_burned_by_app": round(total_burned, 4),
                "total_burn_events": total_events,
                "burn_address": "1nc1nerator11111111111111111111111111111111",
                "recent_burns": recent
            }


burn_tracker = AppBurnTracker()
