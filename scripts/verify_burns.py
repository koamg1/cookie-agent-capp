"""
Re-verifica contra Cookie Chain SVM todas las quemas guardadas en app_burns.db.

Para cada registro consulta getTransaction con la firma almacenada:
  - existe y meta.err es null  -> verified = 1 (y guarda el slot real on-chain)
  - no existe, fallo, o la firma no es base58 valida -> verified = 0

Solo las verified = 1 cuentan en el total publico de la cApp.

Uso (desde cookie_agent_capp/):
    python scripts/verify_burns.py
    python scripts/verify_burns.py --dry-run
"""
import argparse
import json
import os
import sqlite3
import sys
import urllib.request

RPC_URL = os.getenv("COOKIE_RPC_URL", "https://rpc.cookiescan.io")
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "app_burns.db")
BASE58 = set("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")


def plausible(sig):
    return bool(sig) and 86 <= len(sig) <= 90 and all(c in BASE58 for c in sig)


def fetch_tx(sig, timeout=20):
    payload = json.dumps({
        "jsonrpc": "2.0", "id": 1, "method": "getTransaction",
        "params": [sig, {"commitment": "finalized", "maxSupportedTransactionVersion": 0}],
    }).encode()
    req = urllib.request.Request(RPC_URL, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="No escribe; solo informa.")
    args = ap.parse_args()

    conn = sqlite3.connect(os.path.abspath(DB_PATH))
    conn.row_factory = sqlite3.Row

    cols = [r[1] for r in conn.execute("PRAGMA table_info(app_burn_records)").fetchall()]
    if "verified" not in cols:
        conn.execute("ALTER TABLE app_burn_records ADD COLUMN verified INTEGER NOT NULL DEFAULT 0")
        conn.commit()
        print("[migracion] columna 'verified' anadida")

    rows = conn.execute("SELECT id, tx_signature, amount_cookie, source FROM app_burn_records").fetchall()
    print("Revisando %d registros contra %s\n" % (len(rows), RPC_URL))

    ok = bad = 0
    ok_amt = bad_amt = 0.0

    for r in rows:
        sig = r["tx_signature"]
        amt = float(r["amount_cookie"])
        slot = None

        if not plausible(sig):
            good, why = False, "firma no es base58 SVM"
        else:
            try:
                res = fetch_tx(sig).get("result")
                if res is None:
                    good, why = False, "no existe on-chain"
                elif (res.get("meta") or {}).get("err") is not None:
                    good, why = False, "transaccion fallida on-chain"
                else:
                    good, why, slot = True, "confirmada", res.get("slot")
            except Exception as e:
                print("  ! %s  error de red: %s (se deja sin verificar)" % (sig[:16], e))
                good, why = False, "error de red"

        if good:
            ok += 1; ok_amt += amt
        else:
            bad += 1; bad_amt += amt

        print("  %s %-10s %10.2f COOK  %s" % ("OK " if good else "NO ", r["source"], amt, why))

        if not args.dry_run:
            if slot is not None:
                conn.execute("UPDATE app_burn_records SET verified=?, slot=? WHERE id=?", (1 if good else 0, slot, r["id"]))
            else:
                conn.execute("UPDATE app_burn_records SET verified=? WHERE id=?", (1 if good else 0, r["id"]))

    if not args.dry_run:
        conn.commit()

    print("\n" + "=" * 58)
    print("VERIFICADAS    : %3d registros  %10.2f COOK  <- total publico" % (ok, ok_amt))
    print("NO VERIFICADAS : %3d registros  %10.2f COOK  (excluidas)" % (bad, bad_amt))
    print("=" * 58)
    if args.dry_run:
        print("(dry-run: no se escribio nada)")
    conn.close()


if __name__ == "__main__":
    sys.exit(main())
