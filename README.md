# APTRANSCO Internship Management Portal

The APTRANSCO Internship Management Portal is a multi-application system for managing internship intake, evaluation, onboarding, and execution.

This repository contains:
- `backend` (Node.js + Express + Prisma + PostgreSQL)
- `frontend` (Student portal, Vite + React)
- `admin-portal` (Admin/HOD/PRTI/Mentor portal, Vite + React)

---

## Features

### Student
- Profile creation and academic details
- Internship browsing and application
- Document upload and application tracking
- Internship progress views (attendance/tasks where enabled)

### Admin/HOD/PRTI/Mentor
- Internship creation and role/quota configuration
- Application review and shortlisting
- Committee-based per-question evaluation
- Final selection workflow
- Mentor intern/task/attendance operations
- Reports and data export

---

## Prerequisites

Install these before setup:

- **Node.js**: 18+ recommended (22+ supported)
- **npm**: 9+ recommended
- **PostgreSQL**: 14+ recommended
- **Git**: latest
- **Windows** (for `setup-all.bat`)

Verify installation:

```powershell
node -v
npm -v
psql --version
```

---

## Project Structure

```text
internship portal/
  backend/               # API server, Prisma schema, controllers, services
  frontend/              # Student app
  admin-portal/          # Admin operations app
  setup-all.bat          # Windows automated setup script
  package.json           # Root scripts (run all apps)
```

---

## Quick Setup (Windows - Recommended)

From repository root:

```bat
setup-all.bat
```

What `setup-all.bat` does:
- Validates required folders and package manifests.
- Validates `node` and `npm` availability.
- Creates `.env` from `.env.example` in:
  - `backend`
  - `frontend`
  - `admin-portal`
  (if `.env` does not already exist)
- Installs dependencies in all modules and root package.
- Stops with clear error if any step fails.

---

## Manual Setup (Any OS)

### 1) Install dependencies

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd admin-portal && npm install && cd ..
```

### 2) Create environment files

Copy examples:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`
- `admin-portal/.env.example` -> `admin-portal/.env`

---

## Environment Configuration

## Backend (`backend/.env`)

Minimum required:

```env
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/aptransco?schema=public"
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRY=2h
JWT_REFRESH_EXPIRY=7d
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

Optional but recommended:
- `EMAIL_SERVICE_URL`
- `EMAIL_SERVICE_ATTACHMENT_URL`
- Rate-limit/security options from `.env.example`

## Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5001/api/v1
VITE_API_BASE_URL=http://localhost:5001
```

## Admin Portal (`admin-portal/.env`)

```env
VITE_API_URL=http://localhost:5001/api/v1
VITE_API_BASE_URL=http://localhost:5001
```

---

## Database Setup

### Option A: Fresh local database (recommended for development)

1. Create database (example: `aptransco`) in PostgreSQL.
2. Ensure `backend/.env` has correct `DATABASE_URL`.
3. Apply schema:

```bash
cd backend
npx prisma db push
```

4. (Optional) Open Prisma Studio:

```bash
npx prisma studio
```

5. (Optional) Seed accounts/data:

```bash
node scripts/seed-accounts.js
```

### Option B: Import existing SQL dump

```bash
psql -U postgres -d aptransco -f "path/to/your/dump.sql"
```

Then run:

```bash
cd backend
npx prisma db push
```

---

## Running the Project

From root (all services):

```bash
npm run dev
```

Or run separately:

```bash
npm run dev:backend
npm run dev:student
npm run dev:admin
```

---

## Access URLs

- Student app: `http://localhost:5173`
- Admin portal: `http://localhost:5174`
- Backend API: `http://localhost:5001/api/v1`

---

## Default Seed Credentials (if seed script used)

Password (default): `password123`

- Admin: `admin@transco.com`
- PRTI: `prti@transco.com`
- HOD example: `hod.transmission@transco.com`
- Mentor example: `mentor.transmission@transco.com`

---

## Build and Lint

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Admin Portal

```bash
cd admin-portal
npm run lint
npm run build
```

### Backend

```bash
cd backend
npm run dev
```

---

## Common Troubleshooting

## 1) `EADDRINUSE: address already in use :::5001`

Port `5001` is occupied by another process.

Windows:

```powershell
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

Then restart backend:

```bash
cd backend
npm run dev
```

## 2) Frontend/Admin shows blank page after change

- Check browser console for exact stack trace.
- Check dev server terminal for compile/runtime errors.
- Run build to detect production issues:

```bash
cd admin-portal && npm run build
cd ../frontend && npm run build
```

## 3) Prisma connection or schema errors

- Verify `DATABASE_URL` credentials and db existence.
- Run:

```bash
cd backend
npx prisma generate
npx prisma db push
```

## 4) `.env` values still pointing to placeholder IP

Make sure both web apps use localhost during local development:

```env
VITE_API_URL=http://localhost:5001/api/v1
VITE_API_BASE_URL=http://localhost:5001
```

## 5) CORS errors

- Ensure backend `CORS_ORIGINS` includes:
  - `http://localhost:5173`
  - `http://localhost:5174`

---

## Recommended Developer Workflow

1. Pull latest changes.
2. Run `setup-all.bat` (Windows) or manual install.
3. Configure env files.
4. Start DB and run `npx prisma db push`.
5. Run `npm run dev`.
6. Validate flows in both `frontend` and `admin-portal`.

---

## Security Notes

- Never commit `.env` files.
- Rotate `JWT_SECRET` in non-local environments.
- Restrict CORS to trusted origins in staging/production.
- Use separate credentials and DBs per environment.

---

## Useful Commands

```bash
# Root
npm run dev

# Backend
cd backend
npx prisma db push
npx prisma studio
npm run dev

# Frontend
cd frontend
npm run dev
npm run build

# Admin
cd admin-portal
npm run dev
npm run build
```

