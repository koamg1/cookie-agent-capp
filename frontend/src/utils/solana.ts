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
    throw new Error(`Proveedor de billetera ${type} no detectado. Asegúrate de tener la extensión instalada y activa.`);
  }

  const isConnected = !!(
    activeProvider.isConnected === true ||
    (activeProvider.publicKey && isValidUserAddress(activeProvider.publicKey.toString()))
  );

  if (!isConnected) {
    console.info(`[Wallet] ${type} no está conectado o la sesión expiró. Reconectando automáticamente...`);
    try {
      if (typeof activeProvider.connect === 'function') {
        await activeProvider.connect({ onlyIfTrusted: false });
      } else if (activeProvider.features && activeProvider.features['standard:connect']) {
        await activeProvider.features['standard:connect'].connect();
      }
    } catch (err: any) {
      console.warn(`[Wallet] ensureWalletConnected reconnect warning on ${type}:`, err);
      const msg = String(err?.message || err);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        throw err;
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

  // Ensure provider is freshly resolved from window and actively connected
  const activeProvider = await ensureWalletConnected(type, provider);

  const isDisconnectError = (err: any) => {
    const msg = String(err?.message || err).toLowerCase();
    return msg.includes('not connected') || msg.includes('disconnected') || msg.includes('user not connected') || msg.includes('session expired');
  };

  // Priority 1: Direct activeProvider.signTransaction (Nightly, Phantom, Solflare, Backpack)
  // This opens the wallet extension popup directly and returns the signed Transaction object
  if (typeof activeProvider.signTransaction === 'function') {
    try {
      const signedTx = await activeProvider.signTransaction(transaction);
      const raw = signedTx.serialize();
      return await connection.sendRawTransaction(raw, { skipPreflight: false });
    } catch (err: any) {
      console.warn(`signTransaction warning on ${type}:`, err);
      const msg = String(err?.message || err);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        throw err;
      }

      // If extension session was idle or dropped, auto-reconnect and retry once immediately
      if (isDisconnectError(err)) {
        try {
          console.info(`[Wallet] Reconnecting ${type} after disconnect error and retrying sign...`);
          if (typeof activeProvider.connect === 'function') {
            await activeProvider.connect({ onlyIfTrusted: false });
          }
          const retrySignedTx = await activeProvider.signTransaction(transaction);
          const raw = retrySignedTx.serialize();
          return await connection.sendRawTransaction(raw, { skipPreflight: false });
        } catch (retryErr: any) {
          const retryMsg = String(retryErr?.message || retryErr);
          if (retryMsg.includes('reject') || retryMsg.includes('cancel') || retryMsg.includes('User rejected')) {
            throw retryErr;
          }
        }
      }
    }
  }

  // Priority 2: Direct activeProvider.signAndSendTransaction
  if (typeof activeProvider.signAndSendTransaction === 'function') {
    try {
      const res = await activeProvider.signAndSendTransaction(transaction);
      if (typeof res === 'string') return res;
      if (res && res.signature) {
        if (typeof res.signature === 'string') return res.signature;
        return new solanaWeb3.PublicKey(res.signature).toBase58();
      }
      return typeof res === 'object' ? (res.txid || JSON.stringify(res)) : String(res);
    } catch (err: any) {
      console.warn(`signAndSendTransaction warning on ${type}:`, err);
      const msg = String(err?.message || err);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        throw err;
      }
    }
  }

  // Priority 3: Solana Wallet Standard features (must pass requireAllSignatures: false for unsigned tx!)
  if (activeProvider.features && activeProvider.features['solana:signTransaction']) {
    try {
      const account = (activeProvider.accounts || []).find((a: any) => a.address === connectedAddress) || activeProvider.accounts?.[0];
      const serializedUnsigned = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
      const [res] = await activeProvider.features['solana:signTransaction'].signTransaction({
        account: account,
        transaction: serializedUnsigned
      });
      if (res && res.signedTransaction) {
        return await connection.sendRawTransaction(res.signedTransaction, { skipPreflight: false });
      }
    } catch (stdErr: any) {
      console.warn(`standard:signTransaction warning on ${type}:`, stdErr);
      const msg = String(stdErr?.message || stdErr);
      if (msg.includes('reject') || msg.includes('cancel') || msg.includes('User rejected')) {
        throw stdErr;
      }
      if (isDisconnectError(stdErr) && activeProvider.features['standard:connect']) {
        try {
          console.info(`[Wallet] Standard wallet reconnecting ${type} and retrying sign...`);
          await activeProvider.features['standard:connect'].connect();
          const account = (activeProvider.accounts || []).find((a: any) => a.address === connectedAddress) || activeProvider.accounts?.[0];
          const serializedUnsigned = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
          const [res] = await activeProvider.features['solana:signTransaction'].signTransaction({
            account: account,
            transaction: serializedUnsigned
          });
          if (res && res.signedTransaction) {
            return await connection.sendRawTransaction(res.signedTransaction, { skipPreflight: false });
          }
        } catch (retryStdErr: any) {
          const retryMsg = String(retryStdErr?.message || retryStdErr);
          if (retryMsg.includes('reject') || retryMsg.includes('cancel') || retryMsg.includes('User rejected')) {
            throw retryStdErr;
          }
        }
      }
    }
  }

  if (activeProvider.features && activeProvider.features['solana:signAndSendTransaction']) {
    const account = (activeProvider.accounts || []).find((a: any) => a.address === connectedAddress) || activeProvider.accounts?.[0];
    const serializedUnsigned = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
    const [res] = await activeProvider.features['solana:signAndSendTransaction'].signAndSendTransaction({
      account: account,
      transaction: serializedUnsigned,
      chain: 'solana:mainnet'
    });
    if (res && res.signature) {
      return new solanaWeb3.PublicKey(res.signature).toBase58();
    }
  }

  throw new Error(`La billetera ${type} no respondió a la solicitud de firma. Abre la extensión, verifica que esté desbloqueada e intenta nuevamente.`);
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
  if (onLog) onLog('WALLET_CHECK', `Verificando conexión activa con ${type}...`, 'text-cyan-400');

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


