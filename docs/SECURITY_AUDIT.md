# CookieAgent Gateway & Sentinel — Auditoría de Seguridad y Funcionamiento

Fecha: 2026-09-21
Alcance: backend FastAPI (`app/`), scripts de despacho (`scripts/`), frontend config, git.
Método: lectura estática completa de los módulos de dinero + suite de tests (43/43 en verde).
Estado del árbol: sin commitear.

> **Estado de remediación (leer antes que nada):** este documento es el hallazgo
> *original*, en presente, tal como se encontró. **C1 y C2 (críticos) están
> cerrados** desde entonces -- verificación real de depósitos on-chain, retiro en
> dos fases y un firmador aislado que impone política y nunca expone la llave de
> tesoro a la API pública. El detalle de cada fix, con qué commit/archivo lo cierra
> y qué queda pendiente (Fase 3 SIWS server-side, firmador multi-nodo), está en
> `docs/ROADMAP_HARDENING.md` bajo las secciones "Progreso". Este archivo se deja
> intacto como registro histórico del proceso de auditoría, no como el estado
> actual del código.

> Resumen ejecutivo: la contabilidad del vault (shares) está **desacoplada de la
> verificación on-chain** y el pago sale de una **keypair de tesoro real**. Hoy
> está desarmado (depósitos cerrados por flag, no existe el archivo de keypair),
> pero **abrir depósitos con el diseño actual permite drenar el tesoro completo a
> cualquier usuario anónimo**. Ese es el bloqueo #1 antes de aceptar capital de terceros.

---

## CRÍTICO

### C1 — Depósitos sin respaldo + pago desde tesoro real = drenaje remoto del tesoro
- `app/cookie_atomic.py:1008` `verify_and_credit_deposit` — el docstring promete
  "Validates cryptographic deposit transaction against Cookie Chain SVM RPC" y
  `RPC_PULL_FINALIZED_ZERO_TRUST`, pero **no hace ninguna llamada RPC**. Solo valida
  `len(tx_hash) >= 8` y unicidad en `deposits_audit`, y luego acredita el
  `amount_cookie`/`amount_usdc` que **envía el cliente**.
- `app/cookie_atomic.py:744` `deposit` — acuña shares a partir de montos del cliente
  con firma inventada; nunca confirma que llegó capital.
- `app/cookie_atomic.py:822` `withdraw` → `scripts/dispatch_treasury_payout.js` carga
  `config/treasury_vault_keypair.json` y **firma+envía $COOKIE nativo real** a la
  dirección y monto que controla quien llama.

Cadena de explotación (cuando `PUBLIC_DEPOSITS_ENABLED=true` y exista la keypair):
1. `POST /api/v1/atomic/verify-deposit` con `tx_hash:"AAAAAAAA"`, `amount_cookie: 100000000` → shares acreditadas sin verificación.
2. `POST /api/v1/atomic/withdraw` con `bypass_cooldown:true` → el tesoro firma y paga COOKIE real (menos 20%).
3. Repetir hasta vaciar el balance on-chain del tesoro.

Mitigación actual (frágil): `_guard_deposits()` devuelve 503 salvo con el flag activo, y
no existe `config/` con la keypair. **El único candado es el flag de depósitos.** El
propósito del vault es justamente abrirlo, así que el diseño no es seguro de abrir tal cual.

Fix: la única frontera de confianza válida es la cadena. `verify_and_credit_deposit`
debe hacer `getTransaction`, confirmar `err == None`, y **derivar el monto y el destino
del propio tx** (delta de lamports hacia la dirección del vault), exactamente como ya
hace `cookie_client.reconcile_user_burns`. Nunca acreditar montos que manda el cliente.

### C2 — Inflación de NAV pública y sin autenticar
- `app/cookie_atomic.py:1326` `execute_atomic_cycle` inventa `gross_profit` con
  `random.uniform(...)` y sube `share_price_nav` monotónicamente.
- Expuesto sin auth ni guard en `POST /api/v1/vault/trigger-arb` y `POST /api/v1/atomic/trigger`.
- `withdraw` paga `shares × NAV` desde el tesoro real → **bombear el endpoint infla el
  pago real**. Con cualquier posición (propia o creada vía C1) es un amplificador de drenaje.

Fix: quitar la mutación de estado/NAV de cualquier endpoint público; el NAV solo debe
moverse por ganancias on-chain verificadas (que hoy no existen — el motor está en standby).

---

## ALTO

### H1 — No hay autenticación del lado servidor en ningún endpoint
SIWS es puramente cliente (sessionStorage). Todos los endpoints confían en el
`user_address` del body. Cualquiera puede actuar como cualquier dirección: contaminar
karma/posición ajena, disparar pagos, etc. Se necesita verificación de firma SIWS en el
servidor (nonce + firma ed25519) para toda ruta que credite o mueva valor a una dirección.

### H2 — `/burn/record` no valida monto ni destino de la quema
`app/main.py` (`record_burn_event`) solo comprueba que la firma exista on-chain y
`meta.err is None`; acredita como quema **verificada** el `amount_cookie` del cliente.
Con cualquier firma de una tx mainnet exitosa (propia o copiada del explorer) + monto
arbitrario se falsifica el leaderboard de Baker Karma y el tier de airdrop, contradiciendo
el claim "100% cryptographically auditable". La ruta honesta ya existe
(`cookie_client.reconcile_user_burns`): enrutar `/burn/record` por esa misma lógica
(o eliminar el endpoint y quedarse solo con `/burn/sync`).

