#!/usr/bin/env python3
"""
Test Cashfree API integration
"""
import asyncio
import httpx
import json
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

async def test_cashfree():
    """Test Cashfree API connection"""
    try:
        app_id = os.environ.get('CASHFREE_APP_ID')
        secret_key = os.environ.get('CASHFREE_SECRET_KEY')
        api_url = os.environ.get('CASHFREE_API_URL', 'https://api.cashfree.com/pg')
        
        print("🔍 Testing Cashfree API...")
        print(f"   APP_ID: {app_id[:10]}...{app_id[-4:] if app_id else 'None'}")
        print(f"   API_URL: {api_url}")
        
        if not app_id or not secret_key:
            print("❌ Cashfree credentials not found!")
            return
        
        # Test order creation
        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
        }
        
        test_order_id = f"TEST_{str(uuid.uuid4())[:8]}"
        
        payload = {
            "order_id": test_order_id,
            "order_amount": 100.00,
            "order_currency": "INR",
            "customer_details": {
                "customer_id": "TEST_CUSTOMER",
                "customer_name": "Test User",
                "customer_email": "test@example.com",
                "customer_phone": "9999999999"
            },
            "order_meta": {
                "return_url": "https://projectbuy.preview.emergentagent.com/payment-status"
            }
        }
        
        print(f"📤 Creating test order: {test_order_id}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_url}/orders",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            print(f"📥 Response Status: {response.status_code}")
            print(f"📥 Response Headers: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                print(f"📥 Response Data: {json.dumps(response_data, indent=2)}")
                
                if response.status_code == 200:
                    print("✅ Cashfree API is working!")
                    if 'payment_session_id' in response_data:
                        print(f"🎯 Payment session ID: {response_data['payment_session_id']}")
                    else:
                        print("⚠️  No payment_session_id in response")
                else:
                    print(f"❌ API Error: {response_data}")
                    
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing Cashfree: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_cashfree())