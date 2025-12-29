# Assign Your Assignment - Project Setup

## Overview
A modern platform for buying and selling academic project PDFs. Users can browse projects by subject, securely checkout, and instantly download PDFs.

## Current Status ✅
- **Frontend**: React app running on port 5000
- **Backend**: FastAPI running on port 8000  
- **Database**: MongoDB connected (cluster0.qipvo.mongodb.net)
- **Both services are RUNNING and communicating**

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Shadcn UI, React Router, Axios
- **Backend**: FastAPI, MongoDB with Motor, JWT Auth, Bcrypt, Cashfree payments, Resend email
- **Payment**: Cashfree integration (PROD environment)
- **Email**: Resend email delivery

## Project Structure
```
├── frontend/          # React web app
│   ├── src/
│   │   ├── pages/    # HomePage, SubjectsPage, ProjectsPage, Admin pages
│   │   ├── components/ # UI components from Shadcn
│   │   └── lib/      # API client and utilities
│   └── package.json
│
├── backend/           # FastAPI server
│   ├── server.py      # Main application
│   ├── requirements.txt
│   ├── uploads/       # PDF storage
│   └── .env           # Environment variables
```

## Running the App
Both services start automatically:
- Frontend: http://localhost:5000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Available Subjects (in Database)
- Economics
- Accountancy  
- Business Studies (BST)
- Physical Education
- (Plus any CRT subjects that have been added)

## Admin Features
- Login at `/admin/login`
- Manage subjects, projects, and orders
- View dashboard statistics

## Recent Changes
- ✅ Installed Python 3.11 and Node.js 20
- ✅ Installed all backend dependencies
- ✅ Installed all frontend dependencies  
- ✅ Configured frontend .env to connect to localhost:8000
- ✅ Both workflows are running and communicating
- ✅ Subjects loading successfully from database

## Next Steps
- Add CRT-specific subjects via Admin Dashboard
- Create sample projects with PDFs
- Test payment flow with Cashfree
- Test email delivery with Resend
