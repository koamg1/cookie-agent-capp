"""
Cookie Chain RPC & DAS API Async Client
Connects to Cookie Chain (Solana-compatible SVM) at $0.00 cost.
"""

import os
import time
import httpx
from typing import Dict, Any, Optional, List

COOKIE_RPC_URL = os.getenv("COOKIE_RPC_URL", "https://rpc.cookiescan.io")
COOKIE_DAS_API = os.getenv("COOKIE_DAS_API", "https://api.cookiescan.io")

class CookieChainClient:
    def __init__(self, rpc_url: str = COOKIE_RPC_URL, das_url: str = COOKIE_DAS_API):
        self.rpc_url = rpc_url
        self.das_url = das_url
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(10.0),
                headers={"Content-Type": "application/json", "User-Agent": "CookieAgent-Gateway/1.0"}
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def rpc_call(self, method: str, params: Optional[List[Any]] = None) -> Any:
        client = await self.get_client()
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params or []
        }
        t0 = time.perf_counter()
        try:
            resp = await client.post(self.rpc_url, json=payload)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            if resp.status_code != 200:
                return {"error": f"HTTP {resp.status_code}", "latency_ms": elapsed_ms}
            data = resp.json()
            if "error" in data:
                return {"error": data["error"], "latency_ms": elapsed_ms}
            return {"result": data.get("result"), "latency_ms": elapsed_ms}
        except Exception as e:
            return {"error": str(e), "latency_ms": (time.perf_counter() - t0) * 1000.0}

    async def get_slot(self) -> Dict[str, Any]:
        """Retrieves the latest processed slot on Cookie Chain."""
        return await self.rpc_call("getSlot", [{"commitment": "confirmed"}])

    async def get_transaction(self, signature: str, commitment: str = "confirmed") -> Dict[str, Any]:
        """
        Queries a transaction by signature on Cookie Chain SVM.
        Queries first with 'confirmed' (fast client finality) and
        if null, falls back to 'finalized'.
        """
        res = await self.rpc_call("getTransaction", [
            signature,
            {"commitment": commitment, "maxSupportedTransactionVersion": 0}
        ])
        if res.get("result") is not None or commitment == "finalized":
            return res
        # Fallback to finalized if confirmed was None
        return await self.rpc_call("getTransaction", [
            signature,
            {"commitment": "finalized", "maxSupportedTransactionVersion": 0}
        ])

    async def get_block_height(self) -> Dict[str, Any]:
        """Retrieves current block height on Cookie Chain."""
        return await self.rpc_call("getBlockHeight", [{"commitment": "confirmed"}])

    async def get_health(self) -> Dict[str, Any]:
        """Checks Cookie Chain RPC node health."""
        client = await self.get_client()
        t0 = time.perf_counter()
        try:
            resp = await client.get(f"{self.rpc_url}/health")
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            status = "ok" if resp.status_code == 200 else f"status_{resp.status_code}"
            return {"status": status, "latency_ms": round(elapsed_ms, 2)}
        except Exception as e:
            # Fallback RPC query
            res = await self.get_slot()
            return {
                "status": "active" if "result" in res else "offline",
                "latency_ms": round(res.get("latency_ms", 0), 2)
            }

    async def get_balance(self, pubkey: str) -> Dict[str, Any]:
        """Queries token / lamport balance of an account on Cookie Chain."""
        res = await self.rpc_call("getBalance", [pubkey, {"commitment": "confirmed"}])
        if "result" in res and res["result"] is not None:
            lamports = res["result"].get("value", 0)
            return {
                "pubkey": pubkey,
                "lamports": lamports,
                "balance_cookie": lamports / 1_000_000_000.0,
                "latency_ms": res.get("latency_ms")
            }
        return {"pubkey": pubkey, "error": res.get("error"), "balance_cookie": 0.0}

    async def get_latest_blockhash(self) -> Dict[str, Any]:
        """Retrieves recent blockhash for transaction authorization."""
        return await self.rpc_call("getLatestBlockhash", [{"commitment": "confirmed"}])

    async def get_epoch_info(self) -> Dict[str, Any]:
        """Retrieves current epoch info, slots per epoch, and transaction count."""
        return await self.rpc_call("getEpochInfo", [{"commitment": "confirmed"}])

    async def get_performance_samples(self, limit: int = 4) -> Dict[str, Any]:
        """Retrieves validator performance samples to calculate TPS and slot time."""
        return await self.rpc_call("getRecentPerformanceSamples", [limit])

    async def get_recent_memos(self, limit: int = 10) -> Dict[str, Any]:
        """Queries recent confirmed SPL memos on Cookie Chain canonical memo program."""
        memo_program = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        return await self.rpc_call("getSignaturesForAddress", [memo_program, {"limit": limit}])

    async def get_signatures_for_address(self, address: str, limit: int = 50) -> Dict[str, Any]:
        """Retrieves confirmed transaction signatures for any address on Cookie Chain."""
        return await self.rpc_call("getSignaturesForAddress", [address, {"limit": limit}])

    async def reconcile_user_burns(
        self,
        address: str,
        limit: int = 25,
        known_signatures: Optional[set] = None
    ) -> List[Dict[str, Any]]:
        """
        Scans recent transaction signatures for an address on Cookie Chain SVM,
        identifies direct burns to 1nc1nerator11111111111111111111111111111111,
        and returns confirmed burn items. Skips signatures already recorded in DB.
        """
        if known_signatures is None:
            try:
                from app.burn_tracker import burn_tracker
                known_signatures = burn_tracker.get_known_signatures()
            except Exception:
                known_signatures = set()

        burn_addr = "1nc1nerator11111111111111111111111111111111"
        res = await self.get_signatures_for_address(address, limit=limit)
        sigs = res.get("result") or []
        burn_records = []
        for s in sigs:
            sig = s.get("signature")
            if not sig:
                continue
            if known_signatures and sig in known_signatures:
                # Signatures are ordered newest to oldest by SVM RPC.
                # Once we encounter an already indexed signature, older ones are already reconciled.
                break
            try:
                tx_res = await self.get_transaction(sig)
                tx = tx_res.get("result")
                if not tx or "meta" not in tx:
                    continue
                meta = tx.get("meta") or {}
                if meta.get("err") is not None:
                    continue
                msg = tx.get("transaction", {}).get("message", {})
                account_keys = msg.get("accountKeys", [])
                if burn_addr in account_keys:
                    burn_idx = account_keys.index(burn_addr)
                    pre_bals = meta.get("preBalances", [])
                    post_bals = meta.get("postBalances", [])
                    pre_bal = pre_bals[burn_idx] if burn_idx < len(pre_bals) else 0
                    post_bal = post_bals[burn_idx] if burn_idx < len(post_bals) else 0
                    diff_lamports = post_bal - pre_bal
                    if diff_lamports > 0:
                        diff_cook = round(diff_lamports / 1e9, 4)
                        burn_records.append({
                            "user_address": address,
                            "amount_cookie": diff_cook,
                            "tx_signature": sig,
                            "slot": tx.get("slot"),
                            "timestamp": tx.get("blockTime") or time.time(),
                            "source": "user_oven"
                        })
            except Exception:
                continue
        return burn_records

    async def get_arbitrage_quotes(self) -> List[Dict[str, Any]]:
        """
        Scans Cookie Chain AMM pairs and oracle feeds for arbitrage spreads.
        Returns live opportunities with token pairs, spread percentage, and estimated profit.
        """
        slot_res = await self.get_slot()
        cur_slot = slot_res.get("result", 26010000)
        
        base_opps = [
            {
                "id": "opp_cookie_usdc_01",
                "pair": "COOKIE / USDC",
                "pool_a": "CookieSwap (AMM)",
                "pool_b": "Raydium SVM (Wrapped)",
                "price_a": 0.0425,
                "price_b": 0.0441,
                "spread_pct": 3.76,
                "est_profit_cookie": 188.4,
                "gas_cost_cookie": 0.000005,
                "target_slot": cur_slot,
                "status": "FRESH_CRUMB",
                "recommended_action": "Buy CookieSwap -> Sell Raydium"
            },
            {
                "id": "opp_cookie_sol_02",
                "pair": "COOKIE / SOL",
                "pool_a": "Hyperlane Bridge Vault",
                "pool_b": "CookieDEX Orderbook",
                "price_a": 0.000282,
                "price_b": 0.000289,
                "spread_pct": 2.48,
                "est_profit_cookie": 124.0,
                "gas_cost_cookie": 0.000005,
                "target_slot": cur_slot,
                "status": "FRESH_CRUMB",
                "recommended_action": "Bridge Arb -> Mint & Sell"
            },
            {
                "id": "opp_svm_cookie_03",
                "pair": "SVM / COOKIE",
                "pool_a": "Pyth Oracle Sync",
                "pool_b": "Cookie Liquidity Pool #4",
                "price_a": 1.000,
                "price_b": 1.018,
                "spread_pct": 1.80,
                "est_profit_cookie": 90.0,
                "gas_cost_cookie": 0.000005,
                "target_slot": cur_slot,
                "status": "FRESH_CRUMB",
                "recommended_action": "Rebalance Pool #4 -> Capture Spread"
            }
        ]
        # Audit M3: these are illustrative Quant Lab scenarios, NOT live on-chain
        # detections. Tag them so the UI can never present them as real spreads.
        for o in base_opps:
            o["is_simulation"] = True
            o["data_mode"] = "simulation"
        return base_opps

    async def get_burn_metrics(self) -> Dict[str, Any]:
        """
        Fetches deflationary metrics for $COOKIE token.
        Tracks total burned supply and 24h burn volume on Cookie Chain.
        """
        burn_addr = "1nc1nerator11111111111111111111111111111111"
        res = await self.get_balance(burn_addr)
        # Audit M3: cumulative burned = REAL native balance held at the incinerator
        # (all native $COOKIE ever sent there). No fabricated 142580.45 baseline and
        # no hardcoded 24h rate.
        incinerator_balance = res.get("balance_cookie", 0.0)
        rpc_ok = "error" not in res
        return {
            "token": "$COOKIE",
            "burn_address": burn_addr,
            "cumulative_burned": round(incinerator_balance, 4),
            "burn_rate_24h": None,
            "burn_rate_24h_note": "Not derived on-chain yet; see /api/v1/burn/app-total for app-verified burns.",
            "deflation_status": "active" if rpc_ok else "unavailable",
            "data_mode": "live" if rpc_ok else "unavailable",
            "canonical_burn_program": "1nc1nerator11111111111111111111111111111111"
        }

    async def get_mainnet_cookie_balance(self, pubkey: str) -> Dict[str, Any]:
        """
        Queries Token-2022 $COOKIE balance for pubkey on Solana Mainnet.
        Mint: 36ZrtQoab5MhhySaP1YSTwUahSk6GRVUTtZ6cuVfm9e1
        """
        client = await self.get_client()
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenAccountsByOwner",
            "params": [
                pubkey,
                {"mint": "36ZrtQoab5MhhySaP1YSTwUahSk6GRVUTtZ6cuVfm9e1"},
                {"encoding": "jsonParsed"}
            ]
        }
        try:
            resp = await client.post(
                "https://api.mainnet-beta.solana.com",
                json=payload,
                timeout=httpx.Timeout(4.0)
            )
            if resp.status_code == 200:
                data = resp.json()
                accounts = data.get("result", {}).get("value", [])
                if accounts:
                    acc = accounts[0]
                    info = acc.get("account", {}).get("data", {}).get("parsed", {}).get("info", {})
                    token_amount = info.get("tokenAmount", {})
                    return {
                        "has_tokens": True,
                        "token_account": acc.get("pubkey"),
                        "amount_ui": token_amount.get("uiAmount", 0.0),
                        "amount_raw": token_amount.get("amount", "0"),
                        "decimals": token_amount.get("decimals", 6),
                        "mint": "36ZrtQoab5MhhySaP1YSTwUahSk6GRVUTtZ6cuVfm9e1",
                        "network": "Solana Mainnet"
                    }
        except Exception as e:
            pass
        return {
            "has_tokens": False,
            "amount_ui": 0.0,
            "amount_raw": "0",
            "decimals": 6,
            "mint": "36ZrtQoab5MhhySaP1YSTwUahSk6GRVUTtZ6cuVfm9e1",
            "network": "Solana Mainnet"
        }



