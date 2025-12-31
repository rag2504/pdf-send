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
import json
import hmac
import hashlib
import base64
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGODB_URI']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Email configuration (Gmail SMTP)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USER = os.environ.get('EMAIL_USER', '')
EMAIL_PASS = os.environ.get('EMAIL_PASS', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'BoxCric <boxcrick3@gmail.com>')

# Razorpay configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_SECRET_KEY = os.environ.get('RAZORPAY_SECRET_KEY', '')
RAZORPAY_API_URL = os.environ.get('RAZORPAY_API_URL', 'https://api.razorpay.com/v1')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'assign-your-assignment-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Parul Creation API")
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
    """Send PDF via email using Gmail SMTP"""
    try:
        if not EMAIL_USER or not EMAIL_PASS:
            logger.warning("Email credentials not configured, skipping email")
            return False
        
        # Read PDF file
        async with aiofiles.open(pdf_path, 'rb') as f:
            pdf_content = await f.read()
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = customer_email
        msg['Subject'] = f"Your Project PDF - {project_title}"
        
        # Email body
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #0F172A;">Thank You for Your Purchase!</h1>
                <p>Hi {customer_name},</p>
                <p>Thank you for purchasing from <strong>Parul Creation</strong>.</p>
                <p>Your project PDF "<strong>{project_title}</strong>" is attached to this email.</p>
                <hr style="border: 1px solid #E2E8F0; margin: 20px 0;">
                <p style="color: #64748B; font-size: 14px;">
                    If you have any questions, please contact us.<br>
                    Best regards,<br>
                    Parul Creation Team
                </p>
            </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Attach PDF
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(pdf_content)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename= {project_title}.pdf')
        msg.attach(part)
        
        # Send email via SMTP with retry
        def send_email():
            max_retries = 2
            for attempt in range(max_retries):
                try:
                    server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=15)
                    server.starttls()
                    server.login(EMAIL_USER, EMAIL_PASS)
                    server.sendmail(EMAIL_USER, [customer_email], msg.as_string())
                    server.close()
                    logger.info(f"Email sent successfully to {customer_email}")
                    return True
                except smtplib.SMTPAuthenticationError as e:
                    logger.error(f"Gmail authentication failed")
                    logger.error(f"Check: 1. App password at https://myaccount.google.com/apppasswords")
                    logger.error(f"Check: 2. Enable 2FA first if needed")
                    return False
                except (smtplib.SMTPException, ConnectionError, TimeoutError) as e:
                    logger.warning(f"SMTP connection error (attempt {attempt + 1}/{max_retries}): {str(e)}")
                    if attempt < max_retries - 1:
                        import time
                        time.sleep(1)  # Wait before retry
                        continue
                    logger.error(f"Failed to send email after {max_retries} attempts")
                    return False
                except Exception as e:
                    logger.error(f"SMTP error: {str(e)}")
                    return False
            return False
        
        # Run in thread pool
        result = await asyncio.to_thread(send_email)
        return result
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
    """Create a Razorpay payment order"""
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
        "razorpay_order_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Create Razorpay order
    if RAZORPAY_KEY_ID and RAZORPAY_SECRET_KEY:
        logger.info(f"Creating Razorpay order with KEY_ID: {RAZORPAY_KEY_ID[:10]}...")
        try:
            auth = (RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY)
            payload = {
                "amount": int(project["price"] * 100),  # Amount in paise
                "currency": "INR",
                "receipt": order_id,
                "notes": {
                    "customer_name": data.customer_name,
                    "customer_email": data.customer_email,
                    "customer_phone": data.customer_phone,
                    "project_id": project["id"],
                    "project_title": project["title"]
                }
            }
            
            logger.info(f"Razorpay payload: {payload}")
            
            async with httpx.AsyncClient() as client_http:
                response = await client_http.post(
                    f"{RAZORPAY_API_URL}/orders",
                    auth=auth,
                    json=payload
                )
                
                logger.info(f"Razorpay response status: {response.status_code}")
                logger.info(f"Razorpay response: {response.text}")
                
                if response.status_code == 200:
                    rp_data = response.json()
                    order_doc["razorpay_order_id"] = rp_data.get("id")
                    logger.info(f"Razorpay order created successfully: {rp_data.get('id')}")
                else:
                    logger.error(f"Razorpay error: {response.text}")
                    raise Exception(f"Razorpay API error: {response.status_code}")
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Payment gateway error: {str(e)}")
    else:
        logger.error("Razorpay credentials missing")
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
    
    await db.orders.insert_one(order_doc)
    
    return {
        "order_id": order_id,
        "razorpay_order_id": order_doc.get("razorpay_order_id"),
        "amount": project["price"],
        "project_title": project["title"],
        "key_id": RAZORPAY_KEY_ID
    }

