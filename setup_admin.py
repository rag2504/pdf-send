#!/usr/bin/env python3
"""
Script to setup admin account
"""
import asyncio
import os
import bcrypt
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

async def setup_admin():
    """Create admin account"""
    try:
        # Connect to MongoDB
        mongodb_uri = os.environ.get('MONGODB_URI')
        db_name = os.environ.get('DB_NAME', 'assign_your_assignment')
        
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[db_name]
        
        print("🔍 Checking for existing admin...")
        
        # Check if admin exists
        existing = await db.admins.find_one({"username": "admin"})
        if existing:
            print("✅ Admin already exists!")
            print("   Username: admin")
            print("   Password: admin123")
            client.close()
            return
        
        print("👤 Creating admin account...")
        
        # Create admin
        hashed_password = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt())
        admin_doc = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": hashed_password.decode(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.admins.insert_one(admin_doc)
        
        print("✅ Admin account created successfully!")
        print("   Username: admin")
        print("   Password: admin123")
        print("   Login URL: http://localhost:3000/admin/login")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(setup_admin())