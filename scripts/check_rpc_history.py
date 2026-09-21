import httpx
import json

RPC_URL = "https://rpc.cookiescan.io"
USER_WALLET = "HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV"
TREASURY_WALLET = "EzXxVuzpaqeTunpaFTZMtmvENzij5BMoP4Lh8zZkfSjh"

def call_rpc(method, params):
    res = httpx.post(RPC_URL, json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }, timeout=15)
    return res.json()

def check_balances_and_txs():
    print("=== Checking RPC Balances and Transactions ===")
    
    # User balance
    u_bal = call_rpc("getBalance", [USER_WALLET, {"commitment": "confirmed"}])
    u_cookie = u_bal.get("result", {}).get("value", 0) / 1e9
    print(f"User Balance ({USER_WALLET}): {u_cookie} COOKIE")
    
    # Treasury balance
    t_bal = call_rpc("getBalance", [TREASURY_WALLET, {"commitment": "confirmed"}])
    t_cookie = t_bal.get("result", {}).get("value", 0) / 1e9
    print(f"Treasury Balance ({TREASURY_WALLET}): {t_cookie} COOKIE")
    
    # Recent signatures for user wallet
    sigs = call_rpc("getSignaturesForAddress", [USER_WALLET, {"limit": 10}])
    print("\nRecent Signatures for User Wallet:")
    for s in sigs.get("result", []):
        print(f"Signature: {s.get('signature')} | Slot: {s.get('slot')} | Err: {s.get('err')} | Memo: {s.get('memo')}")
        
    # Recent signatures for treasury
    t_sigs = call_rpc("getSignaturesForAddress", [TREASURY_WALLET, {"limit": 10}])
    print("\nRecent Signatures for Treasury Wallet:")
    for s in t_sigs.get("result", []):
        print(f"Signature: {s.get('signature')} | Slot: {s.get('slot')} | Err: {s.get('err')} | Memo: {s.get('memo')}")

if __name__ == "__main__":
    check_balances_and_txs()
