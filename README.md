# APTRANSCO Internship Management Portal

A full-stack application for managing student internship applications with an independent, passwordless student portal and a secure admin dashboard.

## Prerequisites
- **Node.js**: v16+ 
- **PostgreSQL**: Running locally or via Docker
- **npm**: Package manager

## Project Structure
- `/backend`: Express.js API, Prisma ORM, and PostgreSQL logic.
- `/frontend`: React (Vite) Admin Dashboard.
- `aptransco_portal.html`: Public Student Application Portal (served by backend).

## Setup Instructions

### 1. Database Configuration
1. Open `backend/.env`.
2. Ensure `DATABASE_URL` matches your local PostgreSQL credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/aptransco?schema=public"
   ```
3. (Optional) Create the database if it doesn't exist: `createdb aptransco`

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Sync the database schema and generate Prisma client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Seed the default Admin account:
   ```bash
   node seed.js
   ```
   - **Admin Login**: `admin@aptransco.gov.in`
   - **Password**: `admin123`

### 3. Frontend (Admin) Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Start the Backend (Port 5000)
Run in the `backend` directory:
```bash
npm run dev
```

### Start the Admin Dashboard (Port 5173)
Run in the `frontend` directory:
```bash
npm run dev
```

## How to Use

### For Students (Public Portal)
1. Open `http://localhost:5000/` in your browser.
2. Fill out the application form (no login required).
3. Use your **College Roll Number** as your unique key.
4. After submission, you will receive a **Tracking ID** (e.g., `APT-1710...`).
5. Use the "Check Status" tab to track your application progress.

### For Admins
1. Open `http://localhost:5173/` in your browser.
2. Log in with the default admin credentials.
3. **Manage Internships**: Create new internship openings. These will automatically appear in the student portal dropdown.
4. **View Applications**: See all student submissions, their automated scores, and documents.
5. **Shortlist**: Approve or Reject candidates. Students will see these updates on the tracking page.
6. **Automation**: Configure scoring weights for automated shortlisting based on CGPA and college category.
