# Hoja de ruta — Telemetría real y "el banco" bien terminado

Regla rectora: **un campo o es real (con fuente on-chain / DB verificable) o es 0 / "standby" / "n/a".
Nunca un número inventado.** Cada métrica lleva un flag `honest_source`.

---

## Fase 0 — Bloqueos (horas). Hacer YA, con depósitos cerrados.
- `.gitignore`: añadir `config/`, `*keypair*.json`, `*.key`, `secrets/` antes de cualquier push.
- Quitar la mutación de estado/NAV de endpoints públicos: `/vault/trigger-arb`, `/atomic/trigger`
  no deben poder mover el NAV. En standby devuelven estado, no ejecutan ciclos.
- `main.py`: definir `logger` (`import logging; logger = logging.getLogger("main")`).
- Mantener `PUBLIC_DEPOSITS_ENABLED=false` hasta terminar Fase 2 y 3.

## Fase 1 — Pasada de verdad sobre la telemetría
Inventario de cada campo que muestra la UI, etiquetado REAL vs FABRICADO.

REAL (ya salen de RPC/DB, conservar):
- Network stats: slot, block height, epoch, TPS, rent-exempt mínimo.
- Balances de wallet (Cookie Chain + mint mainnet), burns vía `reconcile_user_burns`.
- Conteo de tools MCP, precio cross-chain DexScreener, latencia RPC.

FABRICADO (corregir a real o a cero honesto):
- Radar de arbitraje (`get_arbitrage_quotes` hardcodeado) → o pool discovery real, o lista vacía + "sin oportunidades: liquidez insuficiente".
- `get_burn_metrics`: quitar baseline `142580.45` y `burn_rate_24h` fijo → derivar del balance real del incinerador y de la DB de burns verificados.
- `execute_atomic_cycle` (feed `CONFIRMED_ON_CHAIN` con `random`): en standby no produce registros; el feed muestra solo ejecuciones reales (hoy: ninguna).
- `get_proof_of_reserves`: nunca "PASSED" fijo; si el RPC falla → `unavailable`, no usar el pasivo como reserva.
- `shoot_and_revert`: renombrar/etiquetar como "simulateTransaction sonda", no "shot real a Mainnet".

Entregable: cada respuesta JSON con `data_mode: "live" | "standby" | "unavailable"` coherente.

## Fase 2 — "El banco" bien hecho (sin DEX vivo)
Trabajo legítimo del vault hoy = **custodia + prueba de reservas + contabilidad honesta. Cero yield.**
- **NAV fijo en 1.0000** hasta que exista ganancia real de un swap on-chain verificado. Sin crecimiento monotónico.
- **Depósitos con verificación real** (`verify_and_credit_deposit`): `getTransaction` → `err==None` →
  confirmar que el destino es la dirección de depósito del vault → **derivar el monto del delta de
  lamports del propio tx** → dedupe por `tx_hash`. Acreditar solo lo que llegó. Reusar la lógica
  de `reconcile_user_burns`.
- **Retiros en dos fases**: pagar primero (dispatch), confirmar el tx on-chain, y **solo entonces**
  debitar shares. Validar que el destinatario sea base58 válido y el dueño de la posición.
- **El "multisig" 3 billeteras**: hoy el pago sale de UNA keypair caliente = cosmético. Decidir:
  (a) implementar de verdad 3-de-3 (Squads u otro programa multisig) como único camino de salida, o
  (b) ser explícito en la UI de que es un tesoro de operador único. No dejarlo ambiguo.
- **Proof-of-Reserves real**: balances RPC de las 3 direcciones; solvencia = activos reales /
  (shares × NAV). Si RPC cae → `unavailable`.

## Fase 3 — Autenticación del lado servidor (SIWS real)
- Endpoint de nonce → el cliente firma → el servidor verifica la firma ed25519 contra la
  `user_address` → emite token de sesión corto.
- Exigirlo en TODA ruta que acredite o mueva valor (burn/record, deposit, verify-deposit, withdraw,
  karma que credite). Sin esto, el `user_address` del body es falsificable por cualquiera.

## Fase 4 — Robustez
- Rate limiter: usar `X-Forwarded-For` de forma confiable detrás del túnel + purgar buckets viejos.
- Proxy RPC: separar métodos de lectura de escritura; escritura solo desde origen permitido.
- IDs con `uuid4` en lugar de `hash()%100000`.
- Eliminar la clase muerta `HyperArbVault` (anulada por `hyper_arb_vault = cookie_atomic_engine`).
- Completar `.env.example` con las vars sensibles.
- Tests de invariantes de seguridad: rechazo de tx de depósito falso, ruta de fallo del dispatch,
  auth requerida. (Hoy 43/43 validan contabilidad, no seguridad.)

