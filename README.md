# APTRANSCO Internship Management Portal

A full-stack application for managing student internship applications with an independent, passwordless student portal and a secure admin dashboard.

---

## 🚀 Features

- **Public Student Portal**: Students can apply for internships directly without an account.
- **Application Tracking**: Applications can be tracked via a unique Tracking ID and College Roll Number.
- **Admin Dashboard**: Manage internship listings, view incoming applications, and shortlist or reject candidates.
- **Dynamic Database integration**: Centralized robust schema with PostgreSQL and Prisma.

---

## 🛠 Prerequisites

Before you start, ensure you have the following installed on your machine:
- **[Node.js](https://nodejs.org/)** (v16.0.0 or higher)
- **[PostgreSQL](https://www.postgresql.org/)** (Running locally or via Docker, version 14+ recommended)
- **git** (to clone the repository)

---

## 📋 Step-by-Step Installation Guide

Follow these instructions exactly to install and run the application on your local machine.

### 1. Database Configuration (PostgreSQL)

You will need an active PostgreSQL database.
1. Make sure your local PostgreSQL service is running.
2. Create a new database for the application. You can use a tool like pgAdmin, DBeaver, or the CLI:
   ```bash
   createdb aptransco
   ```

### 2. Backend Setup

The backend hosts the API endpoints, interacts with the database via Prisma ORM, and serves the static HTML student portal.

1. **Navigate to the `backend` folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Open `backend/.env` (or create it if missing) and configure your variables to match your database:
   ```env
   PORT=5001
   JWT_SECRET=your_super_secret_jwt_key
   # Replace postgres:password with your actual PostgreSQL username and password
   DATABASE_URL="postgresql://postgres:password@localhost:5432/aptransco?schema=public"
   ```

4. **Initialize Database Schema via Prisma**:
   This will synchronize the database tables based on the Prisma schema and generate the client library.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed the Initial Admin Account**:
   This sets up the default administrator account.
   ```bash
   node seed.js
   ```

6. **Start the Backend Server**:
   ```bash
   npm run dev
   # The server should start on http://localhost:5001
   ```

### 3. Frontend (Admin) Setup

The frontend is a React admin dashboard powered by Vite.

1. **Navigate to the `frontend` folder** (in a new terminal window):
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   *(Note: The frontend is configured to communicate with the backend running on `http://localhost:5001` automatically).*

3. **Start the Admin Dashboard**:
   ```bash
   npm run dev
   # The application will be available at http://localhost:5173
   ```

---

## 💻 How to Use the Application

### 🎓 For Students (Public Portal)
1. Ensure the Backend Server is running.
2. Open **[http://localhost:5001/](http://localhost:5001/)** in your browser.
3. Fill out the application form (no login is required). You will need an active internship listing to apply for.
4. After submission, you will receive a **Tracking ID** (e.g., `APT-1710XXX`). Save this safely.
5. Use the "Check Status" tab and enter your College Roll Number and Tracking ID to follow up on your application.

### 💼 For Administrators (Admin Portal)
1. Ensure both Backend and Frontend Servers are running.
2. Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.
3. Log in with the seeded default admin credentials:
   - **Email**: `admin@aptransco.gov.in`
   - **Password**: `admin123`
4. Use the dashboard to manually Approve or Reject incoming candidates, post new internship listings, or view uploaded documentation.

---

## 📁 Project Structure Overview

```text
📂 internship portal
 ├── 📄 README.md                 # Project documentation
 ├── 📄 aptransco_portal.html     # Public front-end code (served by Express backend)
 ├── 📂 backend
 │   ├── 📄 package.json          # Backend dependencies
 │   ├── 📄 server.js             # Express.js entry point
 │   ├── 📄 seed.js               # Database seeder logic
 │   └── 📂 prisma                # Database schemas & migrations
 └── 📂 frontend
     ├── 📄 package.json          # Admin dashboard dependencies
     ├── 📄 vite.config.js        # Vite bundler configuration
     └── 📂 src                   # React source code components & pages
```
