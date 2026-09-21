import * as solanaWeb3 from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createBurnInstruction,
  TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';
import { WalletType } from '../types/wallet';
import { apiUrl } from '../config/api';


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
  if (window.solana && (window.solana.isNightly || (window.solana as any).nightly)) return window.solana;
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

  throw new Error("Signature format not recognized by wallet.");
}

export function serializeSignedTx(signedTx: any, fallbackTx: solanaWeb3.Transaction): Uint8Array {
  if (signedTx instanceof Uint8Array) {
    return signedTx;
  }
  if (signedTx?.signedTransaction instanceof Uint8Array) {
    return signedTx.signedTransaction;
  }
  if (Array.isArray(signedTx) && signedTx.length > 0) {
    const item = signedTx[0];
    if (item instanceof Uint8Array) return item;
    if (item?.signedTransaction instanceof Uint8Array) return item.signedTransaction;
    if (typeof item?.serialize === 'function') return item.serialize();
  }
  if (signedTx && typeof signedTx.serialize === 'function') {
    return signedTx.serialize();
  }
  if (fallbackTx && typeof fallbackTx.serialize === 'function') {
    return fallbackTx.serialize();
  }
  throw new Error("Unable to serialize signed transaction from wallet provider.");
}

export async function getWalletAddress(type: WalletType, provider: any): Promise<string> {
  if (type === 'Session Key') {
    if (!provider || !provider.publicKey) {
      throw new Error("Session key not initialized.");
    }
    const addr = provider.publicKey.toString();
    if (!isValidUserAddress(addr)) throw new Error("Error generating Session Key.");
    return addr;
  }

  if (!provider) {
    throw new Error(`Provider not available for ${type}. Please ensure the extension is installed.`);
  }

  let candidate: string | null = null;

  // 1. TOP PRIORITY: Solana Wallet Standard connect (standard:connect)
  // Essential for Nightly, Backpack and all modern SVM standard wallets.
  // Calling standard:connect natively triggers the extension window so user can choose account!
  const stdConnect = provider.features?.['standard:connect'];
  if (stdConnect && typeof stdConnect.connect === 'function') {
    try {
      console.info(`[Wallet] Connecting ${type} via standard:connect...`);
      const res = await stdConnect.connect();
      const accounts = res?.accounts || provider.accounts;
      if (accounts && accounts.length > 0) {
        const validAcc = accounts.find((a: any) => isValidUserAddress(a.address)) || accounts[0];
        if (validAcc?.address) {
          candidate = validAcc.address;
        }
      }
    } catch (err: any) {
      console.warn(`standard:connect warning for ${type}:`, err);
      const msg = String(err?.message || err);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected') || msg.includes('denied')) {
        throw new Error(`Connection cancelled in ${type}.`);
      }
    }
  }

  // 2. Fallback: Legacy Solana provider connect() (Phantom, Solflare, etc.)
  if (!candidate && typeof provider.connect === 'function') {
    try {
      console.info(`[Wallet] Connecting ${type} via legacy connect()...`);
      const res = await provider.connect({ onlyIfTrusted: false });
      const rawPub = res?.publicKey || provider.publicKey;
      if (rawPub) {
        const addr = typeof rawPub.toBase58 === 'function' ? rawPub.toBase58() : String(rawPub);
        if (isValidUserAddress(addr)) candidate = addr;
      }
    } catch (err) {
      console.warn(`connect() warning for ${type}:`, err);
      const msg = String((err as any)?.message || err);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        throw err;
      }
    }
  }

  // 3. Fallback: Direct inspection of provider.accounts
  if (!candidate && provider.accounts && provider.accounts.length > 0) {
    const validAcc = provider.accounts.find((a: any) => isValidUserAddress(a.address || a.publicKey?.toString()));
    if (validAcc) candidate = validAcc.address || validAcc.publicKey?.toString();
  }

  // 4. Fallback: Direct inspection of provider.publicKey
  if (!candidate && provider.publicKey) {
    const rawPub = provider.publicKey;
    const addr = typeof rawPub.toBase58 === 'function' ? rawPub.toBase58() : String(rawPub);
    if (isValidUserAddress(addr)) candidate = addr;
  }

  if (!candidate || !isValidUserAddress(candidate)) {
    throw new Error(`${type} did not return a valid public account. Please unlock your wallet and approve the connection.`);
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
    throw new Error(`Provider for ${type} not found.`);
  }

  const messageBytes = new TextEncoder().encode(messageText);

  // Strategy 1: Standard Wallet feature (standard:signMessage or solana:signMessage)
  const stdSignMsg = provider.features?.['standard:signMessage'] || provider.features?.['solana:signMessage'];
  if (stdSignMsg && typeof stdSignMsg.signMessage === 'function') {
    try {
      let account = (provider.accounts || []).find((a: any) => a.address === address) || provider.accounts?.[0];
      if (!account) {
        account = { address, publicKey: new solanaWeb3.PublicKey(address).toBytes() };
      }
      const signResults = await stdSignMsg.signMessage({
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

  throw new Error(`Wallet ${type} does not support signMessage.`);
}

export async function ensureWalletConnected(type: WalletType, provider?: any): Promise<any> {
  if (type === 'Session Key') {
    return provider || getSessionKey();
  }

  let activeProvider = getWalletProvider(type) || provider;
  if (!activeProvider) {
    // Brief 120ms tick in case extension injected with delay
    await new Promise((r) => setTimeout(r, 120));
    activeProvider = getWalletProvider(type) || provider;
  }

  if (!activeProvider) {
    throw new Error(`Wallet provider ${type} not detected. Please ensure the extension is installed and active.`);
  }

  const getProviderAddress = (p: any): string | null => {
    if (!p) return null;
    if (p.publicKey) {
      if (typeof p.publicKey.toBase58 === 'function') return p.publicKey.toBase58();
      const s = String(p.publicKey);
      if (s && s !== '[object Object]') return s;
    }
    if (Array.isArray(p.accounts) && p.accounts.length > 0) {
      const acc = p.accounts[0];
      if (typeof acc === 'string') return acc;
      if (acc?.address) return acc.address;
    }
    return null;
  };

  const activeAddress = getProviderAddress(activeProvider);
  const isConnected = !!(
    activeProvider.isConnected === true ||
    (activeAddress && isValidUserAddress(activeAddress))
  );

  if (!isConnected) {
    console.info(`[Wallet] ${type} is not connected or session expired. Reconnecting...`);
    try {
      if (typeof activeProvider.connect === 'function') {
        await activeProvider.connect({ onlyIfTrusted: false });
      } else if (activeProvider.features && activeProvider.features['standard:connect']) {
        await activeProvider.features['standard:connect'].connect();
      }
    } catch (err: any) {
      console.warn(`[Wallet] ensureWalletConnected reconnect warning on ${type}:`, err);
      const msg = String(err?.message || err);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected') || msg.includes('denied')) {
        throw new Error(`Connection cancelled in ${type}.`);
      }
    }
  }

  return activeProvider;
}

export async function getFastBlockhash(
  connection: solanaWeb3.Connection,
  fallbackRpcUrl: string = "https://rpc.cookiescan.io"
): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  const fallbackConn = new solanaWeb3.Connection(fallbackRpcUrl, {
    commitment: "confirmed",
    wsEndpoint: ""
  });

  const queryConn = async (conn: solanaWeb3.Connection, ms: number) => {
    return Promise.race([
      conn.getLatestBlockhash("confirmed"),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('RPC_TIMEOUT')), ms))
    ]);
  };

  return new Promise<{ blockhash: string; lastValidBlockHeight: number }>((resolve, reject) => {
    let settled = false;
    let rejectedCount = 0;

    const handleSuccess = (res: { blockhash: string; lastValidBlockHeight: number }) => {
      if (!settled) {
        settled = true;
        resolve(res);
      }
    };

    const handleFailure = (err: any) => {
      console.warn("RPC query attempt notice:", err);
      rejectedCount++;
      if (rejectedCount >= 2 && !settled) {
        settled = true;
        fallbackConn.getLatestBlockhash("confirmed").then(resolve).catch(reject);
      }
    };

    // Fire both concurrent requests immediately; fastest responding node wins!
    queryConn(connection, 3500).then(handleSuccess).catch(handleFailure);
    queryConn(fallbackConn, 3500).then(handleSuccess).catch(handleFailure);
  });
}

