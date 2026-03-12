# APTRANSCO Internship Management Portal

The APTRANSCO Internship Management Portal is a comprehensive, full-stack enterprise solution designed to streamline the student internship application lifecycle. It features a unified React-based frontend for both students and administrators, backed by a robust Node.js/Express API and PostgreSQL database.

---

## 🚀 Key Features

### 🎓 For Students
- **Full Account Lifecycle**: Secure registration and login (JWT-based).
- **Premium Profile Builder**: A multi-step animated onboarding process to save personal, academic, and experience details.
- **Single-Click Applications**: Once a profile is complete, students can apply to any internship by simply uploading their Resume and NOC letter.
- **Application Tracking**: Real-time status updates (Pending -> Shortlisted -> Hired) visible directly on the student dashboard.

### 💼 For Administrators
- **Modern Management Dashboard**: Track recruitment metrics, fill rates, and seat availability.
- **Application Review System**: Deep-dive into student profiles with a built-in fullscreen document viewer for PDF/Image uploads.
- **Seamless Hiring Workflow**: One-click status updates and role assignment.
- **Excel Integration**: Export full application datasets to formatted Excel spreadsheets for offline processing.

---

## 🛠 Prerequisites

Ensure you have the following installed:
- **[Node.js](https://nodejs.org/)** (v18.0.0 or higher)
- **[PostgreSQL](https://www.postgresql.org/)** (Running locally or via Docker)
- **vpm/npm** (Node Package Manager)

---

## 📋 Step-by-Step Installation Guide

### 1. Database Configuration
1. Ensure PostgreSQL is running.
2. Create a new database named `aptransco`.
   ```bash
   createdb aptransco
   ```

### 2. Backend Setup
1. **Navigate to the `backend` folder**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5001
   JWT_SECRET=your_secure_secret_key
   DATABASE_URL="postgresql://postgres:user_password@localhost:5432/aptransco?schema=public"
   ```
4. **Push Schema & Generate Client**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. **Seed Default Admin**:
   ```bash
   node seed.js
   ```
6. **Start Server**:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. **Navigate to the `frontend` folder**:
   ```bash
   cd frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start React Application**:
   ```bash
   npm run dev
   ```

---

## 💻 Accessing the Portals

| Portal | URL | Default Credentials |
| :--- | :--- | :--- |
| **Landing Page** | `http://localhost:5001/` | Static gateway to React apps |
| **Student Portal** | `http://localhost:5173/` | Register as a new user |
| **Admin Portal** | `http://localhost:5173/admin/login` | Email: `admin@aptransco.gov.in` / Pass: `admin123` |

---

## 📁 Project Structure Overview

```text
📂 internship portal
 ├── 📄 aptransco_portal.html     # Static Landing Page (Redirector)
 ├── 📂 backend
 │   ├── 📂 controllers           # API Logic (Admin & Student)
 │   ├── 📂 routes                # Express Routes
 │   └── 📂 prisma                # Database Schema (studentProfile, Application, etc.)
 └── 📂 frontend
     └── 📂 src
         ├── 📂 context           # AuthState Management
         └── 📂 pages
             ├── 📂 admin         # Admin-specific React Pages
             └── 📂 student       # Student-specific React Pages
```
