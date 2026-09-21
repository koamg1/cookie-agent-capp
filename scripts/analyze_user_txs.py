import httpx
import datetime

RPC_URL = "https://rpc.cookiescan.io"
USER_WALLET = "HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV"

res = httpx.post(RPC_URL, json={
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getSignaturesForAddress",
    "params": [USER_WALLET, {"limit": 15}]
}, timeout=15).json()

sigs = res.get("result", [])
print(f"Total signatures retrieved: {len(sigs)}")
for s in sigs:
    sig = s["signature"]
    slot = s["slot"]
    memo = s.get("memo", "")
    bt = s.get("blockTime")
    time_str = datetime.datetime.fromtimestamp(bt).strftime('%Y-%m-%d %H:%M:%S') if bt else "N/A"
    
    # Get tx details
    tx_res = httpx.post(RPC_URL, json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTransaction",
        "params": [sig, {"commitment": "confirmed", "maxSupportedTransactionVersion": 0}]
    }, timeout=15).json()
    
    meta = tx_res.get("result", {}).get("meta", {})
    pre_user = None
    post_user = None
    keys = tx_res.get("result", {}).get("transaction", {}).get("message", {}).get("accountKeys", [])
    if USER_WALLET in keys:
        idx = keys.index(USER_WALLET)
        pre_user = meta.get("preBalances", [])[idx] / 1e9 if len(meta.get("preBalances", [])) > idx else 0
        post_user = meta.get("postBalances", [])[idx] / 1e9 if len(meta.get("postBalances", [])) > idx else 0
        diff = post_user - pre_user
        print(f"[{time_str}] Slot: {slot} | Diff: {diff:+.4f} COOKIE (Bal: {post_user:.4f}) | Memo: {memo}")
    else:
        print(f"[{time_str}] Slot: {slot} | Keys: {keys} | Memo: {memo}")
