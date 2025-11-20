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
            # MongoDB Atlas credentials
            username = "akila_user"
            password = "WGH7Qd8@apUNh$z"
            cluster = "cluster0.qwwrokd.mongodb.net"
            database_name = "dental_ai"

            # URL encode password for special characters
            encoded_password = quote_plus(password)

            # MongoDB Atlas SRV connection string
            # Format: mongodb+srv://username:password@cluster/database?options
            connection_string = (
                f"mongodb+srv://{username}:{encoded_password}@{cluster}/"
                f"{database_name}?retryWrites=true&w=majority&appName=DentalAI&"
                "serverSelectionTimeoutMS=5000&connectTimeoutMS=10000"
            )

            logger.info(f"Connecting to MongoDB Atlas: {connection_string.replace(encoded_password, '***')}")

            # Create client with proper configuration
            cls._client = AsyncIOMotorClient(
                connection_string,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                maxPoolSize=10,
                minPoolSize=5
            )

            # Get database reference
            cls._db = cls._client[database_name]

            # Test connection with ping
            try:
                await cls._client.admin.command('ping')
                cls._is_connected = True
                logger.info("Connected to MongoDB Atlas successfully!")
                print("Connected to MongoDB Atlas successfully!")

                # Log connection details
                server_info = await cls._client.server_info()
                logger.info(f"MongoDB version: {server_info.get('version', 'Unknown')}")

            except (ConnectionFailure, ServerSelectionTimeoutError) as ping_error:
                logger.warning(f"MongoDB Atlas ping failed: {ping_error}")
                print(f"MongoDB Atlas not available - continuing without database")
                # Reset state since ping failed
                cls._client = None
                cls._db = None
                cls._is_connected = False

        except Exception as e:
            logger.warning(f"Failed to connect to MongoDB Atlas: {e}")
            print(f"MongoDB Atlas not available - continuing without database")
            # Reset state but don't raise exception
            cls._client = None
            cls._db = None
            cls._is_connected = False
            # Reset state but don't raise exception
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
