import os
import tempfile
import pytest

@pytest.fixture(scope="session", autouse=True)
def isolated_test_database():
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp_path = tmp.name
    tmp.close()
    
    os.environ["ATOMIC_VAULT_DB_PATH"] = tmp_path
    from app.cookie_atomic import cookie_atomic_engine
    cookie_atomic_engine.db_path = tmp_path
    cookie_atomic_engine._init_db()
    cookie_atomic_engine._load_state()

    yield tmp_path

    try:
        os.remove(tmp_path)
    except Exception:
        pass
