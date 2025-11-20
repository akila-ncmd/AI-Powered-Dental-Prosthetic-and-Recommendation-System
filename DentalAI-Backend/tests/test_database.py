import pytest
from unittest.mock import patch, MagicMock
from app.database import Database

class TestDatabase:
    """Test cases for database operations"""

    @pytest.fixture(autouse=True)
    def reset_database_state(self):
        """Reset database state before each test"""
        Database._client = None
        Database._db = None
        Database._is_connected = False
        yield

    def test_get_database_without_connection(self):
        """Test getting database when not connected"""
        with pytest.raises(ConnectionError, match="Database not connected"):
            Database.get_database()

    def test_is_connected_false_by_default(self):
        """Test that database is not connected by default"""
        assert Database.is_connected() == False

    def test_is_connected_true_when_set(self):
        """Test that database connection status can be set"""
        Database._is_connected = True
        assert Database.is_connected() == True
        # Reset
        Database._is_connected = False

    def test_get_database_with_connection(self):
        """Test getting database when connected"""
        from motor.motor_asyncio import AsyncIOMotorDatabase

        # Create a mock that passes the isinstance check
        mock_db = MagicMock(spec=AsyncIOMotorDatabase)
        Database._db = mock_db
        Database._is_connected = True

        result = Database.get_database()
        assert result == mock_db