#!/usr/bin/env python3
"""
Script to clean up duplicate subjects in the database
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

async def cleanup_duplicates():
    """Remove duplicate subjects from database"""
    try:
        # Connect to MongoDB
        mongodb_uri = os.environ.get('MONGODB_URI')
        db_name = os.environ.get('DB_NAME', 'assign_your_assignment')
        
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[db_name]
        
        print("🔍 Finding duplicate subjects...")
        
        # Get all subjects
        subjects = await db.subjects.find({}, {"_id": 0}).to_list(None)
        print(f"📊 Found {len(subjects)} total subjects")
        
        # Find duplicates by name
        seen_names = set()
        duplicates = []
        unique_subjects = []
        
        for subject in subjects:
            name = subject.get('name', '').strip().lower()
            if name in seen_names:
                duplicates.append(subject)
                print(f"🔄 Duplicate found: {subject.get('name')}")
            else:
                seen_names.add(name)
                unique_subjects.append(subject)
        
        if duplicates:
            print(f"🗑️  Removing {len(duplicates)} duplicate subjects...")
            
            # Remove all subjects
            await db.subjects.delete_many({})
            
            # Insert only unique subjects
            if unique_subjects:
                await db.subjects.insert_many(unique_subjects)
            
            print(f"✅ Cleanup complete! Kept {len(unique_subjects)} unique subjects")
        else:
            print("✅ No duplicates found!")
        
        # List final subjects
        final_subjects = await db.subjects.find({}, {"_id": 0, "name": 1}).to_list(None)
        print("\n📋 Final subjects list:")
        for i, subject in enumerate(final_subjects, 1):
            print(f"  {i}. {subject.get('name')}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(cleanup_duplicates())