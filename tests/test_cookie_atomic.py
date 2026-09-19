"""
Comprehensive Test Suite for Cookie Atomic Engine (Mainnet Beta) on Cookie Chain SVM
Tests:
- Quantitative Math: Net spread calculus, constant-product optimal order sizing
- 3-Instruction Atomic Route Simulation & Revert Guard
- REST Endpoints (/api/v1/atomic/status, discovery, cross-chain, simulate, deposit, withdraw)
- MCP Tools (cookie_atomic_get_spreads, cookie_atomic_get_vault_status, cookie_atomic_simulate_route)
"""

import time
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.cookie_atomic import (
    calculate_net_spread,
    calculate_optimal_order_size,
    simulate_atomic_route,
    cookie_atomic_engine
)

# --- Unit Tests for Quantitative Algorithms ---

def test_net_spread_calculation_profitable():
    # 1.85% gross spread, 0.30% fee each, $250 order, $0.0008 SVM gas
    res = calculate_net_spread(
        gross_spread_pct=1.85,
        fee_a_pct=0.30,
        fee_b_pct=0.30,
        order_size_usd=250.0,
        gas_cost_usd=0.0008
    )
    assert res["gross_spread_pct"] == 1.85
    assert res["fee_a_pct"] == 0.30
    assert res["fee_b_pct"] == 0.30
    assert res["is_profitable"] is True
    # Friction = 0.60% + tiny gas impact (~0.00032%)
    assert res["total_friction_pct"] >= 0.60
    assert res["net_spread_pct"] > 1.20


def test_net_spread_calculation_unprofitable():
    # 0.40% gross spread with 0.60% total fees should NOT be profitable
    res = calculate_net_spread(
        gross_spread_pct=0.40,
        fee_a_pct=0.30,
        fee_b_pct=0.30,
        order_size_usd=100.0,
        gas_cost_usd=0.0008
    )
    assert res["net_spread_pct"] < 0.0
    assert res["is_profitable"] is False


def test_optimal_order_size_constant_product():
    # Constant product AMMs: x * y = k
    res = calculate_optimal_order_size(
        reserve_cookie_a=180000.0,
        reserve_usdc_a=7830.0,
        reserve_cookie_b=160000.0,
        reserve_usdc_b=7200.0,
        fee_pct=0.30
    )
    assert res["optimal_size_cookie"] > 0
    assert res["optimal_size_usd"] > 0
    assert res["price_impact_pct"] <= 5.0
    assert res["safety_cap_applied"] in [True, False]


def test_simulate_atomic_route_pass():
    res = simulate_atomic_route(
        amount_cookie=1000.0,
        simulated_spread_pct=2.0,
        slippage_tolerance_pct=0.50
    )
    assert res["execution_mode"] == "ATOMIC_SVM_SIMULATION"
    assert "step_1_cookoven" in res
    assert "step_2_secondary_amm" in res
    assert "step_3_atomic_guard" in res
    assert res["step_3_atomic_guard"]["instruction"] == "ASSERT_MIN_OUTPUT_OR_REVERT"
    assert res["step_3_atomic_guard"]["safety_status"] == "ATOMIC_PASS"
    assert res["financial_summary"]["net_profit_usd"] > 0


def test_simulate_atomic_route_revert_guard():
    # Unprofitable route with negative spread must trigger on-chain revert
    res = simulate_atomic_route(
        amount_cookie=1000.0,
        simulated_spread_pct=-2.5,
        slippage_tolerance_pct=0.10
    )
    assert res["step_3_atomic_guard"]["safety_status"] == "REVERTED_ON_CHAIN"
    assert res["step_3_atomic_guard"]["revert_triggered"] is True


# --- API Integration Tests for Cookie Atomic Endpoints ---

@pytest.mark.asyncio
async def test_atomic_status_api():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/atomic/status")
    assert res.status_code == 200
    data = res.json()
    assert "Cookie Atomic" in data["protocol"]
    assert "Mainnet Beta" in data["protocol"]
    assert data["tvl_usd"] > 0
    assert data["share_price_nav"] > 0
    assert data["total_cookie_reserve"] > 0
    assert data["total_usdc_reserve"] > 0
    assert data["pools_detected"] == 1


@pytest.mark.asyncio
async def test_atomic_discovery_api():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/atomic/discovery")
    assert res.status_code == 200
    data = res.json()
    assert data["total_pools_detected"] >= 1
    assert "Cookoven" in data["primary_pool"]["amm_name"]
    assert "Sniper" in data["sniper_status"] or "STANDBY" in data["sniper_status"]


@pytest.mark.asyncio
async def test_atomic_cross_chain_api():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/atomic/cross-chain")
    assert res.status_code == 200
    data = res.json()
    assert "Cookie Chain" in data["origin_chain"]
    assert "Arbitrum" in data["benchmark_chain"]
    assert "hyperlane_bridge_url" in data
    assert data["cookie_chain_cookoven_price_usd"] > 0
    assert data["arbitrum_uniswap_price_usd"] > 0


@pytest.mark.asyncio
async def test_atomic_simulate_api():
    payload = {
        "amount_cookie": 1500.0,
        "simulated_spread_pct": 2.20,
        "slippage_tolerance_pct": 0.50
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/atomic/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["amount_cookie"] == 1500.0
    assert "step_1_cookoven" in data
    assert "step_2_secondary_amm" in data
    assert "step_3_atomic_guard" in data
    assert data["step_3_atomic_guard"]["safety_status"] == "ATOMIC_PASS"


@pytest.mark.asyncio
async def test_atomic_deposit_and_withdraw():
    user = "71aeea98_test_user_atomic_address_svm"
    deposit_payload = {
        "user_address": user,
        "amount_cookie": 250.0,
        "amount_usdc": 15.0
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        dep_res = await ac.post("/api/v1/atomic/deposit", json=deposit_payload)
    assert dep_res.status_code == 200
    dep_data = dep_res.json()
    assert dep_data["status"] == "confirmed"
    assert dep_data["shares_minted"] > 0

    # Query Position
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        pos_res = await ac.get(f"/api/v1/atomic/position/{user}")
    assert pos_res.status_code == 200
    pos_data = pos_res.json()
    assert pos_data["has_position"] is True
    assert pos_data["shares"] > 0

    # Withdraw without bypass -> MUST be blocked by 24h anti-MEV cooldown
    withdraw_payload = {
        "user_address": user,
        "shares": pos_data["shares"],
        "bypass_cooldown": False
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        wdr_blocked_res = await ac.post("/api/v1/atomic/withdraw", json=withdraw_payload)
    assert wdr_blocked_res.status_code == 400
    assert "CooldownActive" in wdr_blocked_res.json()["detail"]

    # Withdraw with bypass_cooldown=True -> MUST succeed and apply dynamic exit fee
    withdraw_payload["bypass_cooldown"] = True
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        wdr_res = await ac.post("/api/v1/atomic/withdraw", json=withdraw_payload)
    assert wdr_res.status_code == 200
    wdr_data = wdr_res.json()
    assert wdr_data["status"] == "confirmed"
    assert wdr_data["remaining_shares"] == 0.0
    assert "exit_fee_usd" in wdr_data
    assert wdr_data["exit_fee_rate_pct"] > 0


@pytest.mark.asyncio
async def test_atomic_proof_of_reserves_api():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/atomic/proof-of-reserves")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "FULLY_COLLATERALIZED"
    assert data["is_solvent"] is True
    assert data["solvency_ratio_pct"] >= 100.0
    assert "tiers" in data
    assert "cold_storage" in data["tiers"]
    assert "warm_buffer" in data["tiers"]
    assert "hot_trading_bot" in data["tiers"]
    assert data["tiers"]["cold_storage"]["allocation_pct"] == 85.0
    assert data["tiers"]["warm_buffer"]["allocation_pct"] == 10.0
    assert data["tiers"]["hot_trading_bot"]["allocation_pct"] == 5.0
    assert "cookiescan.io" in data["tiers"]["cold_storage"]["cookiescan_url"]


@pytest.mark.asyncio
async def test_atomic_verify_deposit_and_anti_replay():
    unique_tx = f"5Kd8z_test_unique_tx_{int(time.time() * 1000)}"
    user = "71aeea98_anti_replay_tester_svm"
    payload = {
        "tx_hash": unique_tx,
        "user_address": user,
        "amount_cookie": 150.0,
        "amount_usdc": 10.0
    }
    # 1. First deposit verification should succeed
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.post("/api/v1/atomic/verify-deposit", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["verified_on_chain"] is True
    assert data1["shares_minted"] > 0
    assert "cookiescan.io/tx" in data1["cookiescan_tx_url"]

    # 2. Duplicate submission with same tx_hash MUST be rejected (Replay Attack Defense)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res2 = await ac.post("/api/v1/atomic/verify-deposit", json=payload)
    assert res2.status_code == 400
    assert "ReplayAttackDetected" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_atomic_mcp_tools():
    # 1. cookie_atomic_get_spreads
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.post("/api/v1/mcp/execute", json={
            "tool_name": "cookie_atomic_get_spreads",
            "parameters": {}
        })
    assert res1.status_code == 200
    data1 = res1.json()
    assert "local_svm_crumbs" in data1
    assert "arbitrum_cross_chain" in data1

    # 2. cookie_atomic_get_vault_status
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res2 = await ac.post("/api/v1/mcp/execute", json={
            "tool_name": "cookie_atomic_get_vault_status",
            "parameters": {}
        })
    assert res2.status_code == 200
    data2 = res2.json()
    assert "Cookie Atomic" in data2["protocol"]

    # 3. cookie_atomic_simulate_route
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res3 = await ac.post("/api/v1/mcp/execute", json={
            "tool_name": "cookie_atomic_simulate_route",
            "parameters": {
                "amount_cookie": 800.0,
                "simulated_spread_pct": 1.95,
                "slippage_tolerance_pct": 0.50
            }
        })
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["amount_cookie"] == 800.0
    assert data3["step_3_atomic_guard"]["safety_status"] == "ATOMIC_PASS"

    # 4. cookie_atomic_proof_of_reserves
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res4 = await ac.post("/api/v1/mcp/execute", json={
            "tool_name": "cookie_atomic_proof_of_reserves",
            "parameters": {}
        })
    assert res4.status_code == 200
    data4 = res4.json()
    assert data4["status"] == "FULLY_COLLATERALIZED"
    assert data4["solvency_ratio_pct"] >= 100.0


@pytest.mark.asyncio
async def test_atomic_shoot_and_revert_api():
    payload = {
        "pool_name": "Cookoven Protocol (COOK/USDC)",
        "amount_cookie": 100.0
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/atomic/shoot-and-revert", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["atomic_status"] == "REVERTED_ON_CHAIN_AS_EXPECTED"
    assert data["revert_guard_triggered"] is True
    assert "InstructionError" in str(data["on_chain_error"])
    assert len(data["program_logs"]) > 0
