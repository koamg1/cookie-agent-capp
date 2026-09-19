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

@pytest.mark.asyncio
async def test_opportunities_radar():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/opportunities/radar")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert data["total_crumbs"] >= 3

@pytest.mark.asyncio
async def test_eat_opportunity():
    payload = {
        "opportunity_id": "opp_cookie_usdc_01",
        "user_address": "HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/opportunities/eat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "confirmed"
    assert data["incentive_split"]["user_share_pct"] == "80%"
    assert data["incentive_split"]["burn_share_pct"] == "10%"

@pytest.mark.asyncio
async def test_burn_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/stats/burn")
    assert response.status_code == 200
    data = response.json()
    assert data["token"] == "$COOKIE"
    assert data["cumulative_burned"] > 0

@pytest.mark.asyncio
async def test_airdrop_karma():
    addr = "HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/airdrop/karma/{addr}")
    assert response.status_code == 200
    data = response.json()
    assert data["address"] == addr
    assert "baker_karma_score" in data
    assert "airdrop_tier" in data
    assert data["dao_grant_eligibility"] == "VERIFIED_ELIGIBLE"

@pytest.mark.asyncio
async def test_vault_info():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/vault/info")
    assert response.status_code == 200
    data = response.json()
    assert data["protocol"] == "Cookie HyperArb Automated Vault"
    assert data["tvl_usd"] > 0
    assert data["projected_apy_pct"] > 0
    assert data["runner_status"] == "ACTIVE_24_7"

@pytest.mark.asyncio
async def test_vault_deposit_and_position():
    user = "HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV"
    payload = {
        "user_address": user,
        "amount_cookie": 100.0,
        "amount_usdc": 10.0
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        dep_res = await ac.post("/api/v1/vault/deposit", json=payload)
    assert dep_res.status_code == 200
    dep_data = dep_res.json()
    assert dep_data["status"] == "confirmed"
    assert dep_data["shares_minted"] > 0
    assert dep_data["share_token"] == "cCOOKIE-LP"

    # Verify user position
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        pos_res = await ac.get(f"/api/v1/vault/position/{user}")
    assert pos_res.status_code == 200
    pos_data = pos_res.json()
    assert pos_data["has_position"] is True
    assert pos_data["shares"] > 0
    assert pos_data["current_value_usd"] > 0

@pytest.mark.asyncio
async def test_vault_trigger_arb_and_feed():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        arb_res = await ac.post("/api/v1/vault/trigger-arb")
    assert arb_res.status_code == 200
    arb_data = arb_res.json()
    assert arb_data["status"] == "CONFIRMED_ON_CHAIN"
    assert arb_data["profit_to_vault_usd"] > 0

    # Check feed
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        feed_res = await ac.get("/api/v1/vault/feed?limit=5")
    assert feed_res.status_code == 200
    feed_data = feed_res.json()
    assert len(feed_data) > 0
    assert "spread_pct" in feed_data[0]

@pytest.mark.asyncio
async def test_vault_withdraw():
    user = "HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV"
    payload = {
        "user_address": user,
        "shares": None  # withdraw all
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        wdr_res = await ac.post("/api/v1/vault/withdraw", json=payload)
    assert wdr_res.status_code == 200
    wdr_data = wdr_res.json()
    assert wdr_data["status"] == "confirmed"
    assert wdr_data["cookie_payout"] > 0
    assert wdr_data["usdc_payout"] > 0
    assert wdr_data["remaining_shares"] == 0.0

@pytest.mark.asyncio
async def test_mcp_execute_vault():
    payload = {
        "tool_name": "cookie_vault_get_status",
        "parameters": {}
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/mcp/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["protocol"] == "Cookie HyperArb Automated Vault"



