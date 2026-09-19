"""
CookieAgent Gateway & Sentinel cApp
Main FastAPI Application for Cookie Chain Bounty ($1,000 USDC)
"""

import asyncio
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from typing import Optional
from app.cookie_client import CookieChainClient
from app.mcp_gateway import get_mcp_manifest, MCPExecuteRequest, SUPPORTED_TOOLS
from app.fleet_registry import get_agents_fleet, get_agent_by_id

app = FastAPI(
    title="CookieAgent Gateway & Sentinel cApp",
    description="Autonomous Agent Gateway & Real-Time Telemetry Dashboard for Cookie Chain (SVM). Built for Superteam Earn $1,000 USDC Bounty.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for dApp connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

cookie_client = CookieChainClient()

# Mount Static Files (Frontend UI)
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_dashboard():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>CookieAgent Gateway is running. Visit /docs for Swagger UI.</h1>")

@app.get("/favicon.ico")
async def favicon():
    return HTMLResponse(content="")

@app.get("/health")
async def health_check():
    """Liveness & Readiness probe with Cookie Chain RPC latency."""
    t0 = time.perf_counter()
    node_health = await cookie_client.get_health()
    total_ms = (time.perf_counter() - t0) * 1000.0
    return {
        "status": "healthy",
        "service": "cookie-agent-capp",
        "cookie_chain_rpc": node_health,
        "gateway_latency_ms": round(total_ms, 2),
        "timestamp": time.time()
    }

@app.get("/api/v1/network/stats")
async def network_stats():
    """Fetches real-time slot, block height, epoch, live TPS, and total transactions directly from Cookie Chain SVM."""
    slot_res, height_res, blockhash_res, epoch_res, perf_res = await asyncio.gather(
        cookie_client.get_slot(),
        cookie_client.get_block_height(),
        cookie_client.get_latest_blockhash(),
        cookie_client.get_epoch_info(),
        cookie_client.get_performance_samples(4)
    )

    bh_val = "unavailable"
    if isinstance(blockhash_res, dict) and "result" in blockhash_res:
        bh_res = blockhash_res["result"]
        if isinstance(bh_res, dict):
            bh_val = bh_res.get("value", {}).get("blockhash", "unavailable")

    # Live TPS calculation
    tps = 8.5
    perf_samples = perf_res.get("result", [])
    if isinstance(perf_samples, list) and len(perf_samples) > 0:
        s0 = perf_samples[0]
        num_tx = s0.get("numTransactions", 0)
        period = s0.get("samplePeriodSecs", 60)
        if period > 0:
            tps = round(num_tx / period, 2)

    epoch_data = epoch_res.get("result", {})
    epoch_num = epoch_data.get("epoch", 60)
    slot_index = epoch_data.get("slotIndex", 0)
    slots_in_epoch = epoch_data.get("slotsInEpoch", 432000)
    tx_count = epoch_data.get("transactionCount", 0)
    epoch_progress = round((slot_index / slots_in_epoch) * 100, 2) if slots_in_epoch > 0 else 0.0

    return {
        "network": "Cookie Chain (SVM)",
        "rpc_endpoint": cookie_client.rpc_url,
        "slot": slot_res.get("result"),
        "block_height": height_res.get("result"),
        "latest_blockhash": bh_val,
        "latency_ms": slot_res.get("latency_ms", 0),
        "epoch": epoch_num,
        "epoch_progress_pct": epoch_progress,
        "slots_in_epoch": slots_in_epoch,
        "total_transactions": tx_count,
        "live_tps": tps
    }

@app.get("/api/v1/network/memos")
async def recent_memos(limit: int = 8):
    """Fetches real on-chain SPL Memos confirmed on Cookie Chain SVM."""
    res = await cookie_client.get_recent_memos(limit)
    return {
        "network": "Cookie Chain (SVM)",
        "canonical_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "recent_memos": res.get("result", [])
    }

@app.get("/api/v1/wallet/{address}/balance")
async def wallet_balance(address: str):
    """Queries Cookie balance for any given base58 address on Cookie Chain."""
    res = await cookie_client.get_balance(address)
    return res

@app.get("/api/v1/mcp/manifest")
async def mcp_manifest():
    """Returns Model Context Protocol (MCP) manifest with available tools for AI agents."""
    return get_mcp_manifest()

class AgentPingRequest(BaseModel):
    agent_id: str
    memo: str

@app.post("/api/v1/agent/ping")
async def agent_ping(req: AgentPingRequest):
    """
    Prepares an autonomous on-chain telemetry ping for an agent.
    Provides verifiable proof payload ready for Cookie Chain SVM submission.
    """
    blockhash_res, current_slot = await asyncio.gather(
        cookie_client.get_latest_blockhash(),
        cookie_client.get_slot()
    )

    bh_val = "unavailable"
    if isinstance(blockhash_res, dict) and "result" in blockhash_res:
        bh_res = blockhash_res["result"]
        if isinstance(bh_res, dict):
            bh_val = bh_res.get("value", {}).get("blockhash", "unavailable")

    proof_nonce = f"PROOF-{int(time.time())}-{abs(hash(req.agent_id)) % 100000:05d}"

    return {
        "status": "recorded",
        "agent_id": req.agent_id,
        "memo": req.memo,
        "target_network": "Cookie Chain (SVM)",
        "slot": current_slot.get("result"),
        "blockhash": bh_val,
        "canonical_memo_program": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
        "instruction_type": "SPL_MEMO_V2",
        "proof_nonce": proof_nonce,
        "is_simulation": True
    }

@app.get("/api/v1/agents/fleet")
async def agents_fleet(squad: Optional[str] = None):
    """
    Returns the full 50-Agent Autonomous Sentinel Swarm registry.
    Filterable by squad: defi, security, bridge, network, data_mcp.
    """
    fleet = get_agents_fleet()
    if squad and squad != "all":
        fleet = [a for a in fleet if a.get("squad") == squad]
    return {
        "total_agents": len(fleet),
        "network": "Cookie Chain (SVM)",
        "swarm_status": "operational",
        "agents": fleet
    }

@app.get("/api/v1/agents/{agent_id}")
async def get_agent_detail(agent_id: str):
    """Returns metadata, status, and telemetry spec for a specific agent."""
    return get_agent_by_id(agent_id)

@app.post("/api/v1/mcp/execute")
async def mcp_execute(req: MCPExecuteRequest):
    """Executes an MCP tool call directly through the gateway."""
    t_name = req.tool_name
    params = req.parameters

    if t_name == "cookie_get_network_stats":
        return await network_stats()
    elif t_name == "cookie_check_balance":
        addr = params.get("address", "")
        if not addr:
            raise HTTPException(status_code=400, detail="Address is required")
        return await wallet_balance(addr)
    elif t_name == "cookie_simulate_agent_ping":
        aid = params.get("agent_id", "agent-sentinel")
        memo = params.get("memo", "status:ok")
        return await agent_ping(AgentPingRequest(agent_id=aid, memo=memo))
    elif t_name == "cookie_resolve_explorer_url":
        etype = params.get("entity_type", "tx")
        ident = params.get("identifier", "")
        return {"explorer_url": f"https://cookiescan.io/{etype}/{ident}"}
    elif t_name == "cookie_list_agent_fleet":
        sq = params.get("squad", "all")
        return await agents_fleet(sq)
    elif t_name == "cookie_get_bridge_guide":
        return {
            "title": "Cookie Chain Hyperlane Bridge & Faucet Guide",
            "faucet_url": "https://www.cookiechain.wtf",
            "hyperlane_bridge_url": "https://bridge.cookiechain.wtf",
            "origin_chain": "Base Sepolia (EVM)",
            "destination_chain": "Cookie Chain Testnet (SVM)",
            "steps": [
                "1. Connect EVM wallet to Base Sepolia on https://bridge.cookiechain.wtf",
                "2. Acquire Base Sepolia ETH from public faucets if needed",
                "3. Enter your Cookie Chain SVM recipient address (e.g. from Nightly or Phantom)",
                "4. Initiate bridge transfer via Hyperlane Mailbox",
                "5. Upon arrival on Cookie Chain, use CookieAgent cApp to verify balance and bake telemetry proofs."
            ]
        }
    else:
        raise HTTPException(status_code=404, detail=f"Tool '{t_name}' not recognized")
