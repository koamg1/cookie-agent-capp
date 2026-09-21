"""
Treasury payout signer client (audit C1/H3 — Fase 2).

The public API server NEVER holds the treasury key. To pay a withdrawal it asks an
ISOLATED, policy-enforcing signer service (see signer/signer_service.py) to sign and
broadcast the transfer over a private channel. This module is that client.

Modes:
  - REAL          : POST to SIGNER_URL with an HMAC shared secret. The signer enforces
                    caps + dedupe, signs with the treasury key (which lives ONLY on the
                    isolated box), broadcasts, confirms, and returns the tx signature.
  - SIMULATED     : ONLY when explicitly allowed (test suite / local dev via
                    ALLOW_SIMULATED_SIGNER=true). Returns a synthetic confirmed tx with
                    NO key involved. Never silently allowed in production.
  - UNCONFIGURED  : production without SIGNER_URL -> refuses. There is deliberately NO
                    hot-key fallback: a missing signer must never pay from a local key.

The caller (vault withdraw) must debit shares ONLY when status == 'confirmed'.
"""

import os
import json
import time
import hmac
import hashlib
import urllib.request

SIGNER_URL = os.getenv("SIGNER_URL", "").strip()
SIGNER_SHARED_SECRET = os.getenv("SIGNER_SHARED_SECRET", "").strip()
SIGNER_TIMEOUT_SECS = float(os.getenv("SIGNER_TIMEOUT_SECS", "30"))


def _is_test_env() -> bool:
    return bool(os.getenv("PYTEST_CURRENT_TEST") or os.getenv("TESTING") == "1")


def _simulation_allowed() -> bool:
    return _is_test_env() or os.getenv("ALLOW_SIMULATED_SIGNER", "false").lower() == "true"


def request_payout(recipient: str, amount_cookie: float, request_id: str, memo: str = "") -> dict:
    """
    Ask the isolated signer to pay `amount_cookie` native $COOKIE to `recipient`.
    Idempotent by `request_id` (the signer dedupes; a retry never double-pays).

    Returns one of:
      {"status": "confirmed", "tx_signature", "slot", "cookiescan_url", "mode"}
      {"status": "needs_manual_approval", "reason"}   # above the signer's auto cap
      {"status": "failed", "error"}
    """
    if amount_cookie is None or amount_cookie <= 0:
        return {"status": "failed", "error": "invalid payout amount"}
    if not recipient or not request_id:
        return {"status": "failed", "error": "missing recipient or request_id"}

    if SIGNER_URL:
        return _request_real(recipient, amount_cookie, request_id, memo)

    if _simulation_allowed():
        return {
            "status": "confirmed",
            "tx_signature": f"SIM-PAYOUT-{int(time.time())}-{str(request_id)[:8]}",
            "slot": None,
            "cookiescan_url": None,
            "mode": "SIMULATED_NO_SIGNER",
        }

    return {
        "status": "failed",
        "error": (
            "Signer not configured (SIGNER_URL unset). Refusing to pay from a hot key. "
            "Deploy the isolated signer service and set SIGNER_URL/SIGNER_SHARED_SECRET."
        ),
    }


def _request_real(recipient: str, amount_cookie: float, request_id: str, memo: str) -> dict:
    body = json.dumps({
        "recipient": recipient,
        "amount_cookie": round(float(amount_cookie), 6),
        "request_id": str(request_id),
        "memo": (memo or "")[:120],
        "ts": int(time.time()),
    }).encode("utf-8")

    headers = {"Content-Type": "application/json"}
    if SIGNER_SHARED_SECRET:
        headers["X-Signature"] = hmac.new(
            SIGNER_SHARED_SECRET.encode("utf-8"), body, hashlib.sha256
        ).hexdigest()

    try:
        req = urllib.request.Request(
            SIGNER_URL.rstrip("/") + "/sign-payout", data=body, headers=headers, method="POST"
        )
        with urllib.request.urlopen(req, timeout=SIGNER_TIMEOUT_SECS) as r:
            data = json.loads(r.read().decode("utf-8"))
    except Exception as e:
        # Network / signer down -> failure, never a fallback payment.
        return {"status": "failed", "error": f"signer unreachable: {e}"}

    st = data.get("status")
    if st == "confirmed":
        return {
            "status": "confirmed",
            "tx_signature": data.get("tx_signature"),
            "slot": data.get("slot"),
            "cookiescan_url": data.get("cookiescan_url"),
            "mode": "REAL_SIGNER",
        }
    if st == "needs_manual_approval":
        return {"status": "needs_manual_approval", "reason": data.get("reason", "above auto payout cap")}
    return {"status": "failed", "error": data.get("error", "signer rejected the payout")}
