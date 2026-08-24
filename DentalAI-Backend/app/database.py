"""
MongoDB Database Connection Manager
FastAPI + Motor + MongoDB Atlas Integration
"""

import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from typing import Optional
from bson import ObjectId
from datetime import datetime
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

class Database:
    """
    Singleton database connection manager for MongoDB Atlas.
    Ensures proper connection lifecycle and type safety.
    """

    # Class variables - singleton pattern
    _client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None
    _is_connected: bool = False

    @classmethod
    async def connect_to_mongo(cls) -> None:
        """
        Establish connection to MongoDB Atlas with proper error handling.
        Uses SRV connection string for Atlas clusters.
        """
        if cls._is_connected:
            logger.info("Database already connected")
            return

        try:
            # Secure Database Connection relying entirely on environment variables
            connection_string = os.getenv("MONGODB_URL")
            database_name = os.getenv("MONGODB_NAME", "dental_ai")
            
            if not connection_string:
                print("WARNING: MONGODB_URL is not set. Defaulting to localhost:27017")
                connection_string = "mongodb://127.0.0.1:27017"
            
            # Remove any whitespace from the URL
            connection_string = connection_string.strip()

            logger.info(f"Connecting to MongoDB: {connection_string.split('@')[-1]}")

            # Create client with proper configuration for both local and cloud
            cls._client = AsyncIOMotorClient(
                connection_string,
                serverSelectionTimeoutMS=15000, # Increased timeout for cloud
                connectTimeoutMS=20000,
                maxPoolSize=50,
                minPoolSize=10,
                retryWrites=True,
                retryReads=True
            )

            # Get database reference
            cls._db = cls._client[database_name]

            # Test connection with ping
            try:
                await cls._client.admin.command('ping')
                cls._is_connected = True
                logger.info("Connected to MongoDB successfully!")
                print("Connected to MongoDB successfully!")

            except (ConnectionFailure, ServerSelectionTimeoutError) as ping_error:
                logger.error(f"MongoDB connection failed: {ping_error}")
                print(f"ERROR: Could not connect to MongoDB at {connection_string.split('@')[-1]}")
                print("HINT: If using Atlas, ensure 'dnspython' is installed and your IP is whitelisted.")
                # Reset state since ping failed
                cls._client = None
                cls._db = None
                cls._is_connected = False

        except Exception as e:
            logger.critical(f"FATAL Exception during MongoDB connection: {e}")
            print(f"CRITICAL ERROR: {str(e)}")
            cls._client = None
            cls._db = None
            cls._is_connected = False

    @classmethod
    async def close_mongo_connection(cls) -> None:
        """Close MongoDB connection gracefully"""
        if cls._client:
            cls._client.close()
            logger.info("MongoDB connection closed")
            print("MongoDB connection closed")
            cls._client = None
            cls._db = None
            cls._is_connected = False

    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase:
        """
        Get database instance with type safety.
        Always returns AsyncIOMotorDatabase or raises exception.
        """
        if not cls._is_connected or cls._db is None:
            raise ConnectionError(
                "Database not connected. Call connect_to_mongo() first. "
                f"Connected: {cls._is_connected}, DB: {type(cls._db)}"
            )

        # Type check - ensure we never return wrong type
        if not isinstance(cls._db, AsyncIOMotorDatabase):
            raise RuntimeError(
                f"Database object is wrong type: {type(cls._db)}. "
                "Expected AsyncIOMotorDatabase."
            )

        return cls._db

    @classmethod
    def is_connected(cls) -> bool:
        """Check if database is connected"""
        return cls._is_connected

    @classmethod
    async def health_check(cls) -> dict:
        """Perform database health check"""
        try:
            if not cls._is_connected:
                return {"status": "disconnected", "error": "Not connected"}

            # Try to ping
            await cls._client.admin.command('ping')

            # Get basic stats
            db_stats = await cls._db.command('dbStats')

            return {
                "status": "healthy",
                "database": cls._db.name,
                "collections": await cls._db.list_collection_names(),
                "stats": {
                    "collections": db_stats.get('collections', 0),
                    "objects": db_stats.get('objects', 0),
                    "dataSize": db_stats.get('dataSize', 0),
                    "storageSize": db_stats.get('storageSize', 0)
                }
            }

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

# Backward compatibility functions
async def connect_to_mongo():
    """Establish connection to MongoDB Atlas"""
    await Database.connect_to_mongo()

async def close_mongo_connection():
    """Close MongoDB connection"""
    await Database.close_mongo_connection()

def get_database():
    """Get database instance"""
    return Database.get_database()
