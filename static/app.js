// CookieAgent Gateway - Authentic Web3 SVM Wallet Adapter & Telemetry Client

let connectedAddress = null;
let activeWalletType = null;
let activeWalletProvider = null;

function logMessage(tag, message, color = "text-gray-300") {
  const terminal = document.getElementById("logTerminal");
  if (!terminal) return;
  const timeStr = new Date().toISOString().substring(11, 19);
  const line = document.createElement("div");
  line.innerHTML = `<span class="text-gray-500">[${timeStr}]</span> <span class="${color}">[${tag}]</span> ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// Modal control
function openWalletModal() {
  detectWallets();
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

// Real detection of installed browser extensions
function detectWallets() {
  const badgeNightly = document.getElementById('badgeNightly');
  const badgePhantom = document.getElementById('badgePhantom');
  const badgeSolflare = document.getElementById('badgeSolflare');

  if (window.nightly && window.nightly.solana) {
    badgeNightly.innerText = "Detected";
    badgeNightly.className = "text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold";
  } else {
    badgeNightly.innerText = "Install ↗";
    badgeNightly.className = "text-[10px] mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:underline";
  }

  const hasPhantom = !!(window.phantom && window.phantom.solana) || !!(window.solana && window.solana.isPhantom);
  if (hasPhantom) {
    badgePhantom.innerText = "Detected";
    badgePhantom.className = "text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold";
  } else {
    badgePhantom.innerText = "Install ↗";
    badgePhantom.className = "text-[10px] mono px-2 py-0.5 rounded bg-gray-800 text-gray-500";
  }

  const hasSolflare = !!(window.solflare && window.solflare.isSolflare);
  if (hasSolflare) {
    badgeSolflare.innerText = "Detected";
    badgeSolflare.className = "text-[10px] mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold";
  } else {
    badgeSolflare.innerText = "Install ↗";
    badgeSolflare.className = "text-[10px] mono px-2 py-0.5 rounded bg-gray-800 text-gray-500";
  }
}

// Connect to chosen Web3 provider
async function connectWallet(type) {
  if (type === 'nightly') {
    if (!window.nightly || !window.nightly.solana) {
      window.open('https://chromewebstore.google.com/detail/nightly/fiikommddbeccemicoidomjjhaagjhii', '_blank');
      return;
    }
    try {
      logMessage("WALLET", "Requesting connection from Nightly Wallet...", "text-amber-400");
      const resp = await window.nightly.solana.connect();
      activeWalletProvider = window.nightly.solana;
      activeWalletType = 'Nightly';
      connectedAddress = resp.publicKey ? resp.publicKey.toString() : window.nightly.solana.publicKey.toString();
      logMessage("WALLET_OK", `Nightly connected: ${connectedAddress}`, "text-emerald-400");
    } catch (err) {
      logMessage("WALLET_ERR", `Nightly connection cancelled: ${err.message || err}`, "text-red-400");
      return;
    }
  } else if (type === 'phantom') {
    const provider = (window.phantom && window.phantom.solana) || (window.solana && window.solana.isPhantom ? window.solana : null);
    if (!provider) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      logMessage("WALLET", "Requesting connection from Phantom...", "text-purple-400");
      const resp = await provider.connect();
      activeWalletProvider = provider;
      activeWalletType = 'Phantom';
      connectedAddress = resp.publicKey ? resp.publicKey.toString() : provider.publicKey.toString();
      logMessage("WALLET_OK", `Phantom connected: ${connectedAddress}`, "text-emerald-400");
    } catch (err) {
      logMessage("WALLET_ERR", `Phantom connection cancelled: ${err.message || err}`, "text-red-400");
      return;
    }
  } else if (type === 'solflare') {
    if (!window.solflare) {
      window.open('https://solflare.com/', '_blank');
      return;
    }
    try {
      logMessage("WALLET", "Requesting connection from Solflare...", "text-orange-400");
      await window.solflare.connect();
      activeWalletProvider = window.solflare;
      activeWalletType = 'Solflare';
      connectedAddress = window.solflare.publicKey.toString();
      logMessage("WALLET_OK", `Solflare connected: ${connectedAddress}`, "text-emerald-400");
    } catch (err) {
      logMessage("WALLET_ERR", `Solflare connection cancelled: ${err.message || err}`, "text-red-400");
      return;
    }
  } else if (type === 'session_key') {
    if (!window.solanaWeb3) {
      logMessage("WALLET_ERR", "Solana Web3 SDK not loaded yet. Please wait.", "text-red-400");
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
    activeWalletType = 'Session Key';
    connectedAddress = keypair.publicKey.toString();
    logMessage("SESSION_KEY", `Real cryptographic Ed25519 SVM keypair initialized. Address: ${connectedAddress}`, "text-emerald-400");
  }

  closeWalletModal();
  updateUI();
  fetchWalletBalance(connectedAddress);
}

function disconnectWallet() {
  if (activeWalletProvider && activeWalletProvider.disconnect) {
    try { activeWalletProvider.disconnect(); } catch (e) {}
  }
  connectedAddress = null;
  activeWalletType = null;
  activeWalletProvider = null;
  updateUI();
  logMessage("WALLET", "Wallet disconnected.", "text-gray-500");
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
    badge.innerText = activeWalletType;
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
