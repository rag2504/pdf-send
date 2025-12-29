#!/usr/bin/env python3
"""
Test Resend email integration
"""
import os
import resend
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

def test_resend():
    """Test Resend email API"""
    try:
        api_key = os.environ.get('RESEND_API_KEY')
        sender_email = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
        
        print("📧 Testing Resend API...")
        print(f"   API_KEY: {api_key[:10]}...{api_key[-4:] if api_key else 'None'}")
        print(f"   SENDER: {sender_email}")
        
        if not api_key:
            print("❌ Resend API key not found!")
            return
        
        # Set API key
        resend.api_key = api_key
        
        # Test email send
        print("📤 Sending test email...")
        
        params = {
            "from": sender_email,
            "to": ["assignurassignment@gmail.com"],  # Use your verified email
            "subject": "Test Email from PDF Assignment Platform",
            "html": """
            <h2>Test Email</h2>
            <p>This is a test email to verify Resend integration.</p>
            <p>If you receive this, the email service is working correctly!</p>
            """
        }
        
        response = resend.Emails.send(params)
        
        print(f"📥 Response: {response}")
        
        if response.get('id'):
            print("✅ Resend API is working!")
            print(f"🎯 Email ID: {response['id']}")
        else:
            print(f"❌ Email send failed: {response}")
            
    except Exception as e:
        print(f"❌ Error testing Resend: {str(e)}")

if __name__ == "__main__":
    test_resend()