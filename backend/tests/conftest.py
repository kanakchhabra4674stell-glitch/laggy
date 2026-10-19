import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import Base
from app.services.seed_data import seed_database

TEST_DB_URL = "sqlite:///./test_pauseai.db"

@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    seed_database(db)
    db.close()
    yield engine
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_pauseai.db"):
        os.remove("./test_pauseai.db")

@pytest.fixture(scope="function")
def db_session(test_engine):
    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()
