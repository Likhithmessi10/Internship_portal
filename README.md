# APTRANSCO Internship Management Portal

The APTRANSCO Internship Management Portal is an enterprise-grade solution for managing student internships. It features a student portal, a dedicated standalone admin dashboard, and a robust Node.js/Prisma backend.

## 🚀 Key Features

### 🎓 For Students
- **Profile Builder**: Multi-step academic and experience profile setup.
- **Application Flow**: Single-click applications to internships with document upload.
- **NOC Generator**: Instant download of official APTRANSCO No Objection Certificate (NOC) templates.
- **Tracking**: Real-time status updates (Pending, Shortlisted, Hired).

### 💼 For Administrators
- **Standalone Portal**: A dedicated, premium admin interface for secure internship management.
- **Internship Creation**: Define internships with quotas, roles, and departments.
- **Application Review**: Detailed review of student profiles and documents.
- **Hiring System**: Effortless hiring with roll number and role assignment.
- **Data Export**: Export student data to formatted Excel files.

## 🔐 Security & Engineering
- **Rate Limiting**: Integrated global protection against brute-force and DDoS attacks.
- **Role-Based Access Control (RBAC)**: Strict separation of Student and Admin roles with server-side validation.
- **JWT Authentication**: Secure session management with industry-standard token expiry.
- **Prisma ORM**: Type-safe database queries and performance-optimized schema with indexing.

---

## 🛠 Prerequisites

- **Node.js**: v18+
- **PostgreSQL**: Local or cloud instance.
- **npm**: v9+

---

## 📋 Quick Start Guide

### 1. Initial Installation
From the **root directory**, install all dependencies for both frontend and backend:
```bash
npm install
```

### 2. Database Setup
Ensure PostgreSQL is running and update `backend/.env`:
```env
PORT=5001
JWT_SECRET=your_secret_key
DATABASE_URL="postgresql://postgres:user_password@localhost:5432/aptransco?schema=public"
```

Push the schema and seed the default admin:
```bash
cd backend
npx prisma db push
node seed.js
cd ..
```

### 3. Run Development Services
Start the backend, student frontend, and admin portal simultaneously from the root:
```bash
npm run dev
```

---

## 💻 Portal Access URLs

| Portal | URL | Default Admin Credentials |
| :--- | :--- | :--- |
| **Landing Page** | `http://localhost:5173/` | N/A |
| **Student Registration** | `http://localhost:5173/student/register` | Register manually |
| **Student Login** | `http://localhost:5173/login` | Register manually |
| **Admin Portal** | `http://localhost:5174/login` | `admin@aptransco.gov.in` / `admin123` |

---

## 📁 Project Structure

```text
📂 internship portal
 ├── 📂 admin-portal      # Refined Standalone Admin Dashboard (Vite/React)
 ├── 📂 backend           # Node.js/Prisma API (Security Hardened)
 ├── 📂 frontend          # Student Portal & Public Landing Page (Vite/React)
 └── 📄 package.json      # Concurrent dev scripts
```

## 🛠 Common Commands

- `npm run dev`: Start all services (Backend, Student, Admin).
- `cd backend && node seed.js`: Re-seed the admin account.
- `cd backend && npx prisma db push`: Sync database schema.

