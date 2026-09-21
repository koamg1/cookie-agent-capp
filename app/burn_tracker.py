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
    verified: bool = False


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
                    slot INTEGER,
                    verified INTEGER NOT NULL DEFAULT 0
                )
            """)
            # Schema migration for databases created before on-chain verification
            cols = [r[1] for r in conn.execute("PRAGMA table_info(app_burn_records)").fetchall()]
            if "verified" not in cols:
                conn.execute("ALTER TABLE app_burn_records ADD COLUMN verified INTEGER NOT NULL DEFAULT 0")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_burn_records_tx ON app_burn_records(tx_signature)")
            conn.commit()

    def record_burn(
        self,
        user_address: str,
        amount_cookie: float,
        tx_signature: str,
        source: str = "user_oven",
        slot: Optional[int] = None,
        verified: bool = False
    ) -> BurnRecord:
        with self._get_conn() as conn:
            # Replay attack prevention / deduplication of on-chain burns
            existing = conn.execute(
                "SELECT * FROM app_burn_records WHERE tx_signature = ?",
                (tx_signature,)
            ).fetchone()
            if existing:
                # If existing record was unverified but is now verified, upgrade it in DB
                if verified and not bool(existing["verified"]):
                    final_amt = round(float(amount_cookie or existing["amount_cookie"]), 4)
                    final_slot = slot or existing["slot"]
                    conn.execute(
                        "UPDATE app_burn_records SET verified = 1, amount_cookie = ?, slot = ? WHERE id = ?",
                        (final_amt, final_slot, existing["id"])
                    )
                    conn.commit()
                    return BurnRecord(
                        id=existing["id"],
                        timestamp=existing["timestamp"],
                        user_address=existing["user_address"],
                        amount_cookie=final_amt,
                        source=existing["source"],
                        tx_signature=existing["tx_signature"],
                        slot=final_slot,
                        verified=True
                    )
                return BurnRecord(
                    id=existing["id"],
                    timestamp=existing["timestamp"],
                    user_address=existing["user_address"],
                    amount_cookie=existing["amount_cookie"],
                    source=existing["source"],
                    tx_signature=existing["tx_signature"],
                    slot=existing["slot"],
                    verified=bool(existing["verified"])
                )

            record_id = f"BURN-{int(time.time())}-{abs(hash(tx_signature)) % 100000:05d}"
            rec = BurnRecord(
                id=record_id,
                timestamp=time.time(),
                user_address=user_address,
                amount_cookie=round(float(amount_cookie), 4),
                source=source,
                tx_signature=tx_signature,
                slot=slot,
                verified=verified
            )
            conn.execute("""
                INSERT OR REPLACE INTO app_burn_records (id, timestamp, user_address, amount_cookie, source, tx_signature, slot, verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (rec.id, rec.timestamp, rec.user_address, rec.amount_cookie, rec.source, rec.tx_signature, rec.slot, 1 if rec.verified else 0))
            conn.commit()
            return rec

    def batch_sync_burns(self, burns: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Synchronizes a list of verified on-chain burns into the database.
        Returns count of newly inserted and updated records.
        """
        new_count = 0
        upgraded_count = 0
        with self._get_conn() as conn:
            for b in burns:
                sig = b.get("tx_signature")
                if not sig:
                    continue
                user_addr = b.get("user_address", "")
                amt = round(float(b.get("amount_cookie", 0.0)), 4)
                slot = b.get("slot")
                ts = float(b.get("timestamp") or time.time())
                source = b.get("source", "user_oven")

                existing = conn.execute(
                    "SELECT * FROM app_burn_records WHERE tx_signature = ?",
                    (sig,)
                ).fetchone()

                if existing:
                    if not bool(existing["verified"]):
                        conn.execute(
                            "UPDATE app_burn_records SET verified = 1, amount_cookie = ?, slot = ? WHERE id = ?",
                            (amt or existing["amount_cookie"], slot or existing["slot"], existing["id"])
                        )
                        upgraded_count += 1
                else:
                    record_id = f"BURN-{int(ts)}-{abs(hash(sig)) % 100000:05d}"
                    conn.execute("""
                        INSERT INTO app_burn_records (id, timestamp, user_address, amount_cookie, source, tx_signature, slot, verified)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                    """, (record_id, ts, user_addr, amt, source, sig, slot))
                    new_count += 1
            conn.commit()
        return {"inserted": new_count, "upgraded": upgraded_count}

    def get_known_signatures(self) -> set[str]:
        """Returns the set of all transaction signatures already stored in the DB."""
        with self._get_conn() as conn:
            rows = conn.execute("SELECT tx_signature FROM app_burn_records").fetchall()
            return {r["tx_signature"] for r in rows if r["tx_signature"]}

    def get_total_burned(self) -> Dict[str, Any]:
        with self._get_conn() as conn:
            row = conn.execute("""
                SELECT 
                    COALESCE(SUM(amount_cookie), 0.0) as total_burned,
                    COUNT(*) as total_events,
                    COALESCE(SUM(CASE WHEN amount_cookie >= 1.0 THEN amount_cookie * 10.0 ELSE 0.0 END), 0.0) as total_karma_generated,
                    COALESCE(SUM(CASE WHEN amount_cookie >= 1.0 THEN amount_cookie ELSE 0.0 END), 0.0) as eligible_burned,
                    COUNT(CASE WHEN amount_cookie >= 1.0 THEN 1 END) as eligible_events
                FROM app_burn_records
                WHERE verified = 1
            """).fetchone()

            recent_rows = conn.execute("""
                SELECT * FROM app_burn_records
                WHERE verified = 1
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
                    "slot": r["slot"],
                    "verified": bool(r["verified"])
                }
                for r in recent_rows
            ]

            total_burned = float(row["total_burned"]) if row else 0.0
            total_events = int(row["total_events"]) if row else 0
            total_karma = int(round(float(row["total_karma_generated"]))) if row else 0
            eligible_burned = float(row["eligible_burned"]) if row else 0.0
            eligible_events = int(row["eligible_events"]) if row else 0

            return {
                "total_burned_by_app": round(total_burned, 4),
                "total_burn_events": total_events,
                "total_karma_generated": total_karma,
                "eligible_burned_cookie": round(eligible_burned, 4),
                "eligible_burn_events": eligible_events,
                "burn_address": "1nc1nerator11111111111111111111111111111111",
                "recent_burns": recent
            }

    def get_user_burn_stats(self, user_address: str) -> Dict[str, Any]:
        with self._get_conn() as conn:
            row = conn.execute("""
                SELECT 
                    COALESCE(SUM(amount_cookie), 0.0) as burned_amount,
                    COUNT(*) as burn_count,
                    COALESCE(SUM(CASE WHEN amount_cookie >= 1.0 THEN amount_cookie ELSE 0.0 END), 0.0) as eligible_burned,
                    COUNT(CASE WHEN amount_cookie >= 1.0 THEN 1 END) as eligible_count,
                    COUNT(CASE WHEN amount_cookie < 1.0 THEN 1 END) as dust_count,
                    MAX(timestamp) as last_timestamp,
                    MAX(slot) as last_slot
                FROM app_burn_records
                WHERE user_address = ? AND verified = 1
            """, (user_address,)).fetchone()

            burned = float(row["burned_amount"]) if row else 0.0
            count = int(row["burn_count"]) if row else 0
            eligible_burned = float(row["eligible_burned"]) if row else 0.0
            eligible_count = int(row["eligible_count"]) if row else 0
            dust_count = int(row["dust_count"]) if row else 0
            last_ts = float(row["last_timestamp"]) if row and row["last_timestamp"] else 0.0
            last_slot = row["last_slot"] if row else None

            # 48-Hour Streak Multiplier:
            # Active if the last verified interaction occurred within the last 48 hours.
            now = time.time()
            streak_active = False
            streak_multiplier = 1.0
            hours_since_last_burn = None

            if last_ts > 0:
                diff_hours = (now - last_ts) / 3600.0
                hours_since_last_burn = round(diff_hours, 1)
                if diff_hours <= 48.0:
                    streak_active = True
                    # Scaling by eligible burn frequency: 1.1x up to 1.5x
                    streak_multiplier = min(1.5, 1.0 + (eligible_count * 0.05))
                    streak_multiplier = round(streak_multiplier, 2)

            return {
                "burned_cookie": round(burned, 4),
                "burn_count": count,
                "eligible_burned_cookie": round(eligible_burned, 4),
                "eligible_burn_count": eligible_count,
                "dust_burn_count": dust_count,
                "last_timestamp": last_ts,
                "last_slot": last_slot,
                "streak_active": streak_active,
                "streak_multiplier": streak_multiplier,
                "hours_since_last_burn": hours_since_last_burn,
                "anti_sybil_threshold_cookie": 1.0
            }

    def get_burn_leaderboard(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute("""
                SELECT 
                    user_address,
                    COALESCE(SUM(amount_cookie), 0.0) as total_burned,
                    COALESCE(SUM(CASE WHEN amount_cookie >= 1.0 THEN amount_cookie ELSE 0.0 END), 0.0) as eligible_burned,
                    COUNT(*) as events_count,
                    COUNT(CASE WHEN amount_cookie >= 1.0 THEN 1 END) as eligible_events,
                    MAX(slot) as last_slot,
                    MAX(timestamp) as last_timestamp
                FROM app_burn_records
                WHERE verified = 1
                GROUP BY user_address
                ORDER BY eligible_burned DESC, total_burned DESC
                LIMIT ?
            """, (limit,)).fetchall()

            leaderboard = []
            now = time.time()
            for idx, r in enumerate(rows):
                last_ts = float(r["last_timestamp"]) if r["last_timestamp"] else 0.0
                diff_hours = (now - last_ts) / 3600.0 if last_ts > 0 else 999.0
                streak_active = diff_hours <= 48.0
                eligible_burned = float(r["eligible_burned"])
                streak_mult = min(1.5, 1.0 + (int(r["eligible_events"]) * 0.05)) if streak_active else 1.0
                karma_pts = round(eligible_burned * 10.0 * streak_mult)

                leaderboard.append({
                    "rank": idx + 1,
                    "user_address": r["user_address"],
                    "total_burned_cookie": round(float(r["total_burned"]), 4),
                    "eligible_burned_cookie": round(eligible_burned, 4),
                    "burn_events": int(r["events_count"]),
                    "eligible_burn_events": int(r["eligible_events"]),
                    "last_slot": r["last_slot"],
                    "last_timestamp": r["last_timestamp"],
                    "streak_active": streak_active,
                    "streak_multiplier": round(streak_mult, 2),
                    "baker_karma_pts": karma_pts
                })
            return leaderboard


burn_tracker = AppBurnTracker()

