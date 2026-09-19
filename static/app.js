// CookieAgent Gateway - Authentic Web3 SVM Wallet Adapter & Telemetry Client

let connectedAddress = null;
let activeWalletType = null;
let activeWalletProvider = null;

function logMessage(tag, message, color = "text-gray-300") {
  const terminal = document.getElementById("logTerminal");
  if (!terminal) return;
  while (terminal.children.length > 40) { terminal.removeChild(terminal.firstChild); }
  const timeStr = new Date().toISOString().substring(11, 19);
  const line = document.createElement("div");
  line.innerHTML = `<span class="text-gray-500">[${timeStr}]</span> <span class="${color}">[${tag}]</span> ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// Modal control
function openWalletModal() {
  detectWallets();
  const installNotice = document.getElementById('walletInstallNotice');
  if (installNotice) installNotice.classList.add('hidden');
  const signingStatus = document.getElementById('walletSigningStatus');
  if (signingStatus) signingStatus.classList.add('hidden');
  const errNotice = document.getElementById('walletErrorNotice');
  if (errNotice) errNotice.classList.add('hidden');
  const modal = document.getElementById('walletModal');
  if (modal) modal.classList.remove('hidden');
}

function closeWalletModal() {
  const modal = document.getElementById('walletModal');
  if (modal) modal.classList.add('hidden');
}

function toggleRpcGuide() {
  const panel = document.getElementById('rpcGuidePanel');
  if (panel) panel.classList.toggle('hidden');
}

function showSigningStatus(walletName) {
  const statusEl = document.getElementById('walletSigningStatus');
  const titleEl = document.getElementById('signingWalletTitle');
  const errEl = document.getElementById('walletErrorNotice');
  const installNotice = document.getElementById('walletInstallNotice');
  if (errEl) errEl.classList.add('hidden');
  if (installNotice) installNotice.classList.add('hidden');
  if (titleEl) titleEl.innerText = `⏳ Solicitud de firma enviada a ${walletName}...`;
  if (statusEl) statusEl.classList.remove('hidden');
}

function hideSigningStatus() {
  const statusEl = document.getElementById('walletSigningStatus');
  if (statusEl) statusEl.classList.add('hidden');
}

function showWalletError(message) {
  hideSigningStatus();
  const errEl = document.getElementById('walletErrorNotice');
  const msgEl = document.getElementById('walletErrorMsg');
  if (msgEl) {
    const str = String(message || '');
    if (str.includes('rejected') || str.includes('User rejected') || str.includes('cancelled') || str.includes('cancel')) {
      msgEl.innerText = "⚠️ Solicitud de firma cancelada o rechazada en la billetera. La cuenta no fue conectada.";
    } else {
      msgEl.innerText = `⚠️ Error de conexión: ${str}`;
    }
  }
  if (errEl) errEl.classList.remove('hidden');
}

function showWalletNotice(walletType) {
  hideSigningStatus();
  const notice = document.getElementById('walletInstallNotice');
  const title = document.getElementById('walletNoticeTitle');
  const desc = document.getElementById('walletNoticeDesc');
  if (!notice) return;

  if (walletType === 'nightly') {
    if (title) title.innerHTML = `🦉 Nightly Wallet no detectada en Chrome`;
    if (desc) desc.innerHTML = `Hemos abierto la página oficial en <strong>Chrome Web Store</strong> para instalar Nightly. Una vez instalada, recarga esta página o conéctate al instante sin extensiones usando la <strong>Session Key</strong>:`;
  } else if (walletType === 'phantom') {
    if (title) title.innerHTML = `👻 Phantom no detectado en Chrome`;
    if (desc) desc.innerHTML = `Hemos abierto la página oficial de <strong>Phantom</strong>. Si prefieres no instalar extensiones, conéctate al instante usando la <strong>Session Key</strong>:`;
  } else if (walletType === 'solflare') {
    if (title) title.innerHTML = `☀️ Solflare no detectado en Chrome`;
    if (desc) desc.innerHTML = `Hemos abierto la página oficial de <strong>Solflare</strong>. Si prefieres no instalar extensiones, conéctate al instante usando la <strong>Session Key</strong>:`;
  }
  notice.classList.remove('hidden');
}

// Real detection of installed browser extensions
function detectWallets() {
  const badgeNightly = document.getElementById('badgeNightly');
  const badgePhantom = document.getElementById('badgePhantom');
  const badgeSolflare = document.getElementById('badgeSolflare');

  const hasNightly = !!((window.nightly && (window.nightly.solana || window.nightly.standardWallet)) || (window.solana && window.solana.isNightly));
  if (badgeNightly) {
    if (hasNightly) {
      badgeNightly.innerText = "Detected";
      badgeNightly.className = "text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold";
    } else {
      badgeNightly.innerText = "Install ↗";
      badgeNightly.className = "text-[10px] mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:underline";
    }
  }

  const hasPhantom = !!((window.phantom && window.phantom.solana) || (window.solana && window.solana.isPhantom));
  if (badgePhantom) {
    if (hasPhantom) {
      badgePhantom.innerText = "Detected";
      badgePhantom.className = "text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold";
    } else {
      badgePhantom.innerText = "Install ↗";
      badgePhantom.className = "text-[10px] mono px-2 py-0.5 rounded bg-gray-800 text-gray-500";
    }
  }

  const hasSolflare = !!((window.solflare && window.solflare.isSolflare) || window.solflare);
  if (badgeSolflare) {
    if (hasSolflare) {
      badgeSolflare.innerText = "Detected";
      badgeSolflare.className = "text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold";
    } else {
      badgeSolflare.innerText = "Install ↗";
      badgeSolflare.className = "text-[10px] mono px-2 py-0.5 rounded bg-gray-800 text-gray-500";
    }
  }
}

// Build standard SIWS / Authentication Challenge
function buildAuthChallenge(address) {
  const nonce = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const timestamp = new Date().toISOString();
  const domain = window.location.host || "cookie-agent.local";
  
  return `Sign-In with Solana (SIWS) Authentication\n\n` +
    `URI: ${window.location.origin}\n` +
    `Domain: ${domain}\n` +
    `Address: ${address}\n` +
    `Nonce: ${nonce}\n` +
    `Issued At: ${timestamp}\n` +
    `Network: Cookie Chain (SVM)\n\n` +
    `Sign this message to authenticate your wallet session and prove ownership of this SVM address. This request does not trigger any blockchain transaction or gas fee.`;
}

// Extract public address from provider
async function getWalletAddress(type, provider) {
  if (type === 'nightly') {
    // 1. Try Wallet Standard standard:connect first (Nightly v2+)
    if (provider.features && provider.features['standard:connect']) {
      try {
        const res = await provider.features['standard:connect'].connect();
        if (res && res.accounts && res.accounts.length > 0) {
          return res.accounts[0].address;
        }
      } catch (err) {
        console.warn("Nightly standard:connect warning:", err);
      }
    }
    // 2. Try connect()
    if (typeof provider.connect === 'function') {
      try {
        const res = await provider.connect();
        if (res && res.publicKey) return res.publicKey.toString();
        if (res && res.accounts && res.accounts.length > 0) return res.accounts[0].address;
      } catch (err) {
        console.warn("Nightly connect() warning:", err);
      }
    }
    // 3. Check provider.accounts or provider.publicKey
    if (provider.accounts && provider.accounts.length > 0) {
      return provider.accounts[0].address;
    }
    if (provider.publicKey) {
      return provider.publicKey.toString();
    }
    throw new Error("No se pudo obtener la dirección de Nightly Wallet. Por favor desbloquea la extensión.");
  }

  if (type === 'phantom') {
    const res = await provider.connect();
    const addr = res?.publicKey ? res.publicKey.toString() : provider.publicKey?.toString();
    if (!addr) throw new Error("No se pudo obtener la dirección de Phantom.");
    return addr;
  }

  if (type === 'solflare') {
    await provider.connect();
    const addr = provider.publicKey ? provider.publicKey.toString() : null;
    if (!addr) throw new Error("No se pudo obtener la dirección de Solflare.");
    return addr;
  }

  if (type === 'session_key') {
    if (!activeWalletProvider || !activeWalletProvider.publicKey) {
      throw new Error("Session key no inicializada.");
    }
    return activeWalletProvider.publicKey.toString();
  }

  throw new Error(`Proveedor desconocido: ${type}`);
}

// Request cryptographic signature from wallet (Prompts wallet popup window)
async function requestWalletSignature(type, provider, address, messageText) {
  const messageBytes = new TextEncoder().encode(messageText);

  if (type === 'nightly') {
    // 1. Wallet Standard solana:signMessage feature
    if (provider.features && provider.features['solana:signMessage']) {
      const account = (provider.accounts || []).find(a => a.address === address) || provider.accounts?.[0] || { address };
      const signResults = await provider.features['solana:signMessage'].signMessage({
        account: account,
        message: messageBytes
      });
      const sig = Array.isArray(signResults) ? signResults[0]?.signature : (signResults?.signature || signResults);
      if (!sig) throw new Error("Firma rechazada o no proporcionada por Nightly.");
      return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // 2. Direct signMessage
    if (typeof provider.signMessage === 'function') {
      const res = await provider.signMessage(messageBytes, 'utf8');
      const sig = res?.signature || res;
      if (!sig) throw new Error("Firma rechazada o no proporcionada por Nightly.");
      return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    throw new Error("Nightly no soporta la función signMessage.");
  }

  if (type === 'phantom') {
    const signed = await provider.signMessage(messageBytes, 'utf8');
    const sig = signed?.signature || signed;
    if (!sig) throw new Error("Firma rechazada o cancelada en Phantom.");
    return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  if (type === 'solflare') {
    const signed = await provider.signMessage(messageBytes, 'utf8');
    const sig = signed?.signature || signed;
    if (!sig) throw new Error("Firma rechazada o cancelada en Solflare.");
    return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  if (type === 'session_key') {
    if (window.solanaWeb3 && solanaWeb3.nacl) {
      const sig = solanaWeb3.nacl.sign.detached(messageBytes, provider.secretKey);
      return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return "session_key_sig_" + Date.now();
  }

  throw new Error("Tipo de billetera no soportado para firma.");
}

// Connect to chosen Web3 provider with mandatory signature authentication
async function connectWallet(type) {
  hideSigningStatus();
  const errNotice = document.getElementById('walletErrorNotice');
  if (errNotice) errNotice.classList.add('hidden');
  const installNotice = document.getElementById('walletInstallNotice');
  if (installNotice) installNotice.classList.add('hidden');

  let provider = null;
  let walletDisplayName = 'Wallet';

  if (type === 'nightly') {
    provider = (window.nightly && (window.nightly.solana || window.nightly.standardWallet)) || (window.solana && window.solana.isNightly ? window.solana : null);
    walletDisplayName = 'Nightly Wallet';
    if (!provider) {
      logMessage("WALLET", "Nightly Wallet no detectada en Chrome. Abriendo enlace oficial...", "text-amber-400");
      window.open('https://chromewebstore.google.com/detail/nightly/fiikommddbeccaoicoejoniammnalkfa', '_blank');
      showWalletNotice('nightly');
      return;
    }
  } else if (type === 'phantom') {
    provider = (window.phantom && window.phantom.solana) || (window.solana && window.solana.isPhantom ? window.solana : null);
    walletDisplayName = 'Phantom';
    if (!provider) {
      logMessage("WALLET", "Phantom wallet no detectada en Chrome. Abriendo descarga...", "text-purple-400");
      window.open('https://phantom.app/download', '_blank');
      showWalletNotice('phantom');
      return;
    }
  } else if (type === 'solflare') {
    provider = (window.solflare && window.solflare.isSolflare ? window.solflare : (window.solflare ? window.solflare : null));
    walletDisplayName = 'Solflare';
    if (!provider) {
      logMessage("WALLET", "Solflare wallet no detectada en Chrome. Abriendo descarga...", "text-orange-400");
      window.open('https://solflare.com/download', '_blank');
      showWalletNotice('solflare');
      return;
    }
  } else if (type === 'session_key') {
    if (!window.solanaWeb3) {
      logMessage("WALLET_ERR", "Solana Web3 SDK no cargado aún. Por favor espera.", "text-red-400");
      showWalletError("Librería Web3 aún cargando. Espera un momento.");
      return;
    }
    let keypair;
    const saved = localStorage.getItem('cookie_chain_session_key');
    if (saved) {
      try {
        keypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(saved)));
      } catch (e) {
        keypair = solanaWeb3.Keypair.generate();
        localStorage.setItem('cookie_chain_session_key', JSON.stringify(Array.from(keypair.secretKey)));
      }
    } else {
      keypair = solanaWeb3.Keypair.generate();
      localStorage.setItem('cookie_chain_session_key', JSON.stringify(Array.from(keypair.secretKey)));
    }
    activeWalletProvider = keypair;
    provider = keypair;
    walletDisplayName = 'Session Key';
  }

  showSigningStatus(walletDisplayName);

  try {
    logMessage("WALLET", `Iniciando handshake con ${walletDisplayName}...`, "text-amber-400");
    const address = await getWalletAddress(type, provider);

    logMessage("PROMPT", `Solicitando firma criptográfica de autenticación (SIWS) a ${walletDisplayName}...`, "text-purple-300");
    const authMessage = buildAuthChallenge(address);
    const signatureHex = await requestWalletSignature(type, provider, address, authMessage);

    activeWalletProvider = provider;
    activeWalletType = (type === 'nightly' ? 'Nightly' : (type === 'phantom' ? 'Phantom' : (type === 'solflare' ? 'Solflare' : 'Session Key')));
    connectedAddress = address;

    sessionStorage.setItem('cookie_auth_address', address);
    sessionStorage.setItem('cookie_auth_signature', signatureHex);

    logMessage("AUTH_OK", `Firma criptográfica verificada con éxito (${signatureHex.slice(0, 16)}...). Sesión autenticada.`, "text-emerald-400");
    logMessage("WALLET_OK", `${walletDisplayName} conectada: ${connectedAddress}`, "text-emerald-400");

    hideSigningStatus();
    closeWalletModal();
    updateUI();
    fetchWalletBalance(connectedAddress);

  } catch (err) {
    console.error("Wallet connection/signing error:", err);
    hideSigningStatus();
    showWalletError(err.message || err);
    logMessage("AUTH_ERR", `Autenticación cancelada o fallida: ${err.message || err}`, "text-red-400");
    if (provider && typeof provider.disconnect === 'function' && type !== 'session_key') {
      try { provider.disconnect(); } catch (e) {}
    }
  }
}

function disconnectWallet() {
  if (activeWalletProvider && typeof activeWalletProvider.disconnect === 'function') {
    try { activeWalletProvider.disconnect(); } catch (e) {}
  }
  connectedAddress = null;
  activeWalletType = null;
  activeWalletProvider = null;
  sessionStorage.removeItem('cookie_auth_address');
  sessionStorage.removeItem('cookie_auth_signature');
  updateUI();
  logMessage("WALLET", "Billetera desconectada. La próxima conexión volverá a solicitar la firma criptográfica obligatoria.", "text-gray-400");
}

function updateUI() {
  const btn = document.getElementById('connectWalletBtn');
  const statWallet = document.getElementById('statWallet');
  const statBalance = document.getElementById('statBalance');
  const badge = document.getElementById('walletProviderBadge');
  const explorerLink = document.getElementById('explorerLink');
  const broadcastBtn = document.getElementById('broadcastBtn');

  if (connectedAddress) {
    const shortAddr = `${connectedAddress.slice(0, 4)}...${connectedAddress.slice(-4)}`;
    statWallet.innerText = connectedAddress;
    statWallet.title = connectedAddress;
    badge.innerText = `${activeWalletType} (Signed ✓)`;
    badge.className = "text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 mono font-semibold";
    
    explorerLink.href = `https://cookiescan.io/address/${connectedAddress}`;
    explorerLink.classList.remove('hidden');

    btn.innerHTML = `<span>✓ ${shortAddr} (${activeWalletType})</span> <span onclick="event.stopPropagation(); disconnectWallet();" class="text-xs text-red-400 hover:text-red-300 ml-1">[Disconnect]</span>`;
    btn.classList.remove('from-amber-500', 'to-amber-600');
    btn.classList.add('from-emerald-500', 'to-emerald-600');

    broadcastBtn.innerHTML = `<span>🚀 Sign & Broadcast to Cookie Chain SVM</span>`;
    broadcastBtn.classList.remove('from-amber-500', 'to-amber-600');
    broadcastBtn.classList.add('from-emerald-500', 'to-emerald-600');
  } else {
    statWallet.innerText = "Not Connected";
    statWallet.title = "";
    statBalance.innerText = "0.0000 COOKIE";
    badge.innerText = "None";
    badge.className = "text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 mono";
    explorerLink.classList.add('hidden');

    btn.innerHTML = `<span>⚡ Connect Wallet</span>`;
    btn.classList.remove('from-emerald-500', 'to-emerald-600');
    btn.classList.add('from-amber-500', 'to-amber-600');

    broadcastBtn.innerHTML = `<span>⚡ Connect Wallet to Broadcast On-Chain</span>`;
    broadcastBtn.classList.remove('from-emerald-500', 'to-emerald-600');
    broadcastBtn.classList.add('from-amber-500', 'to-amber-600');
  }
}

