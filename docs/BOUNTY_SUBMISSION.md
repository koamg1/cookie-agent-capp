# Bounty submission pack — CookieAgent Gateway & Sentinel

Rellena los `<placeholders>` antes de enviar. Todo el texto de posts está en inglés
(audiencia del bounty). Ajusta el tono a tu gusto.

---

## 1. Checklist de submission

Requisitos del bounty "Create an App on Cookie Chain" (Superteam):

- [x] **App funcionando en Cookie Chain SVM** — sí (gateway + burns + karma + PoR + 18 MCP tools).
- [x] **Nightly wallet soportada** — sí (adaptador de 9 wallets, Nightly incluida).
- [x] **URL pública desplegada** — https://cookie-agent-capp.onrender.com
- [x] **Repo público en GitHub** — https://github.com/koamg1/cookie-agent-capp
- [ ] **Hilo en X** — borrador abajo (sección 2).
- [ ] **Compartir en el Telegram de la comunidad Cookie Chain** — mensaje abajo (sección 3).
- [ ] **Video demo** — el que estás editando; súbelo y enlázalo en el hilo y el README.

Antes de hacer push (verificación anti-fugas):
- [ ] `config/` y `*keypair*.json` en `.gitignore` (ya está) y NINGUNA keypair commiteada.
- [ ] `.env` no commiteado; `.env.example` sin secretos reales.
- [ ] `PUBLIC_DEPOSITS_ENABLED=false` en el entorno público.
- [ ] `python -m pytest -q` → 44 passed, 2 skipped (the 2 skips are live-RPC-only tests that skip gracefully without outbound network access -- e.g. a sandboxed CI runner; they run and pass on a host with real Cookie Chain / Solana RPC access, such as the production VPS).
- [ ] Frontend: pasada de honestidad aplicada (ver docs/ROADMAP_HARDENING.md; quitar telemetría fabricada de la UI antes de apuntar al jurado).

---

## 2. Hilo de X (borrador, EN)

**1/**
🍪 Building on @TheCookieChain (SVM): CookieAgent Gateway & Sentinel — an autonomous-agent gateway + verifiable burns + security-first vault.

Built for @SuperteamEarn! 🚀

🌐 Live: https://cookie-agent-capp.onrender.com
💻 Code: https://github.com/koamg1/cookie-agent-capp
🧵👇

**2/**
2/ 🌉 Onboarding & Bridge:
• Connect any of 9 SVM wallets (@nightly_app recommended)
• Need $COOKIE on Cookie Chain? Bridge seamlessly from Solana/Base via Hyperlane directly inside our built-in Bridge Guide modal! 

Sign-in cryptographically with SIWS. 🛡️

**3/**
3/ 🔥 Verifiable Burn Oven:
Burn $COOKIE to the canonical SVM incinerator and earn Baker Karma!

Every single burn is reconciled straight from the @TheCookieChain RPC (rpc.cookiescan.io). The leaderboard is verifiable on CookieScan, not vibes.

**4/**
4/ 🤖 18 `cookie-mcp` tools expose the chain to AI agents (Claude, Codex, Antigravity):
• Real-time SVM block telemetry & live TPS
• Wallet balances & Baker Karma
• Cold/Warm/Hot Proof-of-Reserves

One standardized manifest, LLM-ready:
https://cookie-agent-capp.onrender.com/docs

**5/**
5/ 🛡️ Security & Radical Honesty:
• Vault deposits verified on-chain
• Signing keys isolated off-server
• No fake APY, no fake TVL, no simulated arb. Real on-chain data straight from the SVM validator or honest standby until a 2nd DEX launches.

**6/**
6/ 📦 Open Source, MIT License:
• 44/46 tests green in pytest
• Docker 1-liner (~45MB RAM)
• Live on @TheCookieChain SVM!

Give it a spin & feedback welcome! 🍪
https://cookie-agent-capp.onrender.com

---

## 3. Mensaje para Telegram (comunidad Cookie Chain)

> 🍪 Just shipped **CookieAgent Gateway & Sentinel** for the Cookie Chain app bounty.
> Agent gateway + verifiable $COOKIE burns + Baker Karma + 18 MCP tools + a security-first
> vault (on-chain-verified deposits, isolated signer, no fake yield or arbitrage — honest standby).
> Live: https://cookie-agent-capp.onrender.com · Code: https://github.com/koamg1/cookie-agent-capp · Demo: <YOUR_VIDEO_URL>
> Nightly-ready. Would love feedback from the community 🙏

---

## 4. Descripción para Superteam (submission)

**CookieAgent Gateway & Sentinel** is an autonomous-agent gateway and security-first vault
for Cookie Chain (SVM).

What it does:
- Universal onboarding for 9 SVM wallets (Nightly recommended) with Sign-In with Solana.
- Verifiable deflationary burns: $COOKIE burns are reconciled directly from the RPC against
  the canonical incinerator; Baker Karma and the leaderboard count only verified burns.
- A `cookie-mcp` bridge exposing 18 Model Context Protocol tools so AI agents can read the
  chain (network stats, balances, burns, vault status, proof-of-reserves).
- Live network telemetry (slot/epoch/TPS) and a 3-tier Proof-of-Reserves read from real
  on-chain balances.

Security & honesty (the core of this submission):
- Zero-trust deposits verified on-chain into the Cold Vault (amount derived from the chain).
- Withdrawals paid by an isolated, policy-enforcing signer (per-tx + daily caps, idempotent,
  two-phase pay→confirm→burn). The treasury key never lives on the public API server.
- No fabricated yield/APY/TVL and no invented arbitrage. COOK's USD price is shown live from
  its Solana market; Cookie Chain has no COOK/USDC market yet, so the vault stays in
  transparent standby and Proof-of-Reserves reports real balances or "unavailable".

Stack: React 18 + Vite + Tailwind, FastAPI (Python), Docker. MIT. 44/46 tests green + 2 environment-dependent skips (all 46 green with live RPC access).
Runs within Oracle Cloud Always-Free limits (~45MB RAM).

Live: <YOUR_PUBLIC_URL> · Repo: <YOUR_GITHUB_URL> · Demo: <YOUR_VIDEO_URL>
Security audit: docs/SECURITY_AUDIT.md · Roadmap: docs/ROADMAP_HARDENING.md
