"""
CookieAgent Gateway & Sentinel cApp
Main FastAPI Application for Cookie Chain Bounty ($1,000 USDC)
"""

import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

from app.cookie_client import CookieChainClient
from app.mcp_gateway import get_mcp_manifest, MCPExecuteRequest, SUPPORTED_TOOLS

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
    allow_credentials=True,
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
    """Fetches real-time slot and block height from Cookie Chain SVM."""
    slot_res = await cookie_client.get_slot()
    height_res = await cookie_client.get_block_height()
    blockhash_res = await cookie_client.get_latest_blockhash()

    return {
        "network": "Cookie Chain (SVM)",
        "rpc_endpoint": cookie_client.rpc_url,
        "slot": slot_res.get("result"),
        "block_height": height_res.get("result"),
        "latest_blockhash": blockhash_res.get("result", {}).get("value", {}).get("blockhash") if "result" in blockhash_res else "unavailable",
        "latency_ms": slot_res.get("latency_ms", 0)
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
    Simulates / prepares an autonomous on-chain telemetry ping for an agent.
    Provides verifiable proof payload ready for Cookie Chain SVM submission.
    """
    blockhash_res = await cookie_client.get_latest_blockhash()
    current_slot = await cookie_client.get_slot()

    return {
        "status": "recorded",
        "agent_id": req.agent_id,
        "memo": req.memo,
        "target_network": "Cookie Chain",
        "slot": current_slot.get("result"),
        "blockhash": blockhash_res.get("result", {}).get("value", {}).get("blockhash") if "result" in blockhash_res else "N/A",
        "instruction_type": "SPL_MEMO_V2",
        "explorer_instruction_url": f"https://cookiescan.io/tx/demo-memo-{int(time.time())}"
    }

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
    else:
        raise HTTPException(status_code=404, detail=f"Tool '{t_name}' not recognized")
