"""
Cookie Chain MCP (Model Context Protocol) Bridge
Exposes standardized tool schemas for AI Agents to interact with Cookie Chain.
Compatible with cookiechain/cookie-mcp protocol specifications.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class MCPToolDefinition(BaseModel):
    name: str
    description: str
    inputSchema: Dict[str, Any]

class MCPExecuteRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any] = Field(default_factory=dict)

# Tools supported by the CookieAgent MCP Gateway
SUPPORTED_TOOLS = [
    MCPToolDefinition(
        name="cookie_get_network_stats",
        description="Get real-time telemetry from Cookie Chain SVM: current slot, block height, and RPC node latency.",
        inputSchema={
            "type": "object",
            "properties": {},
            "required": []
        }
    ),
    MCPToolDefinition(
        name="cookie_check_balance",
        description="Query the balance of any wallet address or token account on Cookie Chain.",
        inputSchema={
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "The base58 encoded Solana/Cookie public key"
                }
            },
            "required": ["address"]
        }
    ),
    MCPToolDefinition(
        name="cookie_simulate_agent_ping",
        description="Simulate an autonomous on-chain telemetry ping or state update for an AI agent on Cookie Chain.",
        inputSchema={
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Unique identifier of the AI agent"},
                "memo": {"type": "string", "description": "Telemetry data or state proof to record on-chain"}
            },
            "required": ["agent_id", "memo"]
        }
    ),
    MCPToolDefinition(
        name="cookie_resolve_explorer_url",
        description="Generate official CookieScan explorer URLs for accounts, transactions, and tokens.",
        inputSchema={
            "type": "object",
            "properties": {
                "entity_type": {"type": "string", "enum": ["tx", "address", "token", "block"]},
                "identifier": {"type": "string", "description": "Transaction hash or base58 address"}
            },
            "required": ["entity_type", "identifier"]
        }
    ),
    MCPToolDefinition(
        name="cookie_list_agent_fleet",
        description="List all 50 autonomous agents in the Cookie Sentinel Swarm across 5 squads (DeFi, Security, Bridge, Network, Data/MCP).",
        inputSchema={
            "type": "object",
            "properties": {
                "squad": {"type": "string", "enum": ["all", "defi", "security", "bridge", "network", "data_mcp"], "description": "Filter by squad (optional)"}
            },
            "required": []
        }
    ),
    MCPToolDefinition(
        name="cookie_get_bridge_guide",
        description="Retrieve step-by-step instructions for bridging testnet COOKIE tokens via Hyperlane from Base Sepolia and using the faucet.",
        inputSchema={
            "type": "object",
            "properties": {},
            "required": []
        }
    )
]

def get_mcp_manifest() -> Dict[str, Any]:
    return {
        "name": "cookie-agent-gateway",
        "version": "1.0.0",
        "description": "Model Context Protocol (MCP) Bridge for autonomous AI agents on Cookie Chain (SVM)",
        "protocolVersion": "2024-11-05",
        "tools": [t.model_dump() for t in SUPPORTED_TOOLS],
        "ecosystem": {
            "network": "Cookie Chain (SVM)",
            "rpc": "https://rpc.cookiescan.io",
            "explorer": "https://cookiescan.io",
            "mcp_repo": "https://github.com/cookiechain/cookie-mcp"
        }
    }