## Fase 5 — Cuando exista un segundo DEX / liquidez real
- Reactivar el motor de arbitraje contra pools reales.
- NAV crece solo por ganancia de swaps verificados on-chain.
- Recién ahí `PUBLIC_DEPOSITS_ENABLED=true`.

---

## Qué someter al bounty AHORA (postura honesta y defendible)
Gateway de telemetría transparente + burns verificables on-chain + Baker Karma auditable +
Proof-of-Reserves real, con el vault **explícitamente en standby** ("el arbitraje se reactiva
cuando haya liquidez en un segundo DEX"). Eso es una submission legítima. Enviar yield fabricado
es lo único que puede descalificarla si un juez revisa el código.

Orden mínimo para someter: Fase 0 completa + Fase 1 (telemetría honesta) + poner el vault en
modo standby visible. Fases 2–5 son el camino a producción con capital real.

---

## Progreso — Fase 0 y Fase 1 aplicadas (2026-09-21)

Hecho (código editado, tests 43/43 en verde):
- **Fase 0.1** `.gitignore`: añadidos `config/`, `*keypair*.json`, `*.key`, `secrets/`.
- **Fase 0.2** `main.py`: `logger` definido (fin del `NameError` del heartbeat).
- **Fase 0.3** `cookie_atomic.execute_atomic_cycle`: en standby ya no usa `random`, no
  mueve NAV ni persiste nada. `/vault/trigger-arb` y `/atomic/trigger` devuelven
  `STANDBY_NO_LIQUIDITY` (fin de C2 por vía pública).
- **Fase 1** telemetría honesta:
  - `get_vault_info`: sin `ACTIVE_24_7` ni `38.4%` fabricados (usa standby / 0.00% real).
  - `get_burn_metrics`: sin baseline `142580.45` ni rate fijo; cumulative = balance real
    del incinerador; `data_mode`.
  - `get_arbitrage_quotes` + `/opportunities/radar`: etiquetados `is_simulation`/`data_mode`
    y disclaimer (dejan de presentarse como spreads live detectados).
  - `get_proof_of_reserves`: fallback ya no usa el pasivo como reserva; `reserve_audit`
    refleja la solvencia real; se quita la atestación ZK hardcodeada.
  - `/atomic/shoot-and-revert`: docstring corregido (es `simulateTransaction`, no un shot real).
  - Feed `atomic_executions` de ejecuciones fabricadas: limpiado.

Pendiente / decisión del dueño:
- **Reset de estado del vault atómico**: si quedan shares "fantasma" de depósitos de prueba
  (créditos nunca verificados on-chain), el PoR honesto puede mostrar
  `PARTIALLY_COLLATERALIZED`. Para un demo limpio con vault vacío en standby, hace falta
  resetear `atomic_user_positions` (decisión tuya: borra posiciones de prueba locales, no
  toca fondos on-chain).
- Fase 2–5 (verificación real de depósitos, retiro en dos fases, multisig real, SIWS
  server-side, robustez) siguen pendientes antes de abrir `PUBLIC_DEPOSITS_ENABLED`.

---

## Progreso — Fase 2 (parcial) + hallazgo sobre el multisig (2026-09-21)

Hecho (código, tests 44/44 en verde):
- **C1 cerrado — verificación real de depósitos.** `verify_and_credit_deposit` ahora,
  fuera de tests, exige que el tx exista on-chain, sea exitoso y sea una transferencia
  nativa de $COOKIE hacia la dirección de depósito del vault; el monto acreditado se
  **deriva del delta de balance on-chain**, nunca del cliente. Nuevo helper
  `_verify_native_deposit_onchain` (mismo patrón que `reconcile_user_burns`).
- **Rutas de depósito directo blindadas.** `/vault/deposit` y `/atomic/deposit` rechazan
  en producción y obligan a pasar por `/atomic/verify-deposit` (crédito solo con tx verificado).
- Nuevo test de invariante: el verificador rechaza un tx inexistente (no se pueden acuñar
  shares de la nada).

### Hallazgo bloqueante para el "camino B" (multisig real)
Verificado contra la cadena (rpc.cookiescan.io):
- Cookie Chain = fork de Solana (solana-core 4.1.2), genesis `9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2`.
- **Squads v4 NO está desplegado** en Cookie Chain.
- **$COOKIE es el token NATIVO** (lamports). Un balance nativo NO puede gobernarse con el
  multisig del SPL Token program (ese solo gobierna cuentas de token SPL).

Consecuencia: un 3-de-3 real sobre el tesoro real NO es posible hoy sin una de estas vías:
- **B1 — Desplegar un programa multisig** (Squads v4 o un programa Anchor propio) en Cookie
  Chain; el vault pasa a ser un PDA y el pago sale por CPI que exige 3 firmas. Real, pero:
  requiere autoridad/fondos para desplegar un programa en la cadena y compatibilidad BPF con
  core 4.1.2; y reescribe el retiro a **proponer → aprobar ×3 → ejecutar** (adiós retiro instantáneo).
- **B2 — Envolver $COOKIE como token SPL:** si existe un mint SPL de COOKIE en Cookie Chain,
  el tesoro se guarda en una token account cuya autoridad es una cuenta multisig del SPL Token
  program (3-de-3, hasta 11 firmantes) — multisig real usando solo el SPL Token program (que
  SÍ está presente). Falta confirmar que exista ese mint SPL en Cookie Chain (vs. nativo).
- **A (fallback honesto)** — tesoro de operador único, etiquetado con la verdad, + el
  endurecimiento (verificación de depósitos ya hecha; retiro en dos fases pendiente). Se puede
  someter ya; el multisig queda como hito futuro.

Decisiones que necesito antes de escribir el flujo de retiro (se construye una sola vez):
1. ¿Puedes/pueden desplegar un programa en Cookie Chain? (habilita B1)
2. ¿Existe COOKIE como mint SPL en Cookie Chain, o solo nativo? (habilita B2)
3. ¿Aceptas que el retiro deje de ser instantáneo (proponer → 3 aprobaciones → ejecutar)?
   Un 3-de-3 real es incompatible con el retiro de un clic.

---

## Progreso — Fase 2 firmador aislado + retiro en dos fases (2026-09-21)

Modelo elegido: **custodia firmada por firmador aislado que impone política** (no multisig
on-chain, que no es viable hoy en Cookie Chain). Firmador multi-nodo (k-de-n) = capa 2, después.

Hecho (código, tests 46/46 en verde):
- **`app/signer_client.py`** — la API ya NO tiene la llave. Pide el pago a un firmador
  externo por canal privado (HMAC). Modos: real / simulado (solo tests-dev con
  `ALLOW_SIMULATED_SIGNER=true`) / no-configurado (rechaza; sin fallback a llave caliente).
- **`signer/signer_service.py`** — servicio firmador que corre en el servidor aislado:
  autentica por HMAC, impone cap por retiro + cap diario, dedupe por `request_id`
  (no doble pago), valida destinatario, y sobre el cap devuelve `needs_manual_approval`.
  Solo dentro de límites llama a `dispatch_treasury_payout.js` (que carga la llave EN ESA caja).
- **Retiro en dos fases (`_withdraw_internal`)** — calcula → pide pago al firmador →
  **debita shares SOLO tras confirmación**. Fallo/inalcanzable → no quema shares (cierra H3).
  Sobre el cap → `pending_approval`, shares intactas. Tabla `withdrawals` de auditoría.
- Tests nuevos: fallo del firmador no quema shares; sobre el cap encola sin quemar.

Lo que TÚ tienes que hacer en infra (una vez):
1. En el servidor aislado: `pip install fastapi uvicorn`, poner ahí la keypair del tesoro
   (`config/treasury_vault_keypair.json`, nunca en el repo), y correr
   `uvicorn signer.signer_service:app --host 127.0.0.1 --port 8791`.
2. Firewall: que ese puerto lo alcance SOLO la IP del servidor API.
3. En el servidor API: `SIGNER_URL=http://<host-firmador>:8791`, mismo
   `SIGNER_SHARED_SECRET` en ambos, y ajustar `AUTO_PAYOUT_CAP_COOKIE` /
   `DAILY_PAYOUT_CAP_COOKIE` a números reales.
4. Definir cuál de las 3 direcciones (COLD/WARM/HOT) es la de depósito publicada; hoy la
   verificación usa `COLD_VAULT_ADDRESS`.

Pendiente (no bloquea someter):
- Reconciliación de retiros `PENDING` tras un crash (el firmador ya es idempotente por
  `request_id`, falta el barrido de arranque que consulta el estado y concilia).
- Fase 3: SIWS del lado servidor (auth por firma) en toda ruta que credite/mueva valor.
- Firmador multi-nodo k-de-n (capa 2).
- Robustez restante (rate limiter X-Forwarded-For, uuid ids, borrar clase muerta).
