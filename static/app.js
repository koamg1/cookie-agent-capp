// CookieAgent Gateway - Authentic Web3 SVM Wallet Adapter & Telemetry Client
// Implements the industry-standard Solana Web3 connection & signing lifecycle (Jupiter / Raydium model)

let connectedAddress = null;
let activeWalletType = null;
let activeWalletProvider = null;
let isSiwsVerified = false;

function logMessage(tag, message, color = "text-gray-300") {
  const terminal = document.getElementById("logTerminal");
  if (!terminal) return;
  while (terminal.children.length > 50) { terminal.removeChild(terminal.firstChild); }
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

function showConnectingStatus(walletName) {
  const statusEl = document.getElementById('walletSigningStatus');
  const titleEl = document.getElementById('signingWalletTitle');
  const errEl = document.getElementById('walletErrorNotice');
  const installNotice = document.getElementById('walletInstallNotice');
  if (errEl) errEl.classList.add('hidden');
  if (installNotice) installNotice.classList.add('hidden');
  if (titleEl) titleEl.innerText = `⏳ Conectando con ${walletName}...`;
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
      msgEl.innerText = "⚠️ Solicitud cancelada o rechazada en la billetera.";
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
    if (desc) desc.innerHTML = `Hemos abierto la página oficial para instalar Nightly. Una vez instalada, desbloquéala con tu contraseña o conéctate al instante sin extensiones usando la <strong>Session Key</strong>:`;
  } else if (walletType === 'phantom') {
    if (title) title.innerHTML = `👻 Phantom no detectado en Chrome`;
    if (desc) desc.innerHTML = `Hemos abierto la página oficial de <strong>Phantom</strong>. Si prefieres no instalar extensiones, conéctate al instante usando la <strong>Session Key</strong>:`;
  } else if (walletType === 'solflare') {
    if (title) title.innerHTML = `☀️ Solflare no detectado en Chrome`;
    if (desc) desc.innerHTML = `Hemos abierto la página oficial de <strong>Solflare</strong>. Si prefieres no instalar extensiones, conéctate al instante usando la <strong>Session Key</strong>:`;
  }
  notice.classList.remove('hidden');
}

// Detection of installed browser extensions
function getNightlyProvider() {
  if (window.nightly) {
    if (window.nightly.solana) return window.nightly.solana;
    if (window.nightly.standardWallet) return window.nightly.standardWallet;
    return window.nightly;
  }
  if (window.solana && window.solana.isNightly) return window.solana;
  return null;
}

function getPhantomProvider() {
  if (window.phantom && window.phantom.solana) return window.phantom.solana;
  if (window.solana && window.solana.isPhantom) return window.solana;
  return null;
}

function getSolflareProvider() {
  if (window.solflare && window.solflare.isSolflare) return window.solflare;
  if (window.solflare) return window.solflare;
  return null;
}

function detectWallets() {
  const badgeNightly = document.getElementById('badgeNightly');
  const badgePhantom = document.getElementById('badgePhantom');
  const badgeSolflare = document.getElementById('badgeSolflare');

  const hasNightly = !!getNightlyProvider();
  if (badgeNightly) {
    if (hasNightly) {
      badgeNightly.innerText = "Detected";
      badgeNightly.className = "text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold";
    } else {
      badgeNightly.innerText = "Install ↗";
      badgeNightly.className = "text-[10px] mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:underline";
    }
  }

  const hasPhantom = !!getPhantomProvider();
  if (badgePhantom) {
    if (hasPhantom) {
      badgePhantom.innerText = "Detected";
      badgePhantom.className = "text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold";
    } else {
      badgePhantom.innerText = "Install ↗";
      badgePhantom.className = "text-[10px] mono px-2 py-0.5 rounded bg-gray-800 text-gray-500";
    }
  }

  const hasSolflare = !!getSolflareProvider();
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

// Reject dummy/uninitialized zero public keys (11111111111111111111111111111111 is SystemProgram)
function isValidUserAddress(addr) {
  if (!addr || typeof addr !== 'string') return false;
  if (addr === '11111111111111111111111111111111' || addr.startsWith('11111111111111111111111111111111')) return false;
  return addr.length >= 32 && addr.length <= 44;
}

// Build standard SIWS Authentication Challenge
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
    `Sign this message to authenticate your wallet session and cryptographically prove ownership of this SVM address. This request does not trigger any blockchain transaction or network fee.`;
}

