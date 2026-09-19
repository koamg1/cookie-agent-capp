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

export function getBackpackProvider() {
  if (typeof window === 'undefined') return null;
  return (window as any).backpack || null;
}

export function getOkxProvider() {
  if (typeof window === 'undefined') return null;
  return (window as any).okxwallet?.solana || null;
}

export function getMagicEdenProvider() {
  if (typeof window === 'undefined') return null;
  return (window as any).magicEden?.solana || null;
}

export function getCoinbaseProvider() {
  if (typeof window === 'undefined') return null;
  if ((window as any).coinbaseSolana) return (window as any).coinbaseSolana;
  if (window.solana && ((window.solana as any).isCoinbaseWallet || (window.solana as any).isCoinbaseBrowser)) {
    return window.solana;
  }
  return null;
}

export function getBraveProvider() {
  if (typeof window === 'undefined') return null;
  return (window as any).braveSolana || null;
}

export function getWalletProvider(type: WalletType): any {
  switch (type) {
    case 'Phantom':
      return getPhantomProvider();
    case 'Backpack':
      return getBackpackProvider();
    case 'OKX Wallet':
      return getOkxProvider();
    case 'Solflare':
      return getSolflareProvider();
    case 'Magic Eden':
      return getMagicEdenProvider();
    case 'Coinbase Wallet':
      return getCoinbaseProvider();
    case 'Nightly':
      return getNightlyProvider();
    case 'Brave Wallet':
      return getBraveProvider();
    case 'Session Key':
      return getSessionKey();
    default:
      return null;
  }
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

export function extractSignatureHex(raw: any): string {
  let bytes: Uint8Array | null = null;
  if (raw instanceof Uint8Array) {
    bytes = raw;
  } else if (raw?.signature instanceof Uint8Array) {
    bytes = raw.signature;
  } else if (Array.isArray(raw) && raw.length > 0) {
    const item = raw[0];
    if (item instanceof Uint8Array) bytes = item;
    else if (item?.signature instanceof Uint8Array) bytes = item.signature;
  } else if (raw?.signedMessage instanceof Uint8Array) {
    bytes = raw.signedMessage;
  }

  if (bytes) {
    return Array.from(bytes).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  }

  if (typeof raw === 'string' && raw.length > 0) {
    return raw;
  }

  throw new Error("Formato de firma no reconocido por la billetera.");
}

export async function getWalletAddress(type: WalletType, provider: any): Promise<string> {
  if (type === 'Session Key') {
    if (!provider || !provider.publicKey) {
      throw new Error("Session key no inicializada.");
    }
    const addr = provider.publicKey.toString();
    if (!isValidUserAddress(addr)) throw new Error("Error generando Session Key.");
    return addr;
  }

  if (!provider) {
    throw new Error(`Proveedor no disponible para ${type}. Asegúrate de tener la extensión instalada.`);
  }

  let candidate: string | null = null;

  // 1. Try Solana Wallet Standard connect
  if (provider.features && provider.features['standard:connect']) {
    try {
      const res = await provider.features['standard:connect'].connect();
      const addr = res?.accounts?.[0]?.address;
      if (isValidUserAddress(addr)) candidate = addr;
    } catch (err) {
      console.warn(`standard:connect warning for ${type}:`, err);
    }
  }

  // 2. Try standard connect()
  if (!candidate && typeof provider.connect === 'function') {
    try {
      const res = await provider.connect({ onlyIfTrusted: false });
      const addr = res?.publicKey?.toString() || provider.publicKey?.toString() || (res?.accounts && res.accounts[0]?.address);
      if (isValidUserAddress(addr)) candidate = addr;
    } catch (err) {
      console.warn(`connect() warning for ${type}:`, err);
      // Re-throw if user deliberately cancelled or rejected
      const msg = String(err);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        throw err;
      }
    }
  }

  // 3. Fallback: check already connected public key or accounts
  if (!candidate && provider.publicKey) {
    const addr = provider.publicKey.toString();
    if (isValidUserAddress(addr)) candidate = addr;
  }
  if (!candidate && provider.accounts && provider.accounts.length > 0) {
    const addr = provider.accounts[0].address || provider.accounts[0].publicKey?.toString();
    if (isValidUserAddress(addr)) candidate = addr;
  }

  if (!candidate || !isValidUserAddress(candidate)) {
    throw new Error(`${type} no devolvió una cuenta pública válida. Abre la extensión, desbloquéala y autoriza la conexión.`);
  }

  return candidate;
}

export async function requestWalletSignature(
  type: WalletType,
  provider: any,
  address: string,
  messageText: string
): Promise<string> {
  if (type === 'Session Key') {
    return "session_key_sig_" + Date.now();
  }

  if (!provider) {
    throw new Error(`Proveedor de ${type} no encontrado.`);
  }

  const messageBytes = new TextEncoder().encode(messageText);

  // Strategy 1: Standard Wallet feature (features['solana:signMessage']) - supported by Nightly, Backpack, Solflare, etc.
  if (provider.features && provider.features['solana:signMessage']) {
    try {
      const account = (provider.accounts || []).find((a: any) => a.address === address) || provider.accounts?.[0] || { address };
      const signResults = await provider.features['solana:signMessage'].signMessage({
        account: account,
        message: messageBytes
      });
      return extractSignatureHex(signResults);
    } catch (stdErr: any) {
      console.warn(`Standard wallet signMessage warning on ${type}, trying legacy fallback:`, stdErr);
      const msg = String(stdErr);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        throw stdErr;
      }
    }
  }

  // Strategy 2: Phantom specific (supports utf8 parameter)
  if (type === 'Phantom' && typeof provider.signMessage === 'function') {
    const signed = await provider.signMessage(messageBytes, 'utf8');
    return extractSignatureHex(signed);
  }

  // Strategy 3: Standard single-argument signMessage(bytes) for Solflare, Backpack, OKX, Magic Eden, Brave, Nightly, Coinbase
  if (typeof provider.signMessage === 'function') {
    try {
      const signed = await provider.signMessage(messageBytes);
      return extractSignatureHex(signed);
    } catch (firstErr: any) {
      console.warn(`Direct signMessage(bytes) error on ${type}, trying utf8 hint:`, firstErr);
      const msg = String(firstErr);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        throw firstErr;
      }
      try {
        const signed2 = await provider.signMessage(messageBytes, 'utf8');
        return extractSignatureHex(signed2);
      } catch {
        throw firstErr;
      }
    }
  }

  throw new Error(`La billetera ${type} no soporta la función signMessage.`);
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