### H3 — Pérdida silenciosa de shares si falla el despacho de pago
En `_withdraw_internal` las shares se queman y se commitea la DB **antes** de correr el
subprocess de pago. Si `node`/dispatch falla (falta keypair, error RPC, dirección
inválida), la excepción se traga (`logger.warning`) y la API devuelve `status:"confirmed"`
con firma inventada. El usuario pierde shares, no recibe nada y se le dice que fue exitoso.
Fix: patrón dos fases — pagar primero, y solo debitar shares tras confirmación real del tx.

### H4 — `bypass_cooldown` lo controla el cliente
El "cooldown anti-MEV de 24h" se saltea enviando `bypass_cooldown:true` por un 20% plano.
No es un control anti-MEV real. El cooldown debe derivarse de estado del servidor, no de un
booleano del request.

---

## MEDIO

### M1 — `config/` y `*keypair*.json` NO están en `.gitignore`
Crear la keypair del tesoro en la ruta por defecto y hacer push público **expone la clave
privada** → robo directo del tesoro sin necesidad de la app. Añadir a `.gitignore`
**antes** de crear la llave o publicar el repo:
```
config/
*keypair*.json
*.key
secrets/
```

### M2 — Rate limiter por `req.client.host` detrás del túnel
Detrás del túnel Cloudflare / reverse proxy todas las peticiones comparten una IP → un
único bucket global de 60/min estrangula a todos juntos (e ignora `X-Forwarded-For`).
Además `_rate_buckets` crece sin límite (fuga de memoria). Usar `X-Forwarded-For` de forma
confiable y purgar buckets viejos.

### M3 — Datos "live/real" que son fabricados (riesgo reputacional para el bounty)
- `cookie_client.get_arbitrage_quotes` devuelve oportunidades hardcodeadas bajo
  `/opportunities/radar` ("real-time spreads detected").
- `cookie_client.get_burn_metrics` suma un baseline fijo `142580.45` + `burn_rate_24h` fijo.
- `execute_atomic_cycle` guarda ejecuciones inventadas con `status:"CONFIRMED_ON_CHAIN"` en el feed.
- `get_proof_of_reserves` siempre devuelve `reserve_audit:"PASSED"` y, si el RPC falla,
  usa el pasivo como si fuera reserva (solvencia falsa 1.0).
- `shoot_and_revert.js` solo hace `simulateTransaction` pero se describe como "shot real a Mainnet".
Para un jurado que evalúa legitimidad, etiquetar como simulación o retirar estos claims.

### M4 — `logger` indefinido en `main.py`
`hyper_arb_background_worker` llama `logger.warning` ante excepción, pero `main.py` nunca
define/importa `logger` → `NameError` que mata la tarea heartbeat al primer error de RPC y
oculta el error original. Añadir `import logging; logger = logging.getLogger("main")`.

### M5 — El proxy RPC es un relay de escritura abierto
`ALLOWED_PROXY_METHODS` incluye `sendTransaction`/`simulateTransaction` (el docstring dice
"read-only"). Cualquiera puede transmitir txs firmadas arbitrarias a mainnet-beta / Cookie
Chain por el gateway (con rate limit, pero es relay gratis). Separar métodos de lectura de
los de escritura, o exigir origen permitido para escritura.

---

## BAJO

- **L1** CORS default `"*"` si `CORS_ALLOW_ORIGINS` no está seteado (credenciales
  desactivadas, aceptable, pero fijar el dominio en prod).
- **L2** IDs por `hash()% 100000 + int(time.time())` (burn_tracker, atomic) pueden
  colisionar bajo `INSERT OR REPLACE` (PK) → sobrescritura silenciosa rara. Usar `uuid4`.
- **L3** Código muerto: toda la clase `HyperArbVault` (`hyper_arb_vault.py`) queda anulada
  por `hyper_arb_vault = cookie_atomic_engine`; sus baselines falsos (285k TVL, karma por
  hash) no se usan pero confunden. Eliminar para evitar recablearlos por error.
- **L4** `.env.example` omite variables sensibles: `PUBLIC_DEPOSITS_ENABLED`,
  `CORS_ALLOW_ORIGINS`, `TREASURY_KEYPAIR_PATH`, `RPC_PROXY_RATE_LIMIT`, `ATOMIC_VAULT_DB_PATH`.
- **L5** Cobertura: 43/43 pasan pero ningún test verifica que se rechace un tx de depósito
  falso/inexistente, la ruta de fallo del despacho de tesoro, ni auth. Validan la
  contabilidad (defectuosa), no las invariantes de seguridad.

---

## Lo que está BIEN (para no romperlo)

- Offset virtual estilo OpenZeppelin anti first-depositor en el depósito atómico.
- `reconcile_user_burns` verifica de verdad (destino incinerador + delta real de lamports).
- Totales y leaderboard cuentan solo `verified=1`; umbral de polvo (1.0 COOK) anti-Sybil.
- El guard de depósitos arranca cerrado; retiros abiertos por diseño (cerrarlos atraparía fondos) es correcto.
- No hay llaves privadas en el código Python; no hay secretos ni `.db` commiteados; `.env` y `*.db` en `.gitignore`.
- `get_user_position` y el `get_baker_karma` real son honestos (yield 0, karma desde burns verificados).
- CORS con credenciales desactivadas (evita el footgun wildcard+credentials).

---

## Prioridad de remediación antes de someter / abrir el vault

1. **M1** (gitignore de la keypair) — inmediato, antes de cualquier push público.
2. **C1 + C2 + H1** — no abrir `PUBLIC_DEPOSITS_ENABLED` hasta verificar depósitos on-chain
   y quitar la mutación de NAV de endpoints públicos. Con depósitos cerrados el riesgo es latente.
3. **H2/H3** — cerrar el hueco de `/burn/record` y arreglar el orden pagar-antes-de-debitar.
4. **M3** — retirar/etiquetar los claims de datos "reales" fabricados (legitimidad del bounty).
5. **M4/M2/M5/L*** — correcciones de robustez.
