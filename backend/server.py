from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Request, BackgroundTasks
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import aiofiles
import asyncio
import resend
import json
import hmac
import hashlib
import base64
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Cashfree configuration
CASHFREE_APP_ID = os.environ.get('CASHFREE_APP_ID', '')
CASHFREE_SECRET_KEY = os.environ.get('CASHFREE_SECRET_KEY', '')
CASHFREE_ENV = os.environ.get('CASHFREE_ENV', 'TEST')  # TEST or PROD
CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg" if CASHFREE_ENV == "TEST" else "https://api.cashfree.com/pg"

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'assign-your-assignment-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Assign Your Assignment API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class AdminCreate(BaseModel):
    username: str
    password: str

class AdminLogin(BaseModel):
    username: str
    password: str

class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "📚"

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None

class SubjectResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    project_count: int = 0
    created_at: str

class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str
    subject_id: str
    subject_name: str
    price: float
    file_name: str
    created_at: str

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    project_id: str

class OrderResponse(BaseModel):
    id: str
    order_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    project_id: str
    project_title: str
    subject_name: str
    amount: float
    payment_status: str
    cashfree_order_id: Optional[str] = None
    created_at: str

class PaymentInitiate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    project_id: str

# ============ HELPER FUNCTIONS ============

def create_jwt_token(admin_id: str, username: str) -> str:
    payload = {
        "sub": admin_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    return verify_jwt_token(token)

async def send_pdf_email(customer_email: str, customer_name: str, project_title: str, pdf_path: str):
    """Send PDF via email using Resend"""
    try:
        if not resend.api_key:
            logger.warning("Resend API key not configured, skipping email")
            return False
        
        # Read PDF file
        async with aiofiles.open(pdf_path, 'rb') as f:
            pdf_content = await f.read()
        
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
        
        params = {
            "from": SENDER_EMAIL,
            "to": [customer_email],
            "subject": f"Your Project PDF - {project_title}",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #0F172A;">Thank You for Your Purchase!</h1>
                <p>Hi {customer_name},</p>
                <p>Thank you for purchasing from <strong>Assign Your Assignment</strong>.</p>
                <p>Your project PDF "<strong>{project_title}</strong>" is attached to this email.</p>
                <hr style="border: 1px solid #E2E8F0; margin: 20px 0;">
                <p style="color: #64748B; font-size: 14px;">
                    If you have any questions, please contact us.<br>
                    Best regards,<br>
                    Assign Your Assignment Team
                </p>
            </div>
            """,
            "attachments": [
                {
                    "filename": f"{project_title}.pdf",
                    "content": pdf_base64
                }
            ]
        }
        
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {customer_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

# ============ ADMIN ROUTES ============

@api_router.post("/admin/setup")
async def setup_admin():
    """Create default admin if not exists"""
    existing = await db.admins.find_one({"username": "admin"})
    if existing:
        return {"message": "Admin already exists"}
    
    hashed_password = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt())
    admin_doc = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "password": hashed_password.decode(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    return {"message": "Admin created", "username": "admin", "password": "admin123"}

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    admin = await db.admins.find_one({"username": data.username}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(data.password.encode(), admin["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(admin["id"], admin["username"])
    return {"token": token, "username": admin["username"]}

@api_router.get("/admin/verify")
async def verify_admin(admin: dict = Depends(get_current_admin)):
    return {"valid": True, "username": admin["username"]}

@api_router.get("/admin/dashboard")
async def get_dashboard(admin: dict = Depends(get_current_admin)):
    """Get dashboard statistics"""
    total_subjects = await db.subjects.count_documents({})
    total_projects = await db.projects.count_documents({})
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.count_documents({"payment_status": "PAID"})
    
    # Calculate total revenue
    revenue_cursor = db.orders.aggregate([
        {"$match": {"payment_status": "PAID"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ])
    revenue_result = await revenue_cursor.to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_subjects": total_subjects,
        "total_projects": total_projects,
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "total_revenue": total_revenue,
        "recent_orders": recent_orders
    }

# ============ SUBJECT ROUTES ============

@api_router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects():
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(100)
    for subject in subjects:
        count = await db.projects.count_documents({"subject_id": subject["id"]})
        subject["project_count"] = count
    return subjects

@api_router.get("/subjects/{subject_id}")
async def get_subject(subject_id: str):
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    subject["project_count"] = await db.projects.count_documents({"subject_id": subject_id})
    return subject

@api_router.post("/subjects", response_model=SubjectResponse)
async def create_subject(data: SubjectCreate, admin: dict = Depends(get_current_admin)):
    subject_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description,
        "icon": data.icon,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subjects.insert_one(subject_doc)
    # Remove MongoDB's _id before returning
    subject_doc.pop("_id", None)
    subject_doc["project_count"] = 0
    return subject_doc

@api_router.put("/subjects/{subject_id}")
async def update_subject(subject_id: str, data: SubjectUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.subjects.update_one({"id": subject_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    return subject

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, admin: dict = Depends(get_current_admin)):
    # Check if there are projects under this subject
    project_count = await db.projects.count_documents({"subject_id": subject_id})
    if project_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete subject with {project_count} projects")
    
    result = await db.subjects.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted"}

# ============ PROJECT ROUTES ============

@api_router.get("/projects")
async def get_projects(subject_id: Optional[str] = None):
    query = {"subject_id": subject_id} if subject_id else {}
    projects = await db.projects.find(query, {"_id": 0}).to_list(100)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@api_router.post("/projects")
async def create_project(
    title: str = Form(...),
    description: str = Form(...),
    subject_id: str = Form(...),
    price: float = Form(...),
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    # Verify subject exists
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Save file
    project_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1] or ".pdf"
    file_name = f"{project_id}{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    project_doc = {
        "id": project_id,
        "title": title,
        "description": description,
        "subject_id": subject_id,
        "subject_name": subject["name"],
        "price": price,
        "file_name": file_name,
        "original_file_name": file.filename,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project_doc)
    # Remove MongoDB's _id before returning
    project_doc.pop("_id", None)
    return project_doc

@api_router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    title: str = Form(None),
    description: str = Form(None),
    subject_id: str = Form(None),
    price: float = Form(None),
    file: Optional[UploadFile] = File(None),
    admin: dict = Depends(get_current_admin)
):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = {}
    if title: update_data["title"] = title
    if description: update_data["description"] = description
    if price is not None: update_data["price"] = price
    
    if subject_id:
        subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        update_data["subject_id"] = subject_id
        update_data["subject_name"] = subject["name"]
    
    if file:
        # Delete old file
        old_file_path = UPLOAD_DIR / project["file_name"]
        if old_file_path.exists():
            old_file_path.unlink()
        
        # Save new file
        file_ext = os.path.splitext(file.filename)[1] or ".pdf"
        file_name = f"{project_id}{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        update_data["file_name"] = file_name
        update_data["original_file_name"] = file.filename
    
    if update_data:
        await db.projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated_project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return updated_project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, admin: dict = Depends(get_current_admin)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete file
    file_path = UPLOAD_DIR / project["file_name"]
    if file_path.exists():
        file_path.unlink()
    
    await db.projects.delete_one({"id": project_id})
    return {"message": "Project deleted"}

# ============ ORDER & PAYMENT ROUTES ============

@api_router.post("/payments/create-order")
async def create_payment_order(data: PaymentInitiate):
    """Create a Cashfree payment order"""
    project = await db.projects.find_one({"id": data.project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    order_id = f"ORD_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8]}"
    
    # Create order in database first
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "customer_phone": data.customer_phone,
        "project_id": project["id"],
        "project_title": project["title"],
        "subject_name": project["subject_name"],
        "amount": project["price"],
        "payment_status": "PENDING",
        "cashfree_order_id": None,
        "payment_session_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Create Cashfree order
    if CASHFREE_APP_ID and CASHFREE_SECRET_KEY:
        try:
            headers = {
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY,
                "x-api-version": "2023-08-01",
                "Content-Type": "application/json"
            }
            
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
            
            payload = {
                "order_id": order_id,
                "order_amount": project["price"],
                "order_currency": "INR",
                "customer_details": {
                    "customer_id": f"CUST_{str(uuid.uuid4())[:8]}",
                    "customer_name": data.customer_name,
                    "customer_email": data.customer_email,
                    "customer_phone": data.customer_phone
                },
                "order_meta": {
                    "return_url": f"{frontend_url}/payment-status?order_id={order_id}"
                }
            }
            
            async with httpx.AsyncClient() as client_http:
                response = await client_http.post(
                    f"{CASHFREE_BASE_URL}/orders",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    cf_data = response.json()
                    order_doc["cashfree_order_id"] = cf_data.get("cf_order_id")
                    order_doc["payment_session_id"] = cf_data.get("payment_session_id")
                else:
                    logger.error(f"Cashfree error: {response.text}")
        except Exception as e:
            logger.error(f"Cashfree order creation failed: {str(e)}")
    
    await db.orders.insert_one(order_doc)
    
    return {
        "order_id": order_id,
        "cashfree_order_id": order_doc.get("cashfree_order_id"),
        "payment_session_id": order_doc.get("payment_session_id"),
        "amount": project["price"],
        "project_title": project["title"]
    }

@api_router.post("/payments/webhook")
async def payment_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Cashfree payment webhook"""
    try:
        body = await request.body()
        data = json.loads(body)
        
        logger.info(f"Webhook received: {data}")
        
        order_id = data.get("data", {}).get("order", {}).get("order_id")
        payment_status = data.get("data", {}).get("payment", {}).get("payment_status")
        
        if order_id and payment_status == "SUCCESS":
            # Update order status
            order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
            if order:
                await db.orders.update_one(
                    {"order_id": order_id},
                    {"$set": {"payment_status": "PAID"}}
                )
                
                # Get project and send email
                project = await db.projects.find_one({"id": order["project_id"]}, {"_id": 0})
                if project:
                    pdf_path = str(UPLOAD_DIR / project["file_name"])
                    background_tasks.add_task(
                        send_pdf_email,
                        order["customer_email"],
                        order["customer_name"],
                        project["title"],
                        pdf_path
                    )
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error"}

@api_router.get("/payments/verify/{order_id}")
async def verify_payment(order_id: str, background_tasks: BackgroundTasks):
    """Verify payment status and trigger email if paid"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check with Cashfree if pending
    if order["payment_status"] == "PENDING" and CASHFREE_APP_ID and CASHFREE_SECRET_KEY:
        try:
            headers = {
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY,
                "x-api-version": "2023-08-01"
            }
            
            async with httpx.AsyncClient() as client_http:
                response = await client_http.get(
                    f"{CASHFREE_BASE_URL}/orders/{order_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    cf_data = response.json()
                    if cf_data.get("order_status") == "PAID":
                        await db.orders.update_one(
                            {"order_id": order_id},
                            {"$set": {"payment_status": "PAID"}}
                        )
                        order["payment_status"] = "PAID"
                        
                        # Send email
                        project = await db.projects.find_one({"id": order["project_id"]}, {"_id": 0})
                        if project:
                            pdf_path = str(UPLOAD_DIR / project["file_name"])
                            background_tasks.add_task(
                                send_pdf_email,
                                order["customer_email"],
                                order["customer_name"],
                                project["title"],
                                pdf_path
                            )
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
    
    return order

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(admin: dict = Depends(get_current_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ============ FILE DOWNLOAD ============

@api_router.get("/download/{order_id}")
async def download_project(order_id: str):
    """Download project PDF for paid orders"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["payment_status"] != "PAID":
        raise HTTPException(status_code=403, detail="Payment not completed")
    
    project = await db.projects.find_one({"id": order["project_id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    file_path = UPLOAD_DIR / project["file_name"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=f"{project['title']}.pdf",
        media_type="application/pdf"
    )

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_data():
    """Seed initial subjects"""
    subjects = [
        {"name": "Economics", "description": "Projects related to Economics and Financial Studies", "icon": "📊"},
        {"name": "Accountancy", "description": "Accounting and Financial Management projects", "icon": "📒"},
        {"name": "Business Studies (BST)", "description": "Business Studies and Management projects", "icon": "💼"},
        {"name": "Physical Education", "description": "Sports and Physical Education projects", "icon": "🏃"},
    ]
    
    for subject in subjects:
        existing = await db.subjects.find_one({"name": subject["name"]})
        if not existing:
            subject["id"] = str(uuid.uuid4())
            subject["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.subjects.insert_one(subject)
    
    return {"message": "Seed data created"}

# ============ ROOT ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Assign Your Assignment API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
