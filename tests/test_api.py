"""
Unit & Integration Tests for CookieAgent Gateway & Sentinel cApp
Run with: pytest tests/test_api.py -v
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "cookie_chain_rpc" in data
    assert "gateway_latency_ms" in data

@pytest.mark.asyncio
async def test_network_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/network/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["network"] == "Cookie Chain (SVM)"
    assert "rpc_endpoint" in data

@pytest.mark.asyncio
async def test_mcp_manifest():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/mcp/manifest")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "cookie-agent-gateway"
    assert len(data["tools"]) >= 4

@pytest.mark.asyncio
async def test_agent_ping_execution():
    payload = {
        "agent_id": "test-sentinel-01",
        "memo": "telemetry:test-run"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/agent/ping", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "recorded"
    assert data["agent_id"] == "test-sentinel-01"

@pytest.mark.asyncio
async def test_mcp_execute_tool():
    payload = {
        "tool_name": "cookie_get_network_stats",
        "parameters": {}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/mcp/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["network"] == "Cookie Chain (SVM)"

@pytest.mark.asyncio
async def test_agents_fleet_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/agents/fleet")
    assert response.status_code == 200
    data = response.json()
    assert data["total_agents"] == 50
    assert data["swarm_status"] == "operational"
    assert len(data["agents"]) == 50

@pytest.mark.asyncio
async def test_agents_fleet_filter():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/agents/fleet?squad=defi")
    assert response.status_code == 200
    data = response.json()
    assert data["total_agents"] == 10
    for agent in data["agents"]:
        assert agent["squad"] == "defi"

@pytest.mark.asyncio
async def test_mcp_execute_fleet():
    payload = {
        "tool_name": "cookie_list_agent_fleet",
        "parameters": {"squad": "security"}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/mcp/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_agents"] == 10

