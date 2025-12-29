# Assign Your Assignment - Project Setup

## ✅ Status: FULLY RUNNING
- **Frontend**: React app on port 5000 ✅
- **Backend**: FastAPI on port 8000 ✅  
- **Database**: MongoDB connected ✅
- **Admin Credentials**: username=`admin`, password=`admin123` ✅
- **Subjects**: 7 subjects loaded and displaying ✅

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Shadcn UI, React Router, Axios
- **Backend**: FastAPI, MongoDB with Motor, JWT Auth, Bcrypt, Cashfree payments, Resend email
- **Payment**: Cashfree (PROD)
- **Email**: Resend

## Running the App
Both services run automatically:
- Frontend: http://localhost:5000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Available Subjects
- Economics (1 project)
- Accountancy (0 projects)
- Business Studies (BST) (0 projects)
- Physical Education (0 projects)
- Plus 3 additional subjects

## Admin Dashboard
- Login: `/admin/login`
- Credentials: `admin` / `admin123`
- Manage subjects, projects, and orders
- View dashboard statistics

## Key Features
- Browse projects by subject
- Secure checkout with Cashfree
- Instant PDF download after payment
- Admin dashboard for content management
- Email delivery with Resend

## How to Use
1. Click "Browse Projects" to explore subjects
2. Login as admin at `/admin/login` to manage content
3. Add new subjects and projects from admin panel
4. Test payment with Cashfree sandbox

## Recent Fixes
- ✅ Set up admin user in database
- ✅ Configured frontend-backend proxy
- ✅ Fixed REACT_APP_BACKEND_URL configuration
- ✅ Verified all API endpoints working
- ✅ Subjects loading and displaying correctly

## Next Steps
- Add CRT-specific subjects via admin panel
- Create projects with PDF uploads
- Test payment flow
- Configure email notifications
