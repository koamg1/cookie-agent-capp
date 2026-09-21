"""
Comprehensive Test Suite for Cookie Atomic Engine (Mainnet Beta) on Cookie Chain SVM
Tests:
- Quantitative Math: Net spread calculus, constant-product optimal order sizing
- 3-Instruction Atomic Route Simulation & Revert Guard
- REST Endpoints (/api/v1/atomic/status, discovery, cross-chain, simulate, deposit, withdraw)
- MCP Tools (cookie_atomic_get_spreads, cookie_atomic_get_vault_status, cookie_atomic_simulate_route)
"""

import os
os.environ["PUBLIC_DEPOSITS_ENABLED"] = "true"
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
    assert data["tvl_usd"] >= 0
    assert data["share_price_nav"] > 0
    assert data["total_cookie_reserve"] >= 0
    assert data["total_usdc_reserve"] >= 0
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
    assert "Solana" in data["benchmark_chain"]
    assert "solana_dexscreener_url" in data
    assert data["cookie_chain_cookoven_price_usd"] > 0
    assert data["solana_jupiter_price_usd"] > 0


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
    # Honest PoR (audit M3): status reflects the REAL on-chain solvency, and is_solvent
    # must be consistent with the ratio (no hardcoded FULLY_COLLATERALIZED/PASSED).
    assert data["status"] in ["FULLY_COLLATERALIZED", "PARTIALLY_COLLATERALIZED"]
    assert data["is_solvent"] == (data["solvency_ratio_pct"] >= 100.0)
    assert data["solvency_ratio_pct"] >= 0.0
    assert "tiers" in data
    assert "cold_storage" in data["tiers"]
    assert "warm_buffer" in data["tiers"]
    assert "hot_trading_bot" in data["tiers"]
    assert data["tiers"]["cold_storage"]["allocation_pct"] == 70.0
    assert data["tiers"]["warm_buffer"]["allocation_pct"] == 20.0
    assert data["tiers"]["hot_trading_bot"]["allocation_pct"] == 10.0
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
    assert data4["status"] in ["FULLY_COLLATERALIZED", "PARTIALLY_COLLATERALIZED"]
    assert data4["solvency_ratio_pct"] >= 0.0


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


@pytest.mark.asyncio
async def test_auto_deposit_arbitrage_execution():
    test_user = "HSPEiMn8_auto_arb_tester_wallet"
    tx_hash = f"TEST-DEP-ARB-TX-{int(time.time())}"
    payload = {
        "tx_hash": tx_hash,
        "user_address": test_user,
        "amount_cookie": 150.0,
        "amount_usdc": 0.0
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/atomic/verify-deposit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["verified_on_chain"] is True
    assert "auto_arbitrage" in data
    assert data["auto_arbitrage"]["status"] == "STANDBY_DEX_LIQUIDITY"
    assert data["auto_arbitrage"]["executed"] is False


@pytest.mark.asyncio
async def test_sentinel_yield_cycle_execution():
    from app.cookie_atomic import cookie_atomic_engine
    cycle = cookie_atomic_engine.execute_sentinel_yield_cycle(slot=26126000)
    # Standby sentinel returns None when DEX liquidity is in standby
    assert cycle is None


@pytest.mark.asyncio
async def test_withdraw_concurrency_guard():
    from app.cookie_atomic import cookie_atomic_engine
    test_user = "CONCURRENT_USER_TEST"
    cookie_atomic_engine.deposit(test_user, 50.0, 0.0)

    # Artificially simulate user already in withdrawing set
    cookie_atomic_engine._withdrawing_addresses.add(test_user)
    try:
        with pytest.raises(ValueError, match="Withdrawal already in progress"):
            cookie_atomic_engine.withdraw(test_user, bypass_cooldown=True)
    finally:
        cookie_atomic_engine._withdrawing_addresses.discard(test_user)


@pytest.mark.asyncio
async def test_anti_sybil_and_streak_karma():
    from app.burn_tracker import burn_tracker
    from app.cookie_atomic import cookie_atomic_engine
    test_user = "SYBIL_TEST_USER_1111111111111111111111111"

    # 1. Dust burn (< 1.0 COOK)
    burn_tracker.record_burn(
        user_address=test_user,
        amount_cookie=0.5,
        tx_signature="TEST_SIG_DUST_BURN",
        verified=True
    )

    karma_res = cookie_atomic_engine.get_baker_karma(test_user)
    # Dust burn does NOT accrue base karma points
    assert karma_res["eligible_burned_cookie"] == 0.0
    assert karma_res["dust_burn_events_count"] == 1
    assert karma_res["baker_karma_score"] == 0

    # 2. Eligible burn (>= 1.0 COOK)
    burn_tracker.record_burn(
        user_address=test_user,
        amount_cookie=10.0,
        tx_signature="TEST_SIG_ELIGIBLE_BURN",
        verified=True
    )

    karma_res2 = cookie_atomic_engine.get_baker_karma(test_user)
    assert karma_res2["eligible_burned_cookie"] == 10.0
    assert karma_res2["streak_active"] is True
    assert karma_res2["streak_multiplier"] >= 1.0
    # 10 COOK * 10 = 100 base karma * multiplier
    assert karma_res2["baker_karma_score"] >= 100

    # Clean up test rows
    with burn_tracker._get_conn() as conn:
        conn.execute("DELETE FROM app_burn_records WHERE user_address = ?", (test_user,))
        conn.commit()


@pytest.mark.asyncio
async def test_rpc_proxy_whitelist_security():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Unauthorized RPC method should be rejected with 403 Forbidden
        bad_payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "unauthorizedAdminExploitMethod",
            "params": []
        }
        res_sol = await ac.post("/api/v1/solana/rpc", json=bad_payload)
        assert res_sol.status_code == 403
        assert "not permitted" in res_sol.json()["detail"]

        res_cookie = await ac.post("/api/v1/cookie/rpc", json=bad_payload)
        assert res_cookie.status_code == 403
        assert "not permitted" in res_cookie.json()["detail"]


@pytest.mark.asyncio
async def test_deposit_onchain_verifier_rejects_fake_tx():
    """Audit C1: the zero-trust verifier must NOT credit a non-existent / bogus tx.
    A fabricated signature returns ok=False (no shares can be minted from thin air)."""
    from app.cookie_atomic import cookie_atomic_engine
    bogus_sig = "5" + "z" * 87  # base58-shaped but never confirmed on-chain
    ok, cookie, slot, err = cookie_atomic_engine._verify_native_deposit_onchain(
        bogus_sig, "71aeea98_fake_depositor_svm_address"
    )
    assert ok is False
    assert cookie == 0.0
    assert err is not None


@pytest.mark.asyncio
async def test_withdraw_signer_failure_does_not_burn_shares(monkeypatch):
    """Audit H3: if the payout fails, shares MUST NOT be burned (no silent loss)."""
    import app.cookie_atomic as ca
    e = ca.cookie_atomic_engine
    user = "H3_FAILURE_TEST_USER"
    e.deposit(user, 100.0, 0.0)
    shares_before = e.user_positions[user].shares
    assert shares_before > 0
    monkeypatch.setattr(ca, "signer_request_payout",
                        lambda **kw: {"status": "failed", "error": "signer down (test)"})
    with pytest.raises(ValueError, match="WithdrawalPayoutFailed"):
        e.withdraw(user, bypass_cooldown=True)
    assert e.user_positions[user].shares == shares_before
    e.user_positions.pop(user, None)


@pytest.mark.asyncio
async def test_withdraw_above_cap_queues_without_burning(monkeypatch):
    """Above the automatic payout cap -> queued for manual approval, shares intact."""
    import app.cookie_atomic as ca
    e = ca.cookie_atomic_engine
    user = "H3_CAP_TEST_USER"
    e.deposit(user, 100.0, 0.0)
    shares_before = e.user_positions[user].shares
    monkeypatch.setattr(ca, "signer_request_payout",
                        lambda **kw: {"status": "needs_manual_approval", "reason": "above cap (test)"})
    res = e.withdraw(user, bypass_cooldown=True)
    assert res["status"] == "pending_approval"
    assert res["shares_burned"] == 0.0
    assert e.user_positions[user].shares == shares_before
    e.user_positions.pop(user, None)



