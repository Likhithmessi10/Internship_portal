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
From the **root directory**, simply run the automated setup script to install all dependencies and generate your `.env` configuration files:

**Windows**:
```bat
setup-all.bat
```

*(Manual alternative: Copy `.env.example` to `.env` inside `backend`, `admin-portal`, and `frontend`, then run `npm install` in each directory).*

### 2. Database Setup

#### Option A: Automatic Schema Setup (Empty Database)
Use this if you want a clean database with no existing data. Ensure PostgreSQL is running and update `backend/.env`:
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

#### Option B: Manual Import (Schema + Pre-populated Data)
Use this if you want to import the database using a `.sql` dump containing existing internships, applications, and student profiles (recommended for mentors):
1. **Create Database**: Open pgAdmin or `psql` and create a new database named `aptransco`.
2. **Import via Command Line**: Run the following command from your terminal (adjusting the database name and path as needed):
   ```bash
   psql -U postgres -d aptransco -f "PATH_TO_YOUR_BACKEND/schema.sql"
   ```
3. **Configure Environment**: Create a `.env` file in the `backend` folder and set your `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres:PASSWORD_FOR_PGADMIN@localhost:5432/aptransco?schema=public"
   ```
4. **Seed/Update Admin**: (Ensures you have the latest admin login)
   ```bash
   cd backend
   node seed.js
   cd ..
   ```
5. **Load College Data**: (Optional but recommended) To populate the list of 39,000+ colleges for registration dropdowns:
   ```bash
   cd backend
   node scripts/tools/import_json_colleges.js
   cd ..
   ```

### 3. Run Development Services
Start the backend, student frontend, and admin portal simultaneously from the root:
```bash
npm run dev
```

---

## 💻 Portal Access URLs

| Portal | URL | Access |
| :--- | :--- | :--- |
| **Landing Page** | `http://localhost:5173/` | Public |
| **Student Registration** | `http://localhost:5173/student/register` | Open Registration |
| **Student Login** | `http://localhost:5173/login` | Registered Students |
| **Admin Portal** | `http://localhost:5174/login` | Authorized Staff Only |

### 🔑 Test / Seed Credentials
If you populated the database using the internal `seed-accounts.js` script, you can log in to the **Admin Portal** immediately with the following default credentials.

**Password for ALL accounts:** `password123`

| Role | Email |
| :--- | :--- |
| **System Admin** | `admin@transco.com` |
| **PRTI Member** | `prti@transco.com` |
| **HOD (Example)** | `hod.transmission@transco.com` |
| **Mentor (Example)** | `mentor.transmission@transco.com` |

*(Note: Every department in the portal config has an automatically generated HOD and Mentor account in the format `hod.[department-slug]@transco.com` and `mentor.[department-slug]@transco.com`.)*

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
- `cd backend && npx prisma db push`: Sync database schema.
- `cd backend && npx prisma studio`: Open Prisma Studio (Database GUI).

