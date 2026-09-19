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

    # Clean up test row so state stays pure
    with burn_tracker._get_conn() as conn:
        conn.execute("DELETE FROM app_burn_records WHERE tx_signature = 'TEST_SIG_UNITTEST_1'")
        conn.commit()
