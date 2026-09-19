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
        <strong>Memo:</strong> "${data.memo}"<br>
        <strong>Network Slot:</strong> #${data.slot}<br>
        <strong>Recent Blockhash:</strong> ${data.blockhash.slice(0, 16)}...<br>
        <strong>Explorer Verification:</strong> <a href="${data.explorer_instruction_url}" target="_blank" class="text-amber-400 underline">View on CookieScan</a>
      `;
      logMessage("TX_CONFIRMED", `Memo posted in Slot #${data.slot} | Fee: ~0.000005 COOKIE`, "text-emerald-400");
    }
  } catch (err) {
    logMessage("TX_ERR", `Broadcast error: ${err}`, "text-red-400");
  }
}

// Initial polling loop
document.addEventListener('DOMContentLoaded', () => {
  fetchNetworkStats();
  setInterval(fetchNetworkStats, 5000);
});
