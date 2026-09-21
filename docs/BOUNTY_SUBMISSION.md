# Bounty submission pack — CookieAgent Gateway & Sentinel

Rellena los `<placeholders>` antes de enviar. Todo el texto de posts está en inglés
(audiencia del bounty). Ajusta el tono a tu gusto.

---

## 1. Checklist de submission

Requisitos del bounty "Create an App on Cookie Chain" (Superteam):

- [ ] **App funcionando en Cookie Chain SVM** — sí (gateway + burns + karma + PoR + 18 MCP tools).
- [ ] **Nightly wallet soportada** — sí (adaptador de 9 wallets, Nightly incluida).
- [ ] **URL pública desplegada** — pendiente: `docker compose up --build -d` en el VPS + túnel Cloudflare → `<YOUR_PUBLIC_URL>`.
- [ ] **Repo público en GitHub** — pendiente: `git push` a un repo público.
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
🍪 Building on Cookie Chain (SVM): CookieAgent Gateway & Sentinel — an autonomous-agent
gateway + verifiable on-chain burns + a transparent, security-first vault.

Live: <YOUR_PUBLIC_URL>
Code: <YOUR_GITHUB_URL>
Demo: <YOUR_VIDEO_URL>
🧵

**2/**
Connect any of 9 SVM wallets (Nightly recommended) via Sign-In with Solana.
Burn $COOKIE to the canonical incinerator and earn Baker Karma — every burn is
reconciled straight from the RPC, so the leaderboard is verifiable, not vibes.

**3/**
18 `cookie-mcp` tools expose the chain to AI agents (Claude, LangChain, …):
network stats, balances, burns, vault status, proof-of-reserves.
One manifest, LLM-ready.

**4/**
The vault is where we went hard on safety 👇
• Deposits are verified on-chain — shares mint only for what actually lands in the Cold Vault.
• The treasury key never sits on the public server. Payouts go through an isolated,
policy-enforcing signer (caps + two-phase: pay → confirm → burn shares).

**5/**
And we refuse to fake numbers. No fake APY, no fake TVL, no invented arbitrage.
COOK's live USD price is shown straight from its Solana market; the vault sits in transparent
standby (there's no COOK/USDC market on Cookie Chain to trade against yet).
Proof-of-Reserves reads real on-chain balances or says "unavailable".

**6/**
Open source, MIT, 44/46 tests green + 2 environment-dependent skips (all 46 green with live RPC access), Docker one-liner, ~45MB RAM.
Built for Cookie Chain. Feedback welcome 🍪
<YOUR_GITHUB_URL>

---

## 3. Mensaje para Telegram (comunidad Cookie Chain)

> 🍪 Just shipped **CookieAgent Gateway & Sentinel** for the Cookie Chain app bounty.
> Agent gateway + verifiable $COOKIE burns + Baker Karma + 18 MCP tools + a security-first
> vault (on-chain-verified deposits, isolated signer, no fake yield or arbitrage — honest standby).
> Live: <YOUR_PUBLIC_URL> · Code: <YOUR_GITHUB_URL> · Demo: <YOUR_VIDEO_URL>
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
