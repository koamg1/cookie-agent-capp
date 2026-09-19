import * as solanaWeb3 from '@solana/web3.js';
import { WalletType } from '../types/wallet';

declare global {
  interface Window {
    nightly?: any;
    phantom?: any;
    solflare?: any;
    solana?: any;
    solanaWeb3?: any;
  }
}

export function isValidUserAddress(addr: string | null | undefined): boolean {
  if (!addr || typeof addr !== 'string') return false;
  if (addr === '11111111111111111111111111111111' || addr.startsWith('11111111111111111111111111111111')) return false;
  return addr.length >= 32 && addr.length <= 44;
}

export function getNightlyProvider() {
  if (typeof window === 'undefined') return null;
  if (window.nightly) {
    if (window.nightly.solana) return window.nightly.solana;
    if (window.nightly.standardWallet) return window.nightly.standardWallet;
    return window.nightly;
  }
  if (window.solana && window.solana.isNightly) return window.solana;
  return null;
}

export function getPhantomProvider() {
  if (typeof window === 'undefined') return null;
  if (window.phantom && window.phantom.solana) return window.phantom.solana;
  if (window.solana && window.solana.isPhantom) return window.solana;
  return null;
}

export function getSolflareProvider() {
  if (typeof window === 'undefined') return null;
  if (window.solflare && window.solflare.isSolflare) return window.solflare;
  if (window.solflare) return window.solflare;
  return null;
}

export function getSessionKey(): solanaWeb3.Keypair {
  const saved = localStorage.getItem('cookie_chain_session_key');
  if (saved) {
    try {
      return solanaWeb3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(saved)));
    } catch {
      const keypair = solanaWeb3.Keypair.generate();
      localStorage.setItem('cookie_chain_session_key', JSON.stringify(Array.from(keypair.secretKey)));
      return keypair;
    }
  }
  const keypair = solanaWeb3.Keypair.generate();
  localStorage.setItem('cookie_chain_session_key', JSON.stringify(Array.from(keypair.secretKey)));
  return keypair;
}

export function buildAuthChallenge(address: string): string {
  const nonce = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const timestamp = new Date().toISOString();
  const domain = typeof window !== 'undefined' ? window.location.host : 'cookie-agent.local';

  return `Sign-In with Solana (SIWS) Authentication\n\n` +
    `URI: ${typeof window !== 'undefined' ? window.location.origin : ''}\n` +
    `Domain: ${domain}\n` +
    `Address: ${address}\n` +
    `Nonce: ${nonce}\n` +
    `Issued At: ${timestamp}\n` +
    `Network: Cookie Chain (SVM)\n\n` +
    `Sign this message to authenticate your wallet session and cryptographically prove ownership of this SVM address. This request does not trigger any blockchain transaction or network fee.`;
}

export async function getWalletAddress(type: WalletType, provider: any): Promise<string> {
  if (type === 'Nightly') {
    let candidate: string | null = null;
    if (provider.features && provider.features['standard:connect']) {
      try {
        const res = await provider.features['standard:connect'].connect(false);
        const addr = res?.accounts?.[0]?.address;
        if (isValidUserAddress(addr)) candidate = addr;
      } catch (err) {
        console.warn("Nightly standard:connect warning:", err);
      }
    }
    if (!candidate && typeof provider.connect === 'function') {
      try {
        const res = await provider.connect({ onlyIfTrusted: false });
        const addr = res?.publicKey?.toString() || (res?.accounts && res.accounts[0]?.address);
        if (isValidUserAddress(addr)) candidate = addr;
      } catch (err) {
        console.warn("Nightly connect():", err);
      }
    }
    if (!candidate && provider.accounts && provider.accounts.length > 0) {
      const addr = provider.accounts[0].address;
      if (isValidUserAddress(addr)) candidate = addr;
    }
    if (!candidate && provider.publicKey) {
      const addr = provider.publicKey.toString();
      if (isValidUserAddress(addr)) candidate = addr;
    }

    if (!candidate || !isValidUserAddress(candidate)) {
      throw new Error("Nightly no devolvió una cuenta pública válida. Abre la extensión Nightly, desbloquéala con tu contraseña y asegúrate de tener una cuenta activa de Solana.");
    }
    return candidate;
  }

  if (type === 'Phantom') {
    const res = await provider.connect({ onlyIfTrusted: false });
    const addr = res?.publicKey ? res.publicKey.toString() : provider.publicKey?.toString();
    if (!isValidUserAddress(addr)) {
      throw new Error("Phantom no devolvió una cuenta válida. Abre la extensión Phantom y desbloquéala.");
    }
    return addr;
  }

  if (type === 'Solflare') {
    await provider.connect();
    const addr = provider.publicKey ? provider.publicKey.toString() : null;
    if (!isValidUserAddress(addr)) {
      throw new Error("Solflare no devolvió una cuenta válida. Abre la extensión Solflare y desbloquéala.");
    }
    return addr;
  }

  if (type === 'Session Key') {
    if (!provider || !provider.publicKey) {
      throw new Error("Session key no inicializada.");
    }
    const addr = provider.publicKey.toString();
    if (!isValidUserAddress(addr)) throw new Error("Error generando Session Key.");
    return addr;
  }

  throw new Error(`Proveedor desconocido: ${type}`);
}