export async function broadcastSignedTransaction(
  raw: Uint8Array,
  connection: solanaWeb3.Connection,
  fallbackRpcUrl: string = "https://rpc.cookiescan.io"
): Promise<string> {
  // Attempt 1: primary connection (proxy or direct) with skipPreflight: true
  try {
    return await connection.sendRawTransaction(raw, {
      skipPreflight: true,
      maxRetries: 3
    });
  } catch (primaryErr: any) {
    console.warn("[Broadcast] Primary sendRawTransaction notice, attempting direct fallback RPC:", primaryErr);
    // Attempt 2: direct fallback RPC
    try {
      const fallbackConn = new solanaWeb3.Connection(fallbackRpcUrl, {
        commitment: "confirmed",
        wsEndpoint: ""
      });
      return await fallbackConn.sendRawTransaction(raw, {
        skipPreflight: true,
        maxRetries: 3
      });
    } catch (fallbackErr: any) {
      console.error("[Broadcast] Fallback sendRawTransaction failed:", fallbackErr);
      const detail = primaryErr?.message || fallbackErr?.message || String(primaryErr);
      throw new Error(`Transaction signed successfully, but broadcast failed: ${detail}`);
    }
  }
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
    return await broadcastSignedTransaction(rawTx, connection);
  }

  // Ensure provider is freshly resolved from window and actively connected
  const activeProvider = await ensureWalletConnected(type, provider);

  const isUserRejection = (err: any) => {
    const msg = String(err?.message || err).toLowerCase();
    return msg.includes('reject') || msg.includes('cancel') || msg.includes('denied') || msg.includes('declined') || msg.includes('user rejected');
  };

  const serializedUnsigned = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });

  // Resolve the WalletAccount object (mandatory for standard:signTransaction in Nightly/Backpack)
  let account = (activeProvider.accounts || []).find((a: any) => a.address === connectedAddress) || activeProvider.accounts?.[0];

  // If account is not cached, attempt a silent standard:connect to populate active accounts
  if (!account && activeProvider.features?.['standard:connect']) {
    try {
      const connRes = await activeProvider.features['standard:connect'].connect({ silent: true }).catch(() => activeProvider.features['standard:connect'].connect());
      account = (connRes?.accounts || activeProvider.accounts || []).find((a: any) => a.address === connectedAddress) || connRes?.accounts?.[0];
    } catch (e) {
      console.warn("Silent account recovery warning:", e);
    }
  }

  // Fallback synthetic WalletAccount if extension doesn't expose it directly
  if (!account && connectedAddress) {
    try {
      account = {
        address: connectedAddress,
        publicKey: new solanaWeb3.PublicKey(connectedAddress).toBytes(),
        chains: ['solana:mainnet'],
        features: ['solana:signTransaction', 'standard:signTransaction']
      };
    } catch {}
  }

  const withTimeout = <T>(p: Promise<T>, ms: number, errMsg: string): Promise<T> => {
    return Promise.race([
      p,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms))
    ]);
  };

  // Resolve direct Solana provider for Nightly if available on window
  let directProvider = activeProvider;
  if (type === 'Nightly' && typeof window !== 'undefined' && window.nightly?.solana) {
    directProvider = window.nightly.solana;
  }

  let signedTx: any = null;

  // Priority 1: Direct provider.signTransaction (Nightly, Phantom, Solflare, Backpack)
  // This opens the wallet extension popup window immediately and returns the signed Transaction object
  if (directProvider && typeof directProvider.signTransaction === 'function') {
    try {
      console.info(`[Wallet] Prompting ${type} via direct provider.signTransaction...`);
      signedTx = await withTimeout(
        directProvider.signTransaction(transaction),
        60000,
        `Signature request timed out in ${type}. Please open your extension window to approve.`
      );
    } catch (err: any) {
      console.warn(`Direct signTransaction notice on ${type}:`, err);
      if (isUserRejection(err)) {
        throw new Error(`Transaction signing cancelled in ${type}.`);
      }
      // If signTransaction failed before user signed, attempt fallback signing methods below
    }
  }

  // Once signed via Priority 1, broadcast immediately — DO NOT prompt again!
  if (signedTx) {
    const raw = serializeSignedTx(signedTx, transaction);
    return await broadcastSignedTransaction(raw, connection);
  }

  // Priority 2: standard:signTransaction (Wallet Standard feature with fast 12s fallback)
  const stdSign = activeProvider.features?.['standard:signTransaction'];
  if (stdSign && typeof stdSign.signTransaction === 'function') {
    try {
      console.info(`[Wallet] Signing transaction with ${type} via standard:signTransaction...`);
      const signRes = await withTimeout(
        stdSign.signTransaction({
          account: account,
          transaction: serializedUnsigned
        }),
        12000,
        "standard:signTransaction timeout"
      );
      if (signRes) {
        const raw = serializeSignedTx(signRes, transaction);
        return await broadcastSignedTransaction(raw, connection);
      }
    } catch (stdErr: any) {
      console.warn(`standard:signTransaction notice on ${type}:`, stdErr);
      if (isUserRejection(stdErr)) {
        throw new Error(`Transaction signing cancelled in ${type}.`);
      }
      // If single object payload was rejected, try array format
      try {
        const signArrayRes = await withTimeout(
          stdSign.signTransaction([{
            account: account,
            transaction: serializedUnsigned
          }]),
          12000,
          "standard:signTransaction array timeout"
        );
        if (signArrayRes) {
          const raw = serializeSignedTx(signArrayRes, transaction);
          return await broadcastSignedTransaction(raw, connection);
        }
      } catch (arrErr: any) {
        if (isUserRejection(arrErr)) {
          throw new Error(`Transaction signing cancelled in ${type}.`);
        }
      }
    }
  }

  // Priority 3: solana:signTransaction (Solana Standard feature)
  const solanaSign = activeProvider.features?.['solana:signTransaction'];
  if (solanaSign && typeof solanaSign.signTransaction === 'function') {
    try {
      console.info(`[Wallet] Signing transaction with ${type} via solana:signTransaction...`);
      const signResults = await withTimeout(
        solanaSign.signTransaction({
          account: account,
          transaction: serializedUnsigned,
          chain: 'solana:mainnet'
        }),
        15000,
        "solana:signTransaction timeout"
      );
      if (signResults) {
        const raw = serializeSignedTx(signResults, transaction);
        return await broadcastSignedTransaction(raw, connection);
      }
    } catch (solErr: any) {
      console.warn(`solana:signTransaction notice on ${type}:`, solErr);
      if (isUserRejection(solErr)) {
        throw new Error(`Transaction signing cancelled in ${type}.`);
      }
    }
  }

  // Priority 4: Direct provider.signAndSendTransaction (only for legacy providers without signTransaction)
  if (directProvider && typeof directProvider.signAndSendTransaction === 'function') {
    try {
      console.info(`[Wallet] Prompting ${type} via direct provider.signAndSendTransaction...`);
      const res: any = await withTimeout<any>(
        directProvider.signAndSendTransaction(transaction),
        60000,
        `Signature request timed out in ${type}. Please open your extension window to approve.`
      );
      if (typeof res === 'string') return res;
      if (res && res.signature) {
        if (typeof res.signature === 'string') return res.signature;
        return new solanaWeb3.PublicKey(res.signature).toBase58();
      }
      return typeof res === 'object' ? (res.txid || JSON.stringify(res)) : String(res);
    } catch (err: any) {
      if (isUserRejection(err)) {
        throw new Error(`Transaction signing cancelled in ${type}.`);
      }
      throw err;
    }
  }

  throw new Error(`Wallet ${type} did not open or respond to the signing prompt. Please ensure your extension is unlocked and try again.`);
}

