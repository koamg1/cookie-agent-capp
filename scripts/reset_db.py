import sqlite3

def clean():
    conn = sqlite3.connect('app/atomic_vault.db')
    cur = conn.cursor()
    cur.execute("DELETE FROM atomic_user_positions WHERE user_address='HSPEiMn8_auto_arb_tester_wallet'")
    cur.execute("DELETE FROM deposits_audit WHERE user_address='HSPEiMn8_auto_arb_tester_wallet'")
    cur.execute("UPDATE atomic_metadata SET value='1.0' WHERE key='share_price_nav'")
    cur.execute("UPDATE atomic_metadata SET value='0.0' WHERE key='total_shares'")
    cur.execute("UPDATE atomic_metadata SET value='0.0' WHERE key='total_cookie_deposited'")
    cur.execute("UPDATE atomic_metadata SET value='0.0' WHERE key='total_usdc_deposited'")
    conn.commit()
    conn.close()
    print("Database cleanly reset to base state with NAV 1.0000 and 0 shares.")

if __name__ == "__main__":
    clean()