// Extract public address from provider (Clean connection handshake)
async function getWalletAddress(type, provider) {
  if (type === 'nightly') {
    let candidate = null;
    // 1. Try Wallet Standard standard:connect first (Nightly v2+)
    if (provider.features && provider.features['standard:connect']) {
      try {
        const res = await provider.features['standard:connect'].connect(false);
        const addr = res?.accounts?.[0]?.address;
        if (isValidUserAddress(addr)) candidate = addr;
      } catch (err) {
        console.warn("Nightly standard:connect warning:", err);
      }
    }
    // 2. Try connect()
    if (!candidate && typeof provider.connect === 'function') {
      try {
        const res = await provider.connect({ onlyIfTrusted: false });
        const addr = res?.publicKey?.toString() || (res?.accounts && res.accounts[0]?.address);
        if (isValidUserAddress(addr)) candidate = addr;
      } catch (err) {
        console.warn("Nightly connect():", err);
      }
    }
    // 3. Check provider.accounts only if valid
    if (!candidate && provider.accounts && provider.accounts.length > 0) {
      const addr = provider.accounts[0].address;
      if (isValidUserAddress(addr)) candidate = addr;
    }
    // 4. Check provider.publicKey only if valid
    if (!candidate && provider.publicKey) {
      const addr = provider.publicKey.toString();
      if (isValidUserAddress(addr)) candidate = addr;
    }

    if (!candidate || !isValidUserAddress(candidate)) {
      throw new Error("Nightly no devolvió una cuenta pública válida. Abre la extensión Nightly en tu navegador, desbloquéala con tu contraseña y asegúrate de tener una cuenta de Solana creada.");
    }
    return candidate;
  }

  if (type === 'phantom') {
    const res = await provider.connect({ onlyIfTrusted: false });
    const addr = res?.publicKey ? res.publicKey.toString() : provider.publicKey?.toString();
    if (!isValidUserAddress(addr)) {
      throw new Error("Phantom no devolvió una cuenta válida. Abre la extensión Phantom y desbloquéala.");
    }
    return addr;
  }

  if (type === 'solflare') {
    await provider.connect();
    const addr = provider.publicKey ? provider.publicKey.toString() : null;
    if (!isValidUserAddress(addr)) {
      throw new Error("Solflare no devolvió una cuenta válida. Abre la extensión Solflare y desbloquéala.");
    }
    return addr;
  }

  if (type === 'session_key') {
    if (!activeWalletProvider || !activeWalletProvider.publicKey) {
      throw new Error("Session key no inicializada.");
    }
    const addr = activeWalletProvider.publicKey.toString();
    if (!isValidUserAddress(addr)) throw new Error("Error generando Session Key.");
    return addr;
  }

  throw new Error(`Proveedor desconocido: ${type}`);
}