export const COOKIE_MAINNET_MINT = '36ZrtQoab5MhhySaP1YSTwUahSk6GRVUTtZ6cuVfm9e1';
export const CANONICAL_BURN_ADDRESS = '1nc1nerator11111111111111111111111111111111';

export function getSolanaMainnetRpcUrl(): string {
  // Always prioritize the active origin's local RPC proxy
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/api/v1/solana/rpc`;
  }
  const endpoint = apiUrl('/api/v1/solana/rpc');
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return `http://127.0.0.1:8000${endpoint}`;
}

export async function executeSolanaMainnetBurn(
  type: WalletType,
  provider: any,
  ownerAddress: string,
  amount: number,
  onLog?: (tag: string, msg: string, color?: string) => void,
  onStageChange?: (stage: 'preparing' | 'signing' | 'confirming') => void
): Promise<string> {
  if (onStageChange) onStageChange('preparing');
  const activeProvider = await ensureWalletConnected(type, provider);
  const rpcUrl = getSolanaMainnetRpcUrl();
  const connection = new solanaWeb3.Connection(rpcUrl, {
    commitment: "confirmed",
    wsEndpoint: ""
  });
  const owner = new solanaWeb3.PublicKey(ownerAddress);
  const mint = new solanaWeb3.PublicKey(COOKIE_MAINNET_MINT);
  const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);

  // 6 decimals for Token-2022 Cookie
  const rawAmount = Math.round(amount * 1_000_000);
  const burnIx = createBurnInstruction(ata, mint, owner, rawAmount, [], TOKEN_2022_PROGRAM_ID);

  const memoProgramId = new solanaWeb3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
  const memoPayload = `[Cookie Monster Burn] Deflation: Burned ${amount} $COOKIE from ${ownerAddress.slice(0, 4)}...${ownerAddress.slice(-4)}`;
  const memoIx = new solanaWeb3.TransactionInstruction({
    keys: [{ pubkey: owner, isSigner: true, isWritable: true }],
    programId: memoProgramId,
    data: new TextEncoder().encode(memoPayload) as any
  });

  const transaction = new solanaWeb3.Transaction().add(burnIx, memoIx);

  const { blockhash, lastValidBlockHeight } = await getFastBlockhash(connection, "https://api.mainnet-beta.solana.com");

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = owner;

  if (onStageChange) onStageChange('signing');
  if (onLog) onLog('BURN_TX', `Prompting ${type} to sign real Token-2022 burn of ${amount} COOKIE on Solana Mainnet...`, 'text-purple-400');

  const txSignature = await sendWalletTransaction(type, activeProvider, transaction, connection, ownerAddress);

  if (onStageChange) onStageChange('confirming');
  if (onLog) onLog('CONFIRMING', `Transaction broadcast: ${txSignature.slice(0, 16)}... Confirming block on Solana Mainnet...`, 'text-amber-400');

  try {
    const confirmPromise = connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight }, 'confirmed');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('FAST_PATH_TIMEOUT')), 6000));
    await Promise.race([confirmPromise, timeoutPromise]);
  } catch (e) {
    console.info("Mainnet confirm proceeding:", e);
  }

  return txSignature;
}

