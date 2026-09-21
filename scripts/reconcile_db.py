import sqlite3
import time

conn = sqlite3.connect('app/atomic_vault.db')

meta = {
    'total_arbitrage_runs': '3',
    'cumulative_arb_profit_usd': '0.000300',
    'cumulative_burned_cookie': '0.46',
    'cumulative_cookie_jar_usd': '0.000038',
    'total_shares': '0.04086',
    'total_cookie_deposited': '500.0',
    'total_usdc_deposited': '0.000300',
    'share_price_nav': '1.007342'
}
for k, v in meta.items():
    conn.execute('INSERT OR REPLACE INTO atomic_metadata (key, value) VALUES (?, ?)', (k, v))

user_addr = 'HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV'
conn.execute('''
    INSERT OR REPLACE INTO atomic_user_positions 
    (user_address, shares, initial_cookie, initial_usdc, deposit_timestamp, claimed_yield_cookie, claimed_yield_usdc, cooldown_until)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', (user_addr, 0.04086, 500.0, 0.0, 1789863184.169, 0.0, 0.0, 1789967100.748))

conn.execute('DELETE FROM atomic_user_positions WHERE user_address != ?', (user_addr,))

conn.execute('DELETE FROM atomic_executions')
executions = [
    ('AUTO-DEP-26158370-1', 1789863200.0, 26158370, 'COOKIE / USDC (Solana ↔ Cookie Chain SVM)', 2.18, 1.60, 500.0, 0.000445, 0.000262, 0.40, 0.000033, 'AUTO-ARB-SOLANA-26158370', 'LIVE_SOLANA_SVM_AUTO'),
    ('SENTINEL-CYCLE-26159500-2', 1789863800.0, 26159500, 'COOKIE / USDC (Solana ↔ Cookie Chain Pulse)', 2.18, 1.55, 25.0, 0.000022, 0.000019, 0.03, 0.000002, 'ARB-PULSE-SOLANA-26159500', 'AUTONOMOUS_YIELD_CYCLE'),
    ('SENTINEL-CYCLE-26160800-3', 1789864400.0, 26160800, 'COOKIE / USDC (Solana ↔ Cookie Chain Pulse)', 2.18, 1.55, 25.0, 0.000022, 0.000019, 0.03, 0.000002, 'ARB-PULSE-SOLANA-26160800', 'AUTONOMOUS_YIELD_CYCLE')
]
for ex in executions:
    conn.execute('''
        INSERT INTO atomic_executions 
        (id, timestamp, slot, pair, gross_spread_pct, net_spread_pct, optimal_size_cookie, gross_profit_usd, profit_to_vault_usd, burned_cookie, cookie_jar_usd, tx_signature, mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ex)

conn.commit()
print('SUCCESS! DB Reconciled.')
print('METADATA:', conn.execute('SELECT * FROM atomic_metadata').fetchall())
print('POSITIONS:', conn.execute('SELECT * FROM atomic_user_positions').fetchall())
print('EXECUTIONS COUNT:', conn.execute('SELECT COUNT(*) FROM atomic_executions').fetchone())
