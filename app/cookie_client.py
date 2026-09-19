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
        """Obtiene el último slot procesado en Cookie Chain."""
        return await self.rpc_call("getSlot", [{"commitment": "confirmed"}])

    async def get_block_height(self) -> Dict[str, Any]:
        """Obtiene la altura del bloque en Cookie Chain."""
        return await self.rpc_call("getBlockHeight", [{"commitment": "confirmed"}])

    async def get_health(self) -> Dict[str, Any]:
        """Verifica la salud del nodo RPC de Cookie Chain."""
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
        """Consulta el saldo en lamports/tokens de una cuenta en Cookie Chain."""
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
        """Obtiene el blockhash reciente para autorizar transacciones."""
        return await self.rpc_call("getLatestBlockhash", [{"commitment": "confirmed"}])

    async def get_epoch_info(self) -> Dict[str, Any]:
        """Obtiene información de la época actual, slots por época y conteo de transacciones históricas."""
        return await self.rpc_call("getEpochInfo", [{"commitment": "confirmed"}])

    async def get_performance_samples(self, limit: int = 4) -> Dict[str, Any]:
        """Obtiene muestras de rendimiento de los validadores para calcular TPS y velocidad de bloque."""
        return await self.rpc_call("getRecentPerformanceSamples", [limit])

    async def get_recent_memos(self, limit: int = 10) -> Dict[str, Any]:
        """Consulta los últimos memorandos SPL confirmados en el programa canónico de Cookie Chain."""
        memo_program = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        return await self.rpc_call("getSignaturesForAddress", [memo_program, {"limit": limit}])

