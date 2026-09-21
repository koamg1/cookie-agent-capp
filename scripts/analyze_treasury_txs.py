import httpx
import datetime

RPC_URL = "https://rpc.cookiescan.io"
TREASURY_WALLET = "EzXxVuzpaqeTunpaFTZMtmvENzij5BMoP4Lh8zZkfSjh"

res = httpx.post(RPC_URL, json={
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getSignaturesForAddress",
    "params": [TREASURY_WALLET, {"limit": 30}]
}, timeout=15).json()

sigs = res.get("result", [])
print(f"Total signatures retrieved for Treasury: {len(sigs)}")
for s in sigs:
    sig = s["signature"]
    slot = s["slot"]
    memo = s.get("memo", "")
    bt = s.get("blockTime")
    time_str = datetime.datetime.fromtimestamp(bt).strftime('%Y-%m-%d %H:%M:%S') if bt else "N/A"
    
    tx_res = httpx.post(RPC_URL, json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTransaction",
        "params": [sig, {"commitment": "confirmed", "maxSupportedTransactionVersion": 0}]
    }, timeout=15).json()
    
    meta = tx_res.get("result", {}).get("meta", {})
    keys = tx_res.get("result", {}).get("transaction", {}).get("message", {}).get("accountKeys", [])
    if TREASURY_WALLET in keys:
        idx = keys.index(TREASURY_WALLET)
        pre = meta.get("preBalances", [])[idx] / 1e9 if len(meta.get("preBalances", [])) > idx else 0
        post = meta.get("postBalances", [])[idx] / 1e9 if len(meta.get("postBalances", [])) > idx else 0
        diff = post - pre
        print(f"[{time_str}] Slot: {slot} | Diff: {diff:+.4f} COOKIE (Bal: {post:.4f}) | Memo: {memo} | Sig: {sig[:16]}...")