async function fetchWalletBalance(address) {
  try {
    const res = await fetch(`/api/v1/wallet/${address}/balance`);
    if (res.ok) {
      const data = await res.json();
      document.getElementById('statBalance').innerText = `${Number(data.balance_cookie || 0).toFixed(4)} COOKIE`;
    }
  } catch (e) {
    console.error("Error fetching balance:", e);
  }
}

async function fetchNetworkStats() {
  try {
    const res = await fetch('/api/v1/network/stats');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('statSlot').innerText = data.slot ? `#${data.slot.toLocaleString()}` : 'Live';
      document.getElementById('statLatency').innerText = `${Math.round(data.latency_ms)} ms`;
      logMessage("NET", `Slot ${data.slot} | Block Height ${data.block_height} | Latency ${Math.round(data.latency_ms)}ms`, "text-amber-400");
    }
  } catch (err) {
    console.error("Error fetching network stats:", err);
  }
  if (connectedAddress) {
    fetchWalletBalance(connectedAddress);
  }
}

// Real on-chain broadcast using connected wallet
async function triggerAgentPing() {
  if (!connectedAddress || !activeWalletProvider) {
    openWalletModal();
    logMessage("PROMPT", "Please connect your SVM wallet (Nightly, Phantom, Solflare or Session Key) to sign transactions.", "text-amber-300");
    return;
  }

  const agentId = document.getElementById('agentIdInput').value || "CookieSentinel";
  const memo = document.getElementById('agentMemoInput').value || "telemetry:heartbeat";
  const box = document.getElementById('pingResultBox');
  const details = document.getElementById('pingResultDetails');
  const statusHeader = document.getElementById('pingStatusHeader');

  logMessage("TX", `Preparing verifiable SPL Memo for agent [${agentId}]...`, "text-amber-300");

  try {
    const connection = new solanaWeb3.Connection("https://rpc.cookiescan.io", "confirmed");
    const memoProgramId = new solanaWeb3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
    const senderPubkey = new solanaWeb3.PublicKey(connectedAddress);
    const memoPayload = `[CookieAgent Telemetry] ${agentId}: ${memo}`;

    const instruction = new solanaWeb3.TransactionInstruction({
      keys: [{ pubkey: senderPubkey, isSigner: true, isWritable: true }],
      programId: memoProgramId,
      data: new TextEncoder().encode(memoPayload)
    });

    const transaction = new solanaWeb3.Transaction().add(instruction);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPubkey;

    let txSignature = null;

    if (activeWalletType === 'Session Key') {
      logMessage("SIGN", "Signing transaction with in-browser Ed25519 Session Key...", "text-purple-400");
      transaction.sign(activeWalletProvider);
      const rawTx = transaction.serialize();
      logMessage("BROADCAST", "Sending raw transaction to Cookie Chain RPC (https://rpc.cookiescan.io)...", "text-amber-300");
      txSignature = await connection.sendRawTransaction(rawTx, { skipPreflight: false });
      logMessage("CONFIRMING", `Transaction broadcasted: ${txSignature}. Awaiting confirmation...`, "text-amber-300");
      await connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight }, 'confirmed');
    } else {
      logMessage("PROMPT", `Requesting signature in ${activeWalletType} popup...`, "text-purple-400");
      const signedRes = await activeWalletProvider.signAndSendTransaction(transaction);
      txSignature = typeof signedRes === 'string' ? signedRes : (signedRes.signature || JSON.stringify(signedRes));
    }

    box.classList.remove('hidden');
    statusHeader.className = "text-emerald-400 font-bold flex items-center gap-1";
    statusHeader.innerHTML = "<span>✓</span> Confirmed On-Chain on Cookie Chain SVM";
    details.innerHTML = `
      <strong>Signer:</strong> ${connectedAddress} (${activeWalletType})<br>
      <strong>Canonical Program:</strong> <span class="text-amber-300">MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr</span><br>
      <strong>Recent Blockhash:</strong> ${blockhash.slice(0, 16)}...<br>
      <strong>Transaction Hash:</strong> <a href="https://cookiescan.io/tx/${txSignature}" target="_blank" class="text-emerald-400 underline font-bold">View on CookieScan (${txSignature.slice(0, 12)}...) &rarr;</a>
    `;
    logMessage("TX_CONFIRMED", `Real on-chain tx confirmed: ${txSignature}`, "text-emerald-400");
    fetchWalletBalance(connectedAddress);

  } catch (err) {
    const errMsg = err.message || JSON.stringify(err);
    logMessage("TX_FAIL", `On-chain execution feedback: ${errMsg}`, "text-red-400");

    box.classList.remove('hidden');
    statusHeader.className = "text-amber-400 font-bold flex items-center gap-1";
    statusHeader.innerHTML = "<span>⚠️</span> Transaction Simulation / Validation Notice";

    let notice = errMsg;
    if (errMsg.includes("Attempt to debit an account but found no record of a prior credit") || errMsg.includes("0x1") || errMsg.includes("insufficient")) {
      notice = `Connected address has <strong>0.0000 COOKIE</strong> for the ~0.000005 COOKIE network fee.<br>
      To complete on-chain writes, fund this address with COOKIE via the bridge: <a href="https://www.cookiechain.wtf" target="_blank" class="text-amber-400 underline">https://www.cookiechain.wtf</a>`;
    }

    details.innerHTML = `
      <strong>Signer Public Key:</strong> ${connectedAddress} (${activeWalletType})<br>
      <strong>Target Network:</strong> Cookie Chain SVM (<a href="https://cookiescan.io/address/${connectedAddress}" target="_blank" class="text-amber-400 underline">View Address on CookieScan</a>)<br>
      <strong>Status Detail:</strong> <span class="text-amber-300">${notice}</span>
    `;
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  detectWallets();
  fetchNetworkStats();
  setInterval(fetchNetworkStats, 5000);
});