export async function requestWalletSignature(
  type: WalletType,
  provider: any,
  address: string,
  messageText: string
): Promise<string> {
  const messageBytes = new TextEncoder().encode(messageText);

  if (type === 'Nightly') {
    if (typeof provider.signMessage === 'function') {
      const res = await provider.signMessage(messageBytes, 'utf8');
      const sig = res?.signature || res;
      if (!sig) throw new Error("Firma cancelada o rechazada en Nightly.");
      return Array.from(sig).map((b: any) => b.toString(16).padStart(2, '0')).join('');
    }
    if (provider.features && provider.features['solana:signMessage']) {
      const account = (provider.accounts || []).find((a: any) => a.address === address) || provider.accounts?.[0] || { address };
      const signResults = await provider.features['solana:signMessage'].signMessage({
        account: account,
        message: messageBytes
      });
      const sig = Array.isArray(signResults) ? signResults[0]?.signature : (signResults?.signature || signResults);
      if (!sig) throw new Error("Firma cancelada o rechazada en Nightly.");
      return Array.from(sig).map((b: any) => b.toString(16).padStart(2, '0')).join('');
    }
    throw new Error("Nightly no soporta la función signMessage.");
  }

  if (type === 'Phantom') {
    const signed = await provider.signMessage(messageBytes, 'utf8');
    const sig = signed?.signature || signed;
    if (!sig) throw new Error("Firma cancelada o rechazada en Phantom.");
    return Array.from(sig).map((b: any) => b.toString(16).padStart(2, '0')).join('');
  }

  if (type === 'Solflare') {
    const signed = await provider.signMessage(messageBytes, 'utf8');
    const sig = signed?.signature || signed;
    if (!sig) throw new Error("Firma cancelada o rechazada en Solflare.");
    return Array.from(sig).map((b: any) => b.toString(16).padStart(2, '0')).join('');
  }

  if (type === 'Session Key') {
    return "session_key_sig_" + Date.now();
  }

  throw new Error("Tipo de billetera no soportado para firma.");
}

export async function sendWalletTransaction(
  type: WalletType,
  provider: any,
  transaction: solanaWeb3.Transaction,
  connection: solanaWeb3.Connection,
  connectedAddress: string
): Promise<string> {
  if (type === 'Session Key') {
    transaction.sign(provider);
    const rawTx = transaction.serialize();
    return await connection.sendRawTransaction(rawTx, { skipPreflight: false });
  }

  if (typeof provider.signAndSendTransaction === 'function') {
    const res = await provider.signAndSendTransaction(transaction);
    if (typeof res === 'string') return res;
    if (res && res.signature) {
      if (typeof res.signature === 'string') return res.signature;
      return new solanaWeb3.PublicKey(res.signature).toBase58();
    }
    return typeof res === 'object' ? (res.txid || JSON.stringify(res)) : String(res);
  }

  if (provider.features && provider.features['solana:signAndSendTransaction']) {
    const account = (provider.accounts || []).find((a: any) => a.address === connectedAddress) || provider.accounts?.[0];
    const [res] = await provider.features['solana:signAndSendTransaction'].signAndSendTransaction({
      account: account,
      transaction: transaction.serialize(),
      chain: 'solana:mainnet'
    });
    if (res && res.signature) {
      return new solanaWeb3.PublicKey(res.signature).toBase58();
    }
  }

  if (typeof provider.signTransaction === 'function') {
    const signedTx = await provider.signTransaction(transaction);
    const raw = signedTx.serialize();
    return await connection.sendRawTransaction(raw, { skipPreflight: false });
  }

  if (provider.features && provider.features['solana:signTransaction']) {
    const account = (provider.accounts || []).find((a: any) => a.address === connectedAddress) || provider.accounts?.[0];
    const [res] = await provider.features['solana:signTransaction'].signTransaction({
      account: account,
      transaction: transaction.serialize()
    });
    if (res && res.signedTransaction) {
      return await connection.sendRawTransaction(res.signedTransaction, { skipPreflight: false });
    }
  }

  throw new Error("El proveedor de la billetera no soporta firma de transacciones.");
}