export function getCookieChainRpcUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/api/v1/cookie/rpc`;
  }
  const endpoint = apiUrl('/api/v1/cookie/rpc');
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return `http://127.0.0.1:8000${endpoint}`;
}

export async function executeCookieChainBurn(
  type: WalletType,
  provider: any,
  ownerAddress: string,
  amount: number,
  onLog?: (tag: string, msg: string, color?: string) => void,
  onStageChange?: (stage: 'preparing' | 'signing' | 'confirming') => void
): Promise<string> {
  if (onStageChange) onStageChange('preparing');
  const activeProvider = await ensureWalletConnected(type, provider);
  const rpcUrl = getCookieChainRpcUrl();
  const connection = new solanaWeb3.Connection(rpcUrl, {
    commitment: "confirmed",
    wsEndpoint: ""
  });
  const owner = new solanaWeb3.PublicKey(ownerAddress);
  const incinerator = new solanaWeb3.PublicKey(CANONICAL_BURN_ADDRESS);

  // Lamports for native COOKIE (9 decimals on Cookie Chain)
  const lamports = Math.round(amount * 1_000_000_000);
  const transferIx = solanaWeb3.SystemProgram.transfer({
    fromPubkey: owner,
    toPubkey: incinerator,
    lamports
  });

  const memoProgramId = new solanaWeb3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
  const memoPayload = `[Cookie Monster Burn] Deflation: Burned ${amount} $COOKIE on Cookie Chain SVM`;
  const memoIx = new solanaWeb3.TransactionInstruction({
    keys: [{ pubkey: owner, isSigner: true, isWritable: true }],
    programId: memoProgramId,
    data: new TextEncoder().encode(memoPayload) as any
  });

  const transaction = new solanaWeb3.Transaction().add(transferIx, memoIx);

  const { blockhash, lastValidBlockHeight } = await getFastBlockhash(connection, "https://rpc.cookiescan.io");

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = owner;

  if (onStageChange) onStageChange('signing');
  if (onLog) onLog('BURN_TX', `Prompting ${type} to sign burn transfer of ${amount} COOKIE to 1nc1nerator on Cookie Chain...`, 'text-purple-400');

  const txSignature = await sendWalletTransaction(type, activeProvider, transaction, connection, ownerAddress);

  if (onStageChange) onStageChange('confirming');
  if (onLog) onLog('CONFIRMING', `Transaction broadcast: ${txSignature.slice(0, 16)}... Confirming on Cookie Chain SVM...`, 'text-amber-400');

  try {
    const confirmPromise = connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight }, 'confirmed');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('FAST_PATH_TIMEOUT')), 6000));
    await Promise.race([confirmPromise, timeoutPromise]);
  } catch (e) {
    console.info("Cookie Chain fast confirm proceeding:", e);
  }

  return txSignature;
}

