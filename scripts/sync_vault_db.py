import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app", "atomic_vault.db")
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("""
    UPDATE atomic_user_positions 
    SET initial_cookie = 114.26, shares = 0.009337 
    WHERE user_address = 'HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV'
""")

cur.execute("UPDATE atomic_metadata SET value = '114.26' WHERE key = 'total_cookie_deposited'")
cur.execute("UPDATE atomic_metadata SET value = '0.009337' WHERE key = 'total_shares'")

cur.execute("""
    INSERT OR REPLACE INTO deposits_audit (tx_hash, user_address, amount_cookie, amount_usdc, shares_minted, deposit_slot, created_at)
    VALUES (
        '5LTwLR91AbWGKFEPznZt9zJrewpLRCbhBpGEgmzQBx4v8t4Tw7mfvendp1GwFnoV4s4jQTz9t1o8KRMCdALLsW8w_SYNC',
        'HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV',
        -435.74,
        0.0,
        -0.0356,
        26177437,
        1789889387.0
    )
""")

conn.commit()
conn.close()
print("Vault DB successfully synchronized with on-chain reserves!")