@api_router.post("/payments/webhook")
async def payment_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Razorpay payment webhook"""
    try:
        body = await request.body()
        data = json.loads(body)
        
        logger.info(f"Webhook received: {data}")
        
        if data.get("event") == "payment.authorized":
            razorpay_payment_id = data.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
            razorpay_order_id = data.get("payload", {}).get("payment", {}).get("entity", {}).get("order_id")
            
            if razorpay_order_id:
                # Find order by razorpay_order_id
                order = await db.orders.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
                if order:
                    await db.orders.update_one(
                        {"razorpay_order_id": razorpay_order_id},
                        {"$set": {"payment_status": "PAID", "razorpay_payment_id": razorpay_payment_id}}
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

@api_router.post("/payments/demo-complete/{order_id}")
async def complete_demo_payment(order_id: str, background_tasks: BackgroundTasks):
    """Complete a demo payment for testing"""
    try:
        logger.info(f"Completing demo payment for order: {order_id}")
        
        # Find the order
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order:
            logger.error(f"Order not found: {order_id}")
            # Try to find by order_id field as well
            order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")
        
        logger.info(f"Found order: {order}")
        
        # Mark as paid - update both possible ID fields
        result1 = await db.orders.update_one(
            {"id": order_id},
            {"$set": {"payment_status": "SUCCESS"}}
        )
        result2 = await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"payment_status": "SUCCESS"}}
        )
        
        logger.info(f"Update results - id field: {result1.modified_count}, order_id field: {result2.modified_count}")
        
        # Send email notification
        project = await db.projects.find_one({"id": order["project_id"]}, {"_id": 0})
        if project:
            logger.info(f"Sending email for project: {project['title']}")
            pdf_path = str(UPLOAD_DIR / project["file_name"])
            background_tasks.add_task(
                send_pdf_email,
                order["customer_email"],
                order["customer_name"],
                project["title"],
                pdf_path
            )
        else:
            logger.warning(f"Project not found for order: {order_id}")
        
        return {"message": "Demo payment completed successfully"}
        
    except Exception as e:
        logger.error(f"Demo payment completion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to complete demo payment: {str(e)}")

@api_router.post("/payments/verify-payment")
async def verify_payment(data: dict, background_tasks: BackgroundTasks):
    """Verify Razorpay payment and trigger email if paid"""
    try:
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_signature = data.get("razorpay_signature")
        
        # Find order by razorpay_order_id
        order = await db.orders.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Verify signature
        if RAZORPAY_SECRET_KEY:
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            signature = hmac.new(
                RAZORPAY_SECRET_KEY.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if signature != razorpay_signature:
                raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Check payment status with Razorpay API if pending
        if order["payment_status"] == "PENDING" and RAZORPAY_KEY_ID and RAZORPAY_SECRET_KEY:
            try:
                auth = (RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY)
                async with httpx.AsyncClient() as client_http:
                    response = await client_http.get(
                        f"{RAZORPAY_API_URL}/payments/{razorpay_payment_id}",
                        auth=auth
                    )
                    
                    if response.status_code == 200:
                        payment_data = response.json()
                        if payment_data.get("status") == "captured":
                            await db.orders.update_one(
                                {"razorpay_order_id": razorpay_order_id},
                                {"$set": {"payment_status": "PAID", "razorpay_payment_id": razorpay_payment_id}}
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
    except Exception as e:
        logger.error(f"Payment verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

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
    # Try both id and order_id fields
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Accept both PAID and SUCCESS status
    if order["payment_status"] not in ["PAID", "SUCCESS"]:
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
    return {"message": "Parul Creation API", "status": "running"}

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

if __name__ == "__main__":
    import uvicorn
    
    # Print configuration info
    print("🚀 Starting Parul Creation Backend...")
    print(f"📊 MongoDB: {'✅ Configured' if os.environ.get('MONGODB_URI') else '❌ Not configured'}")
    print(f"💳 Razorpay: {'✅ Configured' if RAZORPAY_KEY_ID and RAZORPAY_SECRET_KEY else '❌ Not configured'}")
    print(f"📧 Email: {'✅ Configured' if os.environ.get('EMAIL_USER') else '❌ Not configured'}")
    print(f"🌐 Environment: Production")
    print(f"🔗 API URL: {RAZORPAY_API_URL}")
    print("📡 Server starting on http://localhost:8000")
    print("📚 API Docs available at http://localhost:8000/docs")
    print("-" * 50)
    
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )