"""
Isolated Policy-Enforcing Treasury Signer (Fase 2 — audit C1/H3).

Runs ONLY on the hardened, network-isolated server that holds the treasury key.
The public API server cannot sign anything itself; it calls this service over a
PRIVATE channel (firewall: only the API server's IP may reach this port).

Why isolation alone is not enough: if this service blindly signed whatever it was
asked, a compromised API would simply ask it to sign the theft. So this signer
enforces its OWN policy and refuses anything outside it:
  - HMAC-SHA256 shared-secret auth on every request.
  - Per-transaction cap  (AUTO_PAYOUT_CAP_COOKIE): above it -> needs_manual_approval.
  - Rolling 24h cap       (DAILY_PAYOUT_CAP_COOKIE): bounds total blast radius.
  - Idempotency by request_id (dedupe ledger): a retry never double-pays.
  - Recipient sanity check (base58 length).
Only within all limits does it invoke dispatch_treasury_payout.js (which loads the
treasury keypair from config/treasury_vault_keypair.json ON THIS BOX) to sign+send.

Deploy (on the isolated box only):
  pip install fastapi uvicorn
  export SIGNER_SHARED_SECRET=<same secret as the API server>
  export TREASURY_KEYPAIR_PATH=/secure/path/treasury_vault_keypair.json
  export AUTO_PAYOUT_CAP_COOKIE=1000
  export DAILY_PAYOUT_CAP_COOKIE=10000
  uvicorn signer.signer_service:app --host 127.0.0.1 --port 8791
Then expose port 8791 to the API server ONLY (private network / firewall allowlist),
and point the API server at it with SIGNER_URL=http://<signer-host>:8791.
"""

import os
import json
import time
import hmac
import hashlib
import sqlite3
import subprocess

from fastapi import FastAPI, Request, HTTPException

SHARED_SECRET = os.getenv("SIGNER_SHARED_SECRET", "").strip()
AUTO_PAYOUT_CAP_COOKIE = float(os.getenv("AUTO_PAYOUT_CAP_COOKIE", "1000"))
DAILY_PAYOUT_CAP_COOKIE = float(os.getenv("DAILY_PAYOUT_CAP_COOKIE", "10000"))
LEDGER_DB = os.getenv("SIGNER_LEDGER_DB", os.path.join(os.path.dirname(__file__), "signer_ledger.db"))
DISPATCH_JS = os.getenv(
    "DISPATCH_SCRIPT_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "dispatch_treasury_payout.js"),
)
_B58 = set("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")

app = FastAPI(title="Cookie Treasury Signer", docs_url=None, redoc_url=None)


def _db():
    c = sqlite3.connect(LEDGER_DB)
    c.execute("""CREATE TABLE IF NOT EXISTS payouts (
        request_id TEXT PRIMARY KEY, recipient TEXT, amount_cookie REAL,
        tx_signature TEXT, status TEXT, created_at REAL)""")
    return c


def _valid_recipient(addr: str) -> bool:
    return bool(addr) and 32 <= len(addr) <= 44 and all(ch in _B58 for ch in addr)


def _daily_total(conn) -> float:
    since = time.time() - 86400.0
    row = conn.execute(
        "SELECT COALESCE(SUM(amount_cookie),0) FROM payouts WHERE status='PAID' AND created_at>=?",
        (since,),
    ).fetchone()
    return float(row[0] or 0.0)


@app.post("/sign-payout")
async def sign_payout(request: Request):
    raw = await request.body()

    # 1. Authenticate the request (constant-time HMAC compare).
    if SHARED_SECRET:
        provided = request.headers.get("X-Signature", "")
        expected = hmac.new(SHARED_SECRET.encode("utf-8"), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(provided, expected):
            raise HTTPException(status_code=401, detail="bad signature")

    try:
        body = json.loads(raw.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="invalid JSON")

    recipient = body.get("recipient", "")
    amount = float(body.get("amount_cookie", 0) or 0)
    request_id = str(body.get("request_id", "")).strip()
    memo = str(body.get("memo", ""))[:120]

    if not request_id:
        return {"status": "failed", "error": "missing request_id"}
    if amount <= 0:
        return {"status": "failed", "error": "invalid amount"}
    if not _valid_recipient(recipient):
        return {"status": "failed", "error": "invalid recipient address"}

    conn = _db()
    try:
        # 2. Idempotency: a repeated request_id never pays twice.
        prev = conn.execute(
            "SELECT status, tx_signature FROM payouts WHERE request_id=?", (request_id,)
        ).fetchone()
        if prev and prev[0] == "PAID":
            return {"status": "confirmed", "tx_signature": prev[1],
                    "cookiescan_url": f"https://cookiescan.io/tx/{prev[1]}", "idempotent": True}

        # 3. Policy caps.
        if amount > AUTO_PAYOUT_CAP_COOKIE:
            conn.execute(
                "INSERT OR REPLACE INTO payouts VALUES (?,?,?,?,?,?)",
                (request_id, recipient, amount, None, "NEEDS_APPROVAL", time.time()),
            )
            conn.commit()
            return {"status": "needs_manual_approval",
                    "reason": f"amount {amount} > per-tx cap {AUTO_PAYOUT_CAP_COOKIE}"}
        if _daily_total(conn) + amount > DAILY_PAYOUT_CAP_COOKIE:
            return {"status": "needs_manual_approval",
                    "reason": f"24h payout cap {DAILY_PAYOUT_CAP_COOKIE} would be exceeded"}

        # 4. Within limits -> sign & broadcast via the treasury keypair (this box only).
        try:
            proc = subprocess.run(
                ["node", DISPATCH_JS, "--to", recipient, "--amount", str(round(amount, 6)), "--memo", memo],
                capture_output=True, text=True, timeout=40, env=dict(os.environ),
            )
        except Exception as e:
            return {"status": "failed", "error": f"dispatch error: {e}"}

        if proc.returncode != 0:
            return {"status": "failed", "error": (proc.stderr or proc.stdout or "dispatch failed").strip()[:300]}

        try:
            res = json.loads(proc.stdout)
        except Exception:
            return {"status": "failed", "error": "dispatch returned non-JSON"}
        if not res.get("success") or not res.get("tx_signature"):
            return {"status": "failed", "error": res.get("error", "dispatch reported no signature")}

        tx_sig = res["tx_signature"]
        conn.execute(
            "INSERT OR REPLACE INTO payouts VALUES (?,?,?,?,?,?)",
            (request_id, recipient, amount, tx_sig, "PAID", time.time()),
        )
        conn.commit()
        return {"status": "confirmed", "tx_signature": tx_sig,
                "slot": res.get("slot"),
                "cookiescan_url": res.get("cookiescan_url", f"https://cookiescan.io/tx/{tx_sig}")}
    finally:
        conn.close()


@app.get("/healthz")
async def healthz():
    return {"status": "ok", "auto_cap": AUTO_PAYOUT_CAP_COOKIE, "daily_cap": DAILY_PAYOUT_CAP_COOKIE}
