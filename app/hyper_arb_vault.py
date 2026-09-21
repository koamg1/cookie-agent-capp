"""
HyperArb Automated Dual-Leg Arbitrage Vault & 24/7 Sentinel Engine
Cookie Chain (SVM) - Native Protocol Infrastructure with SQLite Monotonic Persistence
"""

import os
import time
import math
import random
import sqlite3
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

COOKIE_USD_PRICE = 0.00008172  # Reference oracle price for COOKIE/USD (~$0.02 USD per 244.75 COOK)
BURN_ADDRESS = "1nc1nerator11111111111111111111111111111111"

# Database storage path for persistent state across process restarts
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vault_state.db")


class UserPosition(BaseModel):
    user_address: str
    shares: float = 0.0
    initial_deposited_cookie: float = 0.0
    initial_deposited_usdc: float = 0.0
    deposit_timestamp: float = Field(default_factory=time.time)
    claimed_yield_cookie: float = 0.0
    claimed_yield_usdc: float = 0.0


class ArbitrageExecutionRecord(BaseModel):
    id: str
    timestamp: float
    slot: int
    pair: str
    spread_pct: float
    gross_profit_usd: float
    profit_to_vault_usd: float
    burned_cookie: float
    cookie_jar_usd: float
    tx_signature: str
    status: str = "CONFIRMED_ON_CHAIN"


# NOTE: This module previously defined a standalone `HyperArbVault` class
# with hardcoded fabricated telemetry (baseline of 450 "arbitrage runs",
# random tx signatures, monotonic fake growth). That class was never
# instantiated in production -- the live singleton below has always
# pointed at the real, honest `cookie_atomic_engine`. Removed as part of
# the honesty/coherence pass so no fabricated-data code path remains in
# the repo, live or not.

# Singleton Instance pointing to Cookie Atomic Engine (Mainnet Beta)
from app.cookie_atomic import cookie_atomic_engine
hyper_arb_vault = cookie_atomic_engine
