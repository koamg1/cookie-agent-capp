import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.burn_tracker import burn_tracker

@pytest.mark.asyncio
async def test_burn_tracker_record_and_total():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Check initial or current total
        res0 = await ac.get("/api/v1/burn/app-total")
        assert res0.status_code == 200
        data0 = res0.json()
        assert "total_burned_by_app" in data0
        assert "total_burn_events" in data0
        init_burned = data0["total_burned_by_app"]
        init_events = data0["total_burn_events"]

        # Record a test burn
        payload = {
            "user_address": "TestUserBurn11111111111111111111111111111111",
            "amount_cookie": 2.5,
            "tx_signature": "TEST_SIG_UNITTEST_1",
            "source": "user_oven",
            "slot": 26105000
        }
        res1 = await ac.post("/api/v1/burn/record", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["status"] == "recorded"
        assert data1["app_totals"]["total_burned_by_app"] == round(init_burned + 2.5, 4)
        assert data1["app_totals"]["total_burn_events"] == init_events + 1

        # Query total again
        res2 = await ac.get("/api/v1/burn/app-total")
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["total_burned_by_app"] == round(init_burned + 2.5, 4)
        assert data2["total_karma_generated"] >= 25

    # Clean up test row so state stays pure
    with burn_tracker._get_conn() as conn:
        conn.execute("DELETE FROM app_burn_records WHERE tx_signature = 'TEST_SIG_UNITTEST_1'")
        conn.commit()

@pytest.mark.asyncio
async def test_burn_tracker_anti_replay_deduplication():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "user_address": "TestUserReplay22222222222222222222222222222222",
            "amount_cookie": 10.0,
            "tx_signature": "TEST_SIG_ANTI_REPLAY_999",
            "source": "user_oven",
            "slot": 26105100
        }
        res1 = await ac.post("/api/v1/burn/record", json=payload)
        assert res1.status_code == 200
        data1 = res1.json()
        total_burned_after_first = data1["app_totals"]["total_burned_by_app"]
        total_events_after_first = data1["app_totals"]["total_burn_events"]
        first_rec_id = data1["burn_record"]["id"]

        # Attempt to replay the exact same on-chain signature
        res2 = await ac.post("/api/v1/burn/record", json=payload)
        assert res2.status_code == 200
        data2 = res2.json()

        # Must return the existing record and NOT double-count the burn!
        assert data2["burn_record"]["id"] == first_rec_id
        assert data2["app_totals"]["total_burned_by_app"] == total_burned_after_first
        assert data2["app_totals"]["total_burn_events"] == total_events_after_first

    with burn_tracker._get_conn() as conn:
        conn.execute("DELETE FROM app_burn_records WHERE tx_signature = 'TEST_SIG_ANTI_REPLAY_999'")
        conn.commit()

@pytest.mark.asyncio
async def test_telemetry_ping_with_burn_and_karma_metrics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "agent_id": "sentinel-3d-prime",
            "memo": "telemetry:3d-centinela-sync",
            "user_address": "HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV"
        }
        res = await ac.post("/api/v1/agent/ping", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "recorded"
        assert "app_totals" in data
        assert "total_burn_events" in data
        assert "total_karma_generated" in data
        assert "user_total_karma" in data
        assert "user_burn_count" in data

@pytest.mark.asyncio
async def test_rpc_proxy_whitelist_web3_compatibility():
    from app.main import validate_rpc_method
    # Must allow standard methods called by @solana/web3.js Connection
    validate_rpc_method({"method": "getSignatureStatuses", "params": []})
    validate_rpc_method({"method": "getBalance", "params": ["11111111111111111111111111111111"]})
    validate_rpc_method({"method": "getVersion", "params": []})
    validate_rpc_method({"method": "getFeeForMessage", "params": []})

@pytest.mark.asyncio
async def test_burn_sync_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        test_addr = "HSPEiMn8BYVgPZdHMXw3XkwfdAZksemaR7X5KS6eFmFV"
        res = await ac.get(f"/api/v1/burn/sync/{test_addr}")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "synced"
        assert "app_totals" in data
        assert "user_stats" in data
        assert "user_karma" in data
        assert data["app_totals"]["total_burned_by_app"] >= 160.0

