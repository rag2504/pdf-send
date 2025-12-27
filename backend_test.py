#!/usr/bin/env python3
"""
Backend API Testing for Assign Your Assignment
Tests all CRUD operations, authentication, and payment flows
"""

import requests
import sys
import json
from datetime import datetime
from pathlib import Path

class AssignYourAssignmentTester:
    def __init__(self, base_url="https://projectbuy.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, headers=headers, data=data, files=files, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_admin_setup_and_login(self):
        """Test admin setup and authentication"""
        print("\n🔍 Testing Admin Authentication...")
        
        # Setup admin
        self.run_test("Admin Setup", "POST", "admin/setup", 200)
        
        # Login with correct credentials
        success, response = self.run_test(
            "Admin Login (Valid)", 
            "POST", 
            "admin/login", 
            200,
            data={"username": "admin", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token[:20]}...")
        
        # Test invalid credentials
        self.run_test(
            "Admin Login (Invalid)", 
            "POST", 
            "admin/login", 
            401,
            data={"username": "admin", "password": "wrong"}
        )
        
        # Verify token
        if self.token:
            self.run_test("Admin Verify", "GET", "admin/verify", 200)

    def test_subjects_crud(self):
        """Test subjects CRUD operations"""
        print("\n🔍 Testing Subjects CRUD...")
        
        # Seed data first
        self.run_test("Seed Data", "POST", "seed", 200)
        
        # Get subjects
        success, subjects = self.run_test("Get Subjects", "GET", "subjects", 200)
        
        if success and subjects:
            print(f"   Found {len(subjects)} subjects")
            # Test getting specific subject
            subject_id = subjects[0]['id']
            self.run_test(f"Get Subject {subject_id}", "GET", f"subjects/{subject_id}", 200)
        
        # Create new subject (requires auth)
        if self.token:
            success, new_subject = self.run_test(
                "Create Subject", 
                "POST", 
                "subjects", 
                200,
                data={
                    "name": "Test Subject",
                    "description": "Test subject for API testing",
                    "icon": "🧪"
                }
            )
            
            if success and 'id' in new_subject:
                subject_id = new_subject['id']
                
                # Update subject
                self.run_test(
                    "Update Subject", 
                    "PUT", 
                    f"subjects/{subject_id}", 
                    200,
                    data={"description": "Updated description"}
                )
                
                # Delete subject
                self.run_test("Delete Subject", "DELETE", f"subjects/{subject_id}", 200)

    def test_projects_crud(self):
        """Test projects CRUD operations"""
        print("\n🔍 Testing Projects CRUD...")
        
        # Get projects
        self.run_test("Get All Projects", "GET", "projects", 200)
        
        # Get subjects first to use for project creation
        success, subjects = self.run_test("Get Subjects for Projects", "GET", "subjects", 200)
        
        if success and subjects and self.token:
            subject_id = subjects[0]['id']
            
            # Create a test PDF file
            test_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
            
            # Create project with file upload
            files = {'file': ('test_project.pdf', test_pdf_content, 'application/pdf')}
            data = {
                'title': 'Test Project',
                'description': 'Test project for API testing',
                'subject_id': subject_id,
                'price': '99.99'
            }
            
            success, project = self.run_test(
                "Create Project", 
                "POST", 
                "projects", 
                200,
                data=data,
                files=files
            )
            
            if success and 'id' in project:
                project_id = project['id']
                
                # Get specific project
                self.run_test(f"Get Project {project_id}", "GET", f"projects/{project_id}", 200)
                
                # Get projects by subject
                self.run_test("Get Projects by Subject", "GET", f"projects?subject_id={subject_id}", 200)
                
                # Update project
                update_data = {
                    'title': 'Updated Test Project',
                    'price': '149.99'
                }
                self.run_test(
                    "Update Project", 
                    "PUT", 
                    f"projects/{project_id}", 
                    200,
                    data=update_data
                )
                
                # Delete project
                self.run_test("Delete Project", "DELETE", f"projects/{project_id}", 200)

    def test_payment_flow(self):
        """Test payment and order creation"""
        print("\n🔍 Testing Payment Flow...")
        
        # Get projects first
        success, projects = self.run_test("Get Projects for Payment", "GET", "projects", 200)
        
        if success and projects:
            project_id = projects[0]['id'] if projects else None
            
            if project_id:
                # Create payment order
                payment_data = {
                    "customer_name": "Test Customer",
                    "customer_email": "test@example.com",
                    "customer_phone": "+919876543210",
                    "project_id": project_id
                }
                
                success, order = self.run_test(
                    "Create Payment Order", 
                    "POST", 
                    "payments/create-order", 
                    200,
                    data=payment_data
                )
                
                if success and 'order_id' in order:
                    order_id = order['order_id']
                    
                    # Verify payment (will be pending since no real payment)
                    self.run_test(f"Verify Payment {order_id}", "GET", f"payments/verify/{order_id}", 200)
                    
                    # Get order details
                    self.run_test(f"Get Order {order_id}", "GET", f"orders/{order_id}", 200)

    def test_admin_dashboard(self):
        """Test admin dashboard and orders"""
        print("\n🔍 Testing Admin Dashboard...")
        
        if self.token:
            # Get dashboard stats
            self.run_test("Get Dashboard Stats", "GET", "admin/dashboard", 200)
            
            # Get all orders (admin only)
            self.run_test("Get All Orders", "GET", "orders", 200)

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        # Try to access protected endpoints
        self.run_test("Unauthorized Dashboard", "GET", "admin/dashboard", 401)
        self.run_test("Unauthorized Create Subject", "POST", "subjects", 401, data={"name": "Test"})
        self.run_test("Unauthorized Get Orders", "GET", "orders", 401)
        
        # Restore token
        self.token = original_token

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Assign Your Assignment API Tests")
        print(f"Testing against: {self.api_url}")
        print("=" * 60)
        
        try:
            self.test_health_endpoints()
            self.test_admin_setup_and_login()
            self.test_subjects_crud()
            self.test_projects_crud()
            self.test_payment_flow()
            self.test_admin_dashboard()
            self.test_unauthorized_access()
            
        except Exception as e:
            print(f"\n❌ Test suite failed with exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            
            # Print failed tests
            failed_tests = [r for r in self.test_results if not r['success']]
            if failed_tests:
                print("\n❌ Failed Tests:")
                for test in failed_tests:
                    print(f"   - {test['test']}: {test['details']}")
            
            return 1

def main():
    tester = AssignYourAssignmentTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())