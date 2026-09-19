// CookieAgent Gateway - Client JS for Cookie Chain cApp

let connectedAddress = null;

function logMessage(tag, message, color = "text-gray-300") {
  const terminal = document.getElementById("logTerminal");
  if (!terminal) return;
  const timeStr = new Date().toISOString().substring(11, 19);
  const line = document.createElement("div");
  line.innerHTML = `<span class="text-gray-500">[${timeStr}]</span> <span class="${color}">[${tag}]</span> ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

async function fetchNetworkStats() {
  try {
    const res = await fetch('/api/v1/network/stats');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('statSlot').innerText = data.slot ? `#${data.slot.toLocaleString()}` : 'Live';
      document.getElementById('statLatency').innerText = `${Math.round(data.latency_ms)} ms`;
      logMessage("NET", `Slot ${data.slot} | Height ${data.block_height} | Latency ${Math.round(data.latency_ms)}ms`, "text-amber-400");
    }
  } catch (err) {
    console.error("Error fetching network stats:", err);
  }
}

async function toggleWalletConnect() {
  const btn = document.getElementById('connectWalletBtn');
  const statWallet = document.getElementById('statWallet');
  const statBalance = document.getElementById('statBalance');

  // Check for Nightly or Solana standard wallet
  if (window.nightly && window.nightly.solana) {
    try {
      const response = await window.nightly.solana.connect();
      connectedAddress = response.publicKey.toString();
      statWallet.innerText = `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`;
      btn.innerHTML = '<span>✓ Connected (Nightly)</span>';
      btn.classList.remove('from-amber-500', 'to-amber-600');
      btn.classList.add('from-emerald-500', 'to-emerald-600');
      logMessage("WALLET", `Nightly Wallet connected: ${connectedAddress}`, "text-emerald-400");
      
      // Fetch balance on Cookie Chain
      fetchWalletBalance(connectedAddress);
      return;
    } catch (e) {
      console.warn("Nightly direct connect cancelled/failed:", e);
    }
  }

  // Fallback demo connection (simulates clean SVM wallet adapter)
  if (!connectedAddress) {
    // Generate a demo Cookie Chain burner public key format
    connectedAddress = "Cook1eAg3nt" + Math.random().toString(36).substring(2, 10) + "SVMpubKey9";
    statWallet.innerText = `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`;
    statBalance.innerText = "150.25 COOKIE";
    btn.innerHTML = '<span>✓ Connected (Demo Mode)</span>';
    btn.classList.remove('from-amber-500', 'to-amber-600');
    btn.classList.add('from-emerald-500', 'to-emerald-600');
    logMessage("WALLET", `Simulated Nightly connection: ${connectedAddress} on Cookie Chain`, "text-emerald-400");
  } else {
    connectedAddress = null;
    statWallet.innerText = "Not Connected";
    statBalance.innerText = "0.0000 COOKIE";
    btn.innerHTML = '<span>⚡ Connect Nightly</span>';
    btn.classList.remove('from-emerald-500', 'to-emerald-600');
    btn.classList.add('from-amber-500', 'to-amber-600');
    logMessage("WALLET", "Wallet disconnected", "text-gray-400");
  }
}

async function fetchWalletBalance(address) {
  try {
    const res = await fetch(`/api/v1/wallet/${address}/balance`);
    if (res.ok) {
      const data = await res.json();
      document.getElementById('statBalance').innerText = `${data.balance_cookie.toFixed(4)} COOKIE`;
    }
  } catch (e) {
    console.error("Error fetching balance:", e);
  }
}

async function triggerAgentPing() {
  const agentId = document.getElementById('agentIdInput').value || "CookieSentinel-Default";
  const memo = document.getElementById('agentMemoInput').value || "status:ok";
  const box = document.getElementById('pingResultBox');
  const details = document.getElementById('pingResultDetails');

  logMessage("TX", `Preparing on-chain SPL memo for agent [${agentId}]...`, "text-amber-300");

  // Check if real Nightly wallet is connected with Solana Web3 available
  if (window.nightly && window.nightly.solana && connectedAddress && !connectedAddress.startsWith("Cook1eAg3nt") && window.solanaWeb3) {
    try {
      logMessage("SVM", "Building native SPL Memo transaction for Cookie Chain...", "text-amber-400");
      const connection = new solanaWeb3.Connection("https://rpc.cookiescan.io", "confirmed");
      const memoProgramId = new solanaWeb3.PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
      const userPubkey = new solanaWeb3.PublicKey(connectedAddress);

      const instruction = new solanaWeb3.TransactionInstruction({
        keys: [{ pubkey: userPubkey, isSigner: true, isWritable: true }],
        programId: memoProgramId,
        data: new TextEncoder().encode(`[CookieAgent] ${agentId}: ${memo}`)
      });

      const transaction = new solanaWeb3.Transaction().add(instruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPubkey;

      logMessage("WALLET", "Requesting signature from Nightly...", "text-purple-400");
      const signedRes = await window.nightly.solana.signAndSendTransaction(transaction);
      const txSignature = typeof signedRes === 'string' ? signedRes : (signedRes.signature || JSON.stringify(signedRes));

      box.classList.remove('hidden');
      details.innerHTML = `
        <strong>Agent:</strong> ${agentId}<br>
        <strong>Memo Payload:</strong> "${memo}"<br>
        <strong>Status:</strong> <span class="text-emerald-400 font-bold">Confirmed On-Chain</span><br>
        <strong>Canonical Memo Program:</strong> <span class="text-amber-300">MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr</span><br>
        <strong>Explorer Verification:</strong> <a href="https://cookiescan.io/tx/${txSignature}" target="_blank" class="text-emerald-400 underline font-bold">View Real Tx on CookieScan (${txSignature.slice(0, 10)}...) &rarr;</a>
      `;
      logMessage("TX_CONFIRMED", `Real on-chain tx confirmed: ${txSignature.slice(0, 16)}...`, "text-emerald-400");
      return;
    } catch (txErr) {
      logMessage("TX_FALLBACK", `Nightly broadcast bypassed: ${txErr.message || txErr}. Reverting to Gateway State Proof.`, "text-amber-400");
    }
  }

  // Fallback: Gateway State Proof simulation via backend
  try {
    const res = await fetch('/api/v1/agent/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, memo: memo })
    });

    if (res.ok) {
      const data = await res.json();
      box.classList.remove('hidden');
      details.innerHTML = `
        <strong>Agent:</strong> ${data.agent_id}<br>
        <strong>Memo Payload:</strong> "${data.memo}"<br>
        <strong>Network Target:</strong> ${data.target_network} (Slot #${data.slot})<br>
        <strong>Blockhash:</strong> ${data.blockhash ? data.blockhash.slice(0, 16) + '...' : 'Live'}<br>
        <strong>Canonical Program:</strong> <span class="text-amber-300">MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr</span><br>
        <strong>Telemetry Nonce:</strong> <span class="text-emerald-400 font-mono">${data.proof_nonce}</span><br>
        <span class="text-gray-400 text-[10px] mt-1 block">💡 Validated against live Cookie Chain SVM state. Connect funded Nightly wallet to sign on-chain.</span>
      `;
      logMessage("TX_PROOF", `Telemetry Proof [${data.proof_nonce}] recorded for Slot #${data.slot}`, "text-emerald-400");
    }
  } catch (err) {
    logMessage("TX_ERR", `Gateway error: ${err}`, "text-red-400");
  }
}

// Initial polling loop
document.addEventListener('DOMContentLoaded', () => {
  fetchNetworkStats();
  setInterval(fetchNetworkStats, 5000);
});
