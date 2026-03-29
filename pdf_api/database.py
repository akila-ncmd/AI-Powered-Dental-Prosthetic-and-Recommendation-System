# PDF API Database Module
# Connects to MongoDB Atlas for optional database functionality

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from urllib.parse import quote_plus

# Database connection configuration
USE_DATABASE = True  # Enable database for PDF generation

# MongoDB Atlas credentials
username = "akila_user"
password = "WGH7Qd8@apUNh$z"
cluster = "cluster0.qwwrokd.mongodb.net"
database_name = "dental_ai"

# Global variables
client = None
db = None
DB_CONNECTED = False

def connect_to_database():
    """Connect to MongoDB Atlas with proper error handling"""
    global client, db, DB_CONNECTED

    if not USE_DATABASE:
        print("Database disabled for PDF API - working in offline mode")
        return False

    if DB_CONNECTED:
        return True

    try:
        import os
        from urllib.parse import quote_plus
        
        # Secure Database Connection relying entirely on environment variables
        connection_string = os.getenv("MONGODB_URL")
        database_name = "dental_ai"
        
        if not connection_string:
            print("WARNING: MONGODB_URL is not set. Please set it in your local environment or Hugging Face Secrets.")
            print("To run locally, create a .env file with MONGODB_URL=mongodb+srv://...")

        print(f"Connecting to MongoDB Atlas: {connection_string.split('@')[-1]}")

        # Create MongoClient with timeout settings
        client = MongoClient(
            connection_string,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000
        )

        # Get database reference
        db = client[database_name]

        # Test connection with ping
        client.admin.command('ping')
        DB_CONNECTED = True
        print("Connected to MongoDB Atlas successfully!")
        return True

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"Failed to connect to MongoDB Atlas: {e}")
        print("PDF API will work without database connection for report generation")
        client = None
        db = None
        DB_CONNECTED = False
        return False
    except Exception as e:
        print(f"Unexpected error connecting to MongoDB: {e}")
        print("PDF API will work without database connection for report generation")
        client = None
        db = None
        DB_CONNECTED = False
        return False

def get_db():
    """Return the dental_ai database object."""
    if not USE_DATABASE or not DB_CONNECTED or db is None:
        raise ConnectionError("Database not connected. PDF API works without database for report generation.")
    return db

def is_db_connected():
    """Check if database is connected"""
    return DB_CONNECTED and USE_DATABASE

# Initialize database connection
connect_to_database()