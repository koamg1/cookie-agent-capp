# 🍪 Cookie Chain Web3 Wallet Master Guide & Integration Proposal

> **Reference URL**: [https://docs.cookiechain.wtf/wallets](https://docs.cookiechain.wtf/wallets)  
> **Author**: CookieAgent Gateway & Sentinel Team (Superteam Earn Bounty Submission)  
> **Target**: Cookie Chain Community, Developers & Core Team

---

## 1. Overview & Analysis of `docs.cookiechain.wtf/wallets`

The official documentation of Cookie Chain (`https://docs.cookiechain.wtf/wallets`) currently states:
> *"Cookie Chain supports standard Solana-compatible wallets, including browser wallets, mobile wallets, and hardware-backed flows depending on your setup."*  
> *"Recommended: Nightly: fully supported on Cookie Chain. Install from nightly.app."*  
> *"RPC: https://rpc.cookiescan.io | WebSocket: https://wss.cookiescan.io | Bridge: https://hyperlane.cookiescan.io"*

### The Opportunity: Expanding from 1 to 9 Wallets
While **Nightly** was the pioneer SVM wallet to natively support custom networks, modern Web3 users predominantly use **Phantom, Backpack, Solflare, OKX Wallet, Magic Eden, and Coinbase Wallet**. 

In this document and in our deployed **CookieAgent Gateway cApp**, we establish the **Universal Solana Wallet Standard Adapter** for Cookie Chain.

---

## 2. Supported Wallets Matrix

| Wallet | Provider Injection | Solana Wallet Standard Support | SIWS Signature Method | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Phantom** | `window.phantom.solana` | Partial | `signMessage(bytes, 'utf8')` | Needs UTF-8 encoding hint; maintains persistent background session. |
| **Backpack** | `window.backpack` | Full | `signMessage(bytes)` | Native Solana & xNFT community favorite; ultra-low latency. |
| **OKX Wallet** | `window.okxwallet.solana` | Full | `signMessage(bytes)` | Multi-chain global standard with millions of users. |
| **Solflare** | `window.solflare` | Full | `signMessage(bytes)` | Expects raw `Uint8Array`; does NOT accept string encoding arguments. |
| **Magic Eden** | `window.magicEden.solana` | Full | `signMessage(bytes)` | Leading SVM marketplace wallet. |
| **Coinbase Wallet** | `window.coinbaseSolana` | Partial | `signMessage(bytes)` | Enterprise & retail multi-chain reach. |
| **Nightly** | `window.nightly.solana` | Full | `features['solana:signMessage']` | Official recommended wallet on `docs.cookiechain.wtf`. |
| **Brave Wallet** | `window.braveSolana` | Full | `signMessage(bytes)` | Default privacy wallet built into Brave Browser. |
| **Session Key** | In-Browser Keypair | N/A | Local Ed25519 in JS | **$0 install**, instant testing on Cookie Chain for non-extension users. |

---

## 3. How to Connect Custom Wallets to Cookie Chain

### RPC & Network Parameters
To configure any custom Solana/SVM wallet to talk to Cookie Chain:

* **Network Name**: `Cookie Chain`
* **RPC URL**: `https://rpc.cookiescan.io`
* **WebSocket URL**: `https://wss.cookiescan.io`
* **Currency Symbol**: `COOKIE`
* **Explorer URL**: `https://cookiescan.io`
* **Bridge URL**: `https://hyperlane.cookiescan.io`

### Configuring Nightly Wallet
1. Open the Nightly extension.
2. Select the network dropdown at the top.
3. Switch from Solana Mainnet to **Cookie Chain** (natively supported) or click **Add Custom Network** and input `https://rpc.cookiescan.io`.

### Configuring Phantom & Solflare
1. Open **Settings** -> **Developer Settings** -> **Change Network**.
2. Select **Custom RPC** or **Cookie Chain Mainnet** override.
3. Enter `https://rpc.cookiescan.io`.

---

## 4. Cryptographic Authentication Standard (SIWS)

Instead of relying on insecure client-side mock flags, Cookie Chain dApps should enforce **Sign-In with Solana (SIWS)**.

### Challenge Template:
```text
Sign-In with Solana (SIWS) Authentication

URI: https://your-capp.cookiechain.wtf
Domain: your-capp.cookiechain.wtf
Address: <USER_SVM_PUBLIC_KEY>
Nonce: <SECURE_RANDOM_NONCE>
Issued At: <ISO_8601_TIMESTAMP>
Network: Cookie Chain (SVM)

Sign this message to authenticate your wallet session and cryptographically prove ownership of this SVM address. This request does not trigger any blockchain transaction or network fee.
```

---

## 5. Reference Implementation

The complete production implementation is available in the CookieAgent cApp repository:
* **Universal Adapter**: `frontend/src/utils/solana.ts`
* **Wallet Modal**: `frontend/src/components/WalletModal.tsx`
* **SVG Vector Logos**: `frontend/src/components/WalletIcons.tsx`
* **Live Deployment**: `<YOUR_PUBLIC_URL>` (Docker Compose + Cloudflare Tunnel -- see docs/BOUNTY_SUBMISSION.md; this project no longer ships a Vercel config, the prior link here was stale)