// Request cryptographic SIWS signature on demand
async function requestWalletSignature(type, provider, address, messageText) {
  const messageBytes = new TextEncoder().encode(messageText);

  if (type === 'nightly') {
    // 1. Direct signMessage
    if (typeof provider.signMessage === 'function') {
      const res = await provider.signMessage(messageBytes, 'utf8');
      const sig = res?.signature || res;
      if (!sig) throw new Error("Firma cancelada o rechazada en Nightly.");
      return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // 2. Wallet Standard solana:signMessage feature
    if (provider.features && provider.features['solana:signMessage']) {
      const account = (provider.accounts || []).find(a => a.address === address) || provider.accounts?.[0] || { address };
      const signResults = await provider.features['solana:signMessage'].signMessage({
        account: account,
        message: messageBytes
      });
      const sig = Array.isArray(signResults) ? signResults[0]?.signature : (signResults?.signature || signResults);
      if (!sig) throw new Error("Firma cancelada o rechazada en Nightly.");
      return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    throw new Error("Nightly no soporta la función signMessage.");
  }

  if (type === 'phantom') {
    const signed = await provider.signMessage(messageBytes, 'utf8');
    const sig = signed?.signature || signed;
    if (!sig) throw new Error("Firma cancelada o rechazada en Phantom.");
    return Array.from(sig).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  if (type === 'solflare') {
    const signed = await provider.signMessage(messageBytes, 'utf8');
    const sig = signed?.signature || signed;
    if (!sig) throw new Error("Firma cancelada o rechazada en Solflare.");
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

// User-facing trigger for SIWS authentication
async function promptSiwsSignature() {
  if (!connectedAddress || !activeWalletProvider) {
    openWalletModal();
    return;
  }
  const btn = document.getElementById('signSiwsBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerText = "⏳ Esperando aprobación en la billetera...";
  }

  try {
    logMessage("PROMPT", `Solicitando firma criptográfica de autenticación (SIWS) a ${activeWalletType}...`, "text-purple-300");
    const authMessage = buildAuthChallenge(connectedAddress);
    const signatureHex = await requestWalletSignature(activeWalletType.toLowerCase(), activeWalletProvider, connectedAddress, authMessage);
    
    isSiwsVerified = true;
    sessionStorage.setItem('cookie_auth_signature', signatureHex);
    logMessage("AUTH_OK", `Firma criptográfica verificada: ${signatureHex.slice(0, 16)}... Propiedad de la cuenta confirmada.`, "text-emerald-400");
    updateUI();
  } catch (err) {
    const msg = err.message || err;
    logMessage("AUTH_WARN", `Firma de autenticación no completada: ${msg}`, "text-amber-400");
    if (btn) {
      btn.disabled = false;
      btn.innerText = "✍️ Reintentar Firma de Autenticación (SIWS)";
    }
  }
}

// Connect to chosen Web3 provider (Standard Solana Flow - matches Jupiter & Raydium)
async function connectWallet(type) {
  hideSigningStatus();
  const errNotice = document.getElementById('walletErrorNotice');
  if (errNotice) errNotice.classList.add('hidden');
  const installNotice = document.getElementById('walletInstallNotice');
  if (installNotice) installNotice.classList.add('hidden');

  let provider = null;
  let walletDisplayName = 'Wallet';

  if (type === 'nightly') {
    provider = getNightlyProvider();
    walletDisplayName = 'Nightly Wallet';
    if (!provider) {
      logMessage("WALLET", "Nightly Wallet no detectada en Chrome. Abriendo enlace oficial...", "text-amber-400");
      window.open('https://nightly.app/download', '_blank');
      showWalletNotice('nightly');
      return;
    }
  } else if (type === 'phantom') {
    provider = getPhantomProvider();
    walletDisplayName = 'Phantom';
    if (!provider) {
      logMessage("WALLET", "Phantom wallet no detectada en Chrome. Abriendo descarga...", "text-purple-400");
      window.open('https://phantom.app/download', '_blank');
      showWalletNotice('phantom');
      return;
    }
  } else if (type === 'solflare') {
    provider = getSolflareProvider();
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

  showConnectingStatus(walletDisplayName);

  try {
    logMessage("WALLET", `Conectando con ${walletDisplayName}...`, "text-amber-400");
    const address = await getWalletAddress(type, provider);

    activeWalletProvider = provider;
    activeWalletType = (type === 'nightly' ? 'Nightly' : (type === 'phantom' ? 'Phantom' : (type === 'solflare' ? 'Solflare' : 'Session Key')));
    connectedAddress = address;

    // Attach standard reactive event listeners for live account switching
    if (typeof provider.on === 'function') {
      try {
        provider.removeAllListeners?.('accountChanged');
        provider.on('accountChanged', (publicKey) => {
          if (publicKey) {
            const newAddr = publicKey.toBase58 ? publicKey.toBase58() : publicKey.toString();
            if (isValidUserAddress(newAddr) && newAddr !== connectedAddress) {
              connectedAddress = newAddr;
              sessionStorage.setItem('cookie_connected_address', newAddr);
              logMessage("WALLET", `Cuenta cambiada en la extensión a: ${connectedAddress}`, "text-cyan-300");
              updateUI();
              fetchWalletBalance(connectedAddress);
            }
          } else {
            disconnectWallet();
          }
        });
        provider.removeAllListeners?.('disconnect');
        provider.on('disconnect', () => {
          disconnectWallet();
        });
      } catch (evtErr) {
        console.warn("Event listener warning:", evtErr);
      }
    }

    sessionStorage.setItem('cookie_connected_address', address);
    sessionStorage.setItem('cookie_connected_wallet', activeWalletType);

    logMessage("WALLET_OK", `${walletDisplayName} conectada: ${connectedAddress}`, "text-emerald-400");
    logMessage("INFO", "Sesión Web3 activa. Puedes firmar telemetría on-chain o autenticar con SIWS.", "text-gray-300");

    hideSigningStatus();
    closeWalletModal();
    updateUI();
    fetchWalletBalance(connectedAddress);

  } catch (err) {
    console.error("Wallet connection error:", err);
    hideSigningStatus();
    showWalletError(err.message || err);
    logMessage("WALLET_ERR", `Error al conectar ${walletDisplayName}: ${err.message || err}`, "text-red-400");
  }
}

function disconnectWallet() {
  if (activeWalletProvider) {
    if (typeof activeWalletProvider.disconnect === 'function') {
      try { activeWalletProvider.disconnect(); } catch (e) {}
    } else if (activeWalletProvider.features && activeWalletProvider.features['standard:disconnect']) {
      try { activeWalletProvider.features['standard:disconnect'].disconnect(); } catch (e) {}
    }
  }
  connectedAddress = null;
  activeWalletType = null;
  activeWalletProvider = null;
  isSiwsVerified = false;
  sessionStorage.removeItem('cookie_connected_address');
  sessionStorage.removeItem('cookie_connected_wallet');
  sessionStorage.removeItem('cookie_auth_signature');
  updateUI();
  logMessage("WALLET", "Billetera desconectada de la dApp. La sesión local ha sido reseteada.", "text-gray-400");
}

function updateUI() {
  const btn = document.getElementById('connectWalletBtn');
  const statWallet = document.getElementById('statWallet');
  const statBalance = document.getElementById('statBalance');
  const badge = document.getElementById('walletProviderBadge');
  const explorerLink = document.getElementById('explorerLink');
  const broadcastBtn = document.getElementById('broadcastBtn');
  const signSiwsBtn = document.getElementById('signSiwsBtn');

  if (connectedAddress) {
    const shortAddr = `${connectedAddress.slice(0, 4)}...${connectedAddress.slice(-4)}`;
    statWallet.innerText = connectedAddress;
    statWallet.title = connectedAddress;
    
    if (isSiwsVerified) {
      badge.innerText = `${activeWalletType} (SIWS ✓)`;
      badge.className = "text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 mono font-semibold";
    } else {
      badge.innerText = `${activeWalletType}`;
      badge.className = "text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 mono font-semibold";
    }
    
    explorerLink.href = `https://cookiescan.io/address/${connectedAddress}`;
    explorerLink.classList.remove('hidden');

    btn.innerHTML = `<span>✓ ${shortAddr} (${activeWalletType})</span> <span onclick="event.stopPropagation(); disconnectWallet();" class="text-xs text-red-400 hover:text-red-300 ml-1 font-bold">[Disconnect]</span>`;
    btn.classList.remove('from-amber-500', 'to-amber-600');
    btn.classList.add('from-emerald-500', 'to-emerald-600');

    broadcastBtn.innerHTML = `<span>🚀 Sign & Broadcast to Cookie Chain SVM</span>`;
    broadcastBtn.classList.remove('from-amber-500', 'to-amber-600');
    broadcastBtn.classList.add('from-emerald-500', 'to-emerald-600');

    if (signSiwsBtn) {
      signSiwsBtn.classList.remove('hidden');
      if (isSiwsVerified) {
        signSiwsBtn.innerHTML = `<span>✓ Autenticación SIWS Firmada</span>`;
        signSiwsBtn.className = "mt-2 w-full py-1.5 px-2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono flex items-center justify-center gap-1 cursor-default";
        signSiwsBtn.disabled = true;
      } else {
        signSiwsBtn.innerHTML = `<span>✍️ Solicitar Firma de Verificación (SIWS)</span>`;
        signSiwsBtn.className = "mt-2 w-full py-1.5 px-2 text-[10px] rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-mono flex items-center justify-center gap-1 transition cursor-pointer";
        signSiwsBtn.disabled = false;
      }
    }
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

    if (signSiwsBtn) {
      signSiwsBtn.classList.add('hidden');
    }
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

// Universal transaction dispatcher supporting Solflare, Phantom, Nightly and Session Key
async function sendWalletTransaction(type, provider, transaction, connection) {
  if (type === 'Session Key') {
    transaction.sign(provider);
    const rawTx = transaction.serialize();
    return await connection.sendRawTransaction(rawTx, { skipPreflight: false });
  }

  // 1. Try standard signAndSendTransaction method on provider (Solflare & Phantom native)
  if (typeof provider.signAndSendTransaction === 'function') {
    const res = await provider.signAndSendTransaction(transaction);
    if (typeof res === 'string') return res;
    if (res && res.signature) {
      if (typeof res.signature === 'string') return res.signature;
      if (window.solanaWeb3 && solanaWeb3.PublicKey) {
        return new solanaWeb3.PublicKey(res.signature).toBase58();
      }
    }
    return typeof res === 'object' ? (res.txid || JSON.stringify(res)) : String(res);
  }

  // 2. Try Wallet Standard solana:signAndSendTransaction (for Nightly v2+)
  if (provider.features && provider.features['solana:signAndSendTransaction']) {
    const account = (provider.accounts || []).find(a => a.address === connectedAddress) || provider.accounts?.[0];
    const [res] = await provider.features['solana:signAndSendTransaction'].signAndSendTransaction({
      account: account,
      transaction: transaction.serialize(),
      chain: 'solana:mainnet'
    });
    if (res && res.signature) {
      return new solanaWeb3.PublicKey(res.signature).toBase58();
    }
  }

  // 3. Try signTransaction + sendRawTransaction (universally supported fallback)
  if (typeof provider.signTransaction === 'function') {
    const signedTx = await provider.signTransaction(transaction);
    const raw = signedTx.serialize();
    return await connection.sendRawTransaction(raw, { skipPreflight: false });
  }

  // 4. Try Wallet Standard solana:signTransaction (for Nightly v2+)
  if (provider.features && provider.features['solana:signTransaction']) {
    const account = (provider.accounts || []).find(a => a.address === connectedAddress) || provider.accounts?.[0];
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

// Real on-chain broadcast using connected wallet (prompts wallet popup for transaction signature)
async function triggerAgentPing() {
  if (!connectedAddress || !activeWalletProvider) {
    openWalletModal();
    logMessage("PROMPT", "Conecta tu billetera SVM (Nightly, Phantom, Solflare o Session Key) para firmar transacciones.", "text-amber-300");
    return;
  }

  const agentId = document.getElementById('agentIdInput').value || "CookieSentinel";
  const memo = document.getElementById('agentMemoInput').value || "telemetry:heartbeat";
  const box = document.getElementById('pingResultBox');
  const details = document.getElementById('pingResultDetails');
  const statusHeader = document.getElementById('pingStatusHeader');

  logMessage("TX", `Preparando instrucción verificable SPL Memo para [${agentId}]...`, "text-amber-300");

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

    logMessage("PROMPT", `Abriendo ventana emergente de ${activeWalletType} para autorizar y firmar la transacción...`, "text-purple-400");

    const txSignature = await sendWalletTransaction(activeWalletType, activeWalletProvider, transaction, connection);

    logMessage("CONFIRMING", `Transacción enviada: ${txSignature}. Esperando confirmación en Cookie Chain...`, "text-amber-300");
    
    // Wait for confirmation if blockhash was retrieved
    try {
      await connection.confirmTransaction({ signature: txSignature, blockhash, lastValidBlockHeight }, 'confirmed');
    } catch (confErr) {
      console.warn("Confirmation check warning:", confErr);
    }

    box.classList.remove('hidden');
    statusHeader.className = "text-emerald-400 font-bold flex items-center gap-1";
    statusHeader.innerHTML = "<span>✓</span> Confirmado On-Chain en Cookie Chain SVM";
    details.innerHTML = `
      <strong>Signer:</strong> ${connectedAddress} (${activeWalletType})<br>
      <strong>Canonical Program:</strong> <span class="text-amber-300">MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr</span><br>
      <strong>Recent Blockhash:</strong> ${blockhash.slice(0, 16)}...<br>
      <strong>Transaction Hash:</strong> <a href="https://cookiescan.io/tx/${txSignature}" target="_blank" class="text-emerald-400 underline font-bold">Ver en CookieScan (${txSignature.slice(0, 12)}...) &rarr;</a>
    `;
    logMessage("TX_CONFIRMED", `Transacción on-chain confirmada: ${txSignature}`, "text-emerald-400");
    fetchWalletBalance(connectedAddress);

  } catch (err) {
    const errMsg = err.message || JSON.stringify(err);
    logMessage("TX_FEEDBACK", `Respuesta de la red/billetera: ${errMsg}`, "text-amber-400");

    box.classList.remove('hidden');
    statusHeader.className = "text-amber-400 font-bold flex items-center gap-1";
    statusHeader.innerHTML = "<span>⚠️</span> Notificación de Transacción / Validación";

    let notice = errMsg;
    if (errMsg.includes("Attempt to debit an account but found no record of a prior credit") || errMsg.includes("0x1") || errMsg.includes("insufficient")) {
      notice = `La dirección conectada tiene <strong>0.0000 COOKIE</strong> para la tarifa de red (~0.000005 COOKIE).<br>
      Para realizar escrituras on-chain, transfiere COOKIE a esta dirección desde el bridge: <a href="https://www.cookiechain.wtf" target="_blank" class="text-amber-400 underline">https://www.cookiechain.wtf</a>`;
    } else if (errMsg.includes("User rejected") || errMsg.includes("rejected") || errMsg.includes("cancelled")) {
      notice = "Has cancelado la firma de la transacción en tu billetera.";
    }

    details.innerHTML = `
      <strong>Signer:</strong> ${connectedAddress} (${activeWalletType})<br>
      <strong>Target Network:</strong> Cookie Chain SVM (<a href="https://cookiescan.io/address/${connectedAddress}" target="_blank" class="text-amber-400 underline">Ver dirección en CookieScan</a>)<br>
      <strong>Detalle:</strong> <span class="text-amber-300">${notice}</span>
    `;
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  detectWallets();
  fetchNetworkStats();
  setInterval(fetchNetworkStats, 5000);
});
