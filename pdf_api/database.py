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
        # URL encode password for special characters
        encoded_password = quote_plus(password)

        # Use SRV connection string like the main backend
        connection_string = (
            f"mongodb+srv://{username}:{encoded_password}@{cluster}/"
            f"{database_name}?retryWrites=true&w=majority&appName=DentalAI&"
            "serverSelectionTimeoutMS=5000&connectTimeoutMS=10000"
        )
        print(f"Connecting to MongoDB Atlas: {connection_string.replace(encoded_password, '***')}")

        print(f"Connecting to MongoDB Atlas: {connection_string.replace(encoded_password, '***')}")

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