export const PROTOCOL_TREASURY_VAULT_ADDRESS = "EzXxVuzpaqeTunpaFTZMtmvENzij5BMoP4Lh8zZkfSjh";

export async function executeCookieVaultDeposit(
  type: WalletType,
  provider: any,
  ownerAddress: string,
  amount: number,
  treasuryAddress: string = PROTOCOL_TREASURY_VAULT_ADDRESS,
  onLog?: (tag: string, msg: string, color?: string) => void,
  onStageChange?: (stage: 'preparing' | 'signing' | 'confirming') => void
): Promise<string> {
  if (onStageChange) onStageChange('preparing');
  if (onLog) onLog('WALLET_CHECK', `Verifying active connection with ${type}...`, 'text-cyan-400');

  // 1. Proactively ensure wallet is connected before building transaction
  const activeProvider = await ensureWalletConnected(type, provider);

  const rpcUrl = getCookieChainRpcUrl();
  const connection = new solanaWeb3.Connection(rpcUrl, {
    commitment: "confirmed",
    wsEndpoint: ""
  });
  const owner = new solanaWeb3.PublicKey(ownerAddress);
  const treasury = new solanaWeb3.PublicKey(treasuryAddress);

  // Lamports for native COOKIE (9 decimals on Cookie Chain SVM)
  const lamports = Math.round(amount * 1_000_000_000);
  const transferIx = solanaWeb3.SystemProgram.transfer({
    fromPubkey: owner,
    toPubkey: treasury,
    lamports
  });

  const memoProgramId = new solanaWeb3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
  const memoPayload = `[Cookie Atomic Vault Deposit] Amount: ${amount} $COOKIE from ${ownerAddress.slice(0, 4)}...${ownerAddress.slice(-4)}`;
  const memoIx = new solanaWeb3.TransactionInstruction({
    keys: [{ pubkey: owner, isSigner: true, isWritable: true }],
    programId: memoProgramId,
    data: new TextEncoder().encode(memoPayload) as any
  });

  const transaction = new solanaWeb3.Transaction().add(transferIx, memoIx);

  // 2. Fetch blockhash with ultra-fast timeout (2.5s) & direct fallback
  const { blockhash, lastValidBlockHeight } = await getFastBlockhash(connection, "https://rpc.cookiescan.io");

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = owner;

  if (onStageChange) onStageChange('signing');
  if (onLog) onLog('DEPOSIT_TX', `Prompting ${type} to sign real transfer of ${amount} $COOKIE to Vault Treasury on Cookie Chain...`, 'text-purple-400');

  const txSignature = await sendWalletTransaction(type, activeProvider, transaction, connection, ownerAddress);

  if (onStageChange) onStageChange('confirming');
  if (onLog) onLog('CONFIRMING', `Transaction broadcast: ${txSignature.slice(0, 16)}... Confirming on Cookie Chain SVM...`, 'text-amber-400');

  // 3. Fast bounded confirmation (max 6s) so UI doesn't hang before Zero-Trust verification
  try {
    const confirmPromise = connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight }, 'confirmed');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('FAST_PATH_TIMEOUT')), 6000));
    await Promise.race([confirmPromise, timeoutPromise]);
  } catch (e) {
    console.info("Fast-path confirm proceeding to Zero-Trust RPC check:", e);
  }

  return txSignature;
}


