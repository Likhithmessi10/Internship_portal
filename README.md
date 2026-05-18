# APTRANSCO Internship Management Portal

Multi-application system for managing internship intake, evaluation, onboarding, and execution at AP Transmission Corporation Limited.

**Stack:** Node.js + Express + Prisma + PostgreSQL · React (Vite) × 2 portals · Nginx · Docker

---

## What's Inside

| Portal | Audience | URL (Docker) |
|--------|----------|--------------|
| Student App | Students applying for internships | `http://localhost/` |
| Admin Portal | PRTI, HOD, Mentor, Admin | `http://localhost/admin` |
| Backend API | Internal — proxied through Nginx | `http://localhost/api/v1` |
| PostgreSQL | Database | `localhost:5432` |

Everything runs from a single Docker container fronted by Nginx, plus a Postgres container — exposed on port **80** only.

---

## Quick Start (Docker — Recommended)

### Prerequisites

| Tool | Version |
|------|---------|
| Docker Desktop (Windows / Mac) or Docker Engine + Compose plugin (Linux) | 20+ |
| Git | Latest |

That's it. Node, PostgreSQL, Nginx, Chromium etc. all run inside containers — you do **not** need to install them on the host.

Verify Docker is running:
```bash
docker --version
docker compose version
```

### 1. Clone the repository

```bash
git clone https://github.com/Likhithmessi10/Internship_portal.git
cd Internship_portal
git checkout version2
```

### 2. (Optional) Review environment variables

All non-secret defaults are baked into `docker-compose.yml` and work out of the box. The defaults are intended for **local development / demo only** — see the [Production Hardening](#production-hardening) section below before any internet deployment.

If you want to customise anything (CORS origins, JWT secrets, email service URL, rate limits, etc.), edit the `environment:` block of the `app` service in `docker-compose.yml`.

### 3. Build and start

```bash
docker compose up --build -d
```

First build downloads images and installs all dependencies — usually 3–8 minutes. Subsequent rebuilds are cached and complete in under a minute.

### 4. Open the portal

Once you see both containers running (`docker compose ps`), open:

- **Student app:**   http://localhost/
- **Admin portal:**  http://localhost/admin
- **API health:**    http://localhost/api/v1/health

The Postgres schema is pushed automatically on first start (`prisma db push`) and seed accounts are created.

### Default Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@aptransco.gov.in` | `password123` |
| PRTI | `prti@aptransco.gov.in` | `password123` |
| HOD (SLDC) | `hod.sldc@aptransco.gov.in` | `password123` |
| Mentor | `mentor@aptransco.gov.in` | `password123` |

> Change every default password before exposing the portal beyond localhost. See [Production Hardening](#production-hardening).

---

## Day-to-Day Docker Commands

### View logs

```bash
docker compose logs -f app          # follow app (backend + nginx) logs
docker compose logs -f postgres     # follow database logs
docker compose logs --tail 100 app  # last 100 lines
```

### Stop / restart

```bash
docker compose stop                  # stop without removing
docker compose start                 # start again
docker compose restart app           # quick restart of just the app
docker compose down                  # stop and remove containers (volumes kept)
```

### Rebuild after code changes

```bash
docker compose down
docker compose up --build -d
```

### Exec into a container

```bash
docker compose exec app sh                                # shell into the app container
docker compose exec postgres psql -U aptransco aptransco  # open psql in the db
```

### Wipe and start fresh (deletes all data)

```bash
docker compose down -v               # -v also removes volumes (database + uploads)
docker compose up --build -d
```

### Clear Docker build cache (when builds get weird)

```bash
docker compose down
docker builder prune -af
docker compose up --build -d
```

---

## Project Structure

```
internship-portal/
├── backend/                    # Express + Prisma API
│   ├── controllers/            # Route handlers
│   ├── middleware/             # Auth, rate limit, multer, ClamAV
│   ├── prisma/                 # Schema + migrations
│   ├── routes/                 # Express routers
│   ├── services/               # Mail, workflow, roll-number, college lookup
│   ├── domain/workflow/        # Application state machine
│   └── scripts/                # Seed scripts
├── frontend/                   # Student portal (Vite + React)
├── admin-portal/               # Staff portal (Vite + React)
├── doc_templates/              # Apply-time templates (NOC, Undertaking)
├── email_service/              # Email template assets
├── nginx.conf                  # Nginx reverse-proxy config (serves both SPAs + proxies API)
├── start.sh                    # Container entrypoint (db push → seed → nginx → node)
├── Dockerfile                  # Multi-stage: frontend build → admin build → runtime
└── docker-compose.yml          # 2-service stack: postgres + app
```

---

## How the Container Works

The `Dockerfile` is multi-stage:

1. **Stage 1 — `frontend-builder`** — Builds the student SPA (`/dist`) with Vite.
2. **Stage 2 — `admin-builder`** — Builds the admin SPA (`/dist`) with Vite and base path `/admin`.
3. **Stage 3 — runtime** — Installs Node, Nginx, Chromium (for Puppeteer PDF generation), copies the built SPAs into `/var/www/html`, installs backend dependencies, runs `prisma generate`, and starts both Nginx and Node via `start.sh`.

Nginx serves the SPAs statically and proxies `/api/` to the Node backend on port 5001 inside the container. Only port 80 is exposed to the host.

---

## Application Lifecycle

Every application moves through a state machine. The exact path depends on the internship type.

### Status flow

```
MONETARY (Collaborative):
  SUBMITTED → SHORTLISTED → UNDER_COMMITTEE_REVIEW → SELECTED → REPORTED → HIRED → ONGOING → COMPLETED

NON_STIPEND (Learning):
  SUBMITTED → SHORTLISTED → SELECTED → DOCUMENTS_PENDING → DOCUMENTS_VERIFIED → HIRED → ONGOING → COMPLETED
```

The full machine, including role permissions, lives in [`backend/domain/workflow/applicationStateMachine.js`](backend/domain/workflow/applicationStateMachine.js).

### Roll number allocation

Roll numbers are generated **only at `HIRED`** — i.e., after joining documents have been evaluated and the student is officially hired. This applies to **both** internship flows. They are **not** allocated at shortlisting, selection, or REPORTED.

Formats (see [`backend/services/rollNumberService.js`](backend/services/rollNumberService.js)):
- **MONETARY:** `YYDDGGNNN` — year · department code · batch index · sequence
- **NON_STIPEND:** `YYDDFFNNN` — year · department code · field code · sequence

### Joining documents (post-selection)

After selection (NON_STIPEND: `DOCUMENTS_PENDING`; MONETARY: `REPORTED`), the student is required to upload:

| ID | Document | Notes |
|----|----------|-------|
| `BOND` | ₹100 Bond | On a ₹100 stamp paper |
| `INSURANCE` | Insurance Policy | Personal insurance covering the internship period |
| `UNDERTAKING` | Undertaking Form | Personal declaration |

HODs can override this default set per department via the HOD Applications screen. Defaults live in:
- Backend validation: [`backend/controllers/studentController.js`](backend/controllers/studentController.js) (`uploadJoiningDocuments`)
- Student dashboard: [`frontend/src/pages/student/StudentDashboard.jsx`](frontend/src/pages/student/StudentDashboard.jsx) (`JOINING_DOCS`)
- HOD config defaults: [`admin-portal/src/pages/admin/hod/HodApplications.jsx`](admin-portal/src/pages/admin/hod/HodApplications.jsx) (`DEFAULT_DOCS`)

Note: legacy `NOC` uploads on older applications are still surfaced in the PRTI/HOD application profile modal, labeled "NOC (legacy)" for historical review only.

### Apply-time documents

Separately from joining docs, the apply-time document set (Resume, NOC Letter, Undertaking, Mark Sheet, Passport Photo) is stored in the `DocumentConfiguration` singleton table and editable globally by PRTI at `/admin/prti/config/documents`.

---

## Local Development (Without Docker)

If you want hot-reload during development, you can run the services natively. **Docker is still recommended for everything else.**

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 9+ |
| PostgreSQL | 13+ |

### Setup

```bash
# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd admin-portal && npm install && cd ..

# Create env files
cp backend/.env.example       backend/.env
cp frontend/.env.example      frontend/.env
cp admin-portal/.env.example  admin-portal/.env

# Edit backend/.env — set DATABASE_URL to your local Postgres
# Apply schema
cd backend
npx prisma db push
node scripts/seed-accounts.js
cd ..

# Run all three in three terminals
cd backend && npm run dev          # http://localhost:5001
cd frontend && npm run dev         # http://localhost:5173
cd admin-portal && npm run dev     # http://localhost:5174
```

---

## Production Hardening

Before exposing the portal beyond localhost, work through this list.

### Credentials

- [ ] **JWT secrets** in `docker-compose.yml` — Replace `JWT_SECRET` and `JWT_REFRESH_SECRET` with random 64-character strings.
  ```bash
  # Linux / macOS
  openssl rand -hex 32
  # PowerShell
  -join ((1..32) | ForEach { '{0:x2}' -f (Get-Random -Max 256) })
  ```
- [ ] **PostgreSQL password** — Change `POSTGRES_PASSWORD` and the matching password in `DATABASE_URL`.
- [ ] **Default seed passwords** — Log in as each seeded account and change the password, or update `scripts/seed-accounts.js` before first boot.
- [ ] **Delete `backend/accounts.txt`** if it exists on the production server.

### CORS / Network

- [ ] **`CORS_ORIGINS`** — Replace the demo values with the exact production URLs only. Never use `*`.
- [ ] **HTTPS** — Terminate TLS at an upstream reverse proxy (Caddy / Nginx on host / Cloudflare) and only forward to port 80 of the container.
- [ ] **JWT_EXPIRY** — Keep at `2h` or less.

### Database

- [ ] Use a dedicated database user with least-privilege grants — not the superuser baked into the demo compose file.
- [ ] Enable SSL on the Postgres connection (`?sslmode=require` in `DATABASE_URL`).
- [ ] Schedule regular database backups of the `postgres_data` volume.

### File Uploads & Security

- [ ] **ClamAV** — Set `CLAMAV_ENABLED=true` and run a ClamAV container alongside.
- [ ] **Rate limits** — Tighten `RATE_LIMIT_MAX_REQUESTS` (currently `500/min` for testing) for production traffic.
- [ ] **Upload volume** — Back up the `uploads_data` volume regularly. Files are physically stored at `/app/backend/uploads` inside the container.

### Git Hygiene

- [ ] `.env`, `backend/uploads/`, `backend/accounts.txt`, debug scripts and dump files are already gitignored — do not commit them.
- [ ] Rotate any secret that appears in commit history with `git filter-repo` or BFG before publishing the repository.

---

## Public Tunnel for Testing (Optional)

To let teammates / reviewers test the portal without deploying, expose the container via Cloudflare Tunnel:

```bash
# Install cloudflared (one-time)
# Windows:  winget install --id Cloudflare.cloudflared
# macOS:    brew install cloudflared
# Linux:    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Once the container is up on port 80:
cloudflared tunnel --url http://localhost:80
```

Cloudflare prints a random `https://*.trycloudflare.com` URL. Share it. **Remember to add this URL to `CORS_ORIGINS`** in `docker-compose.yml` (then `docker compose up --build -d`) so the API accepts requests from it.

---

## Troubleshooting

### Build fails with `parent snapshot does not exist`
Docker build cache corruption. Clear it:
```bash
docker compose down
docker builder prune -af
docker compose up --build -d
```

### `exec /start.sh: no such file or directory`
`start.sh` got CRLF line endings on Windows. The Dockerfile already strips them with `sed -i 's/\r$//'`, but if you edited the file in a Windows editor, save it as **LF** (Notepad++ → Edit → EOL Conversion → Unix).

### "Allocation Failed: All N seats for location X are filled"
The HOD is trying to allocate to a location they didn't explicitly assign in the selection panel. Use the location dropdown in the inline "Select" panel to assign the new location before confirming.

### CORS errors in the browser
The origin you're loading the UI from must be in `CORS_ORIGINS` in `docker-compose.yml`. After changing it, rebuild:
```bash
docker compose down && docker compose up --build -d
```

### Admin login "All Roles" link does nothing
If the link bounces you back to `/admin/login` instead of the role picker, you're running a stale container. Rebuild: `docker compose up --build -d`.

### Port 80 already in use
Another service (IIS, Apache, Nginx, Skype) is on port 80. Either stop it, or change the host port:
```yaml
# in docker-compose.yml
ports:
  - "8080:80"     # then open http://localhost:8080
```

---

## Feature Flags

| Flag | File | Values | Effect |
|------|------|--------|--------|
| `VITE_MONETARY_ENABLED` | `Dockerfile` (admin-builder stage) | `false` / `true` | Enables paid/collaborative internship workflow. Default `false` (learning internships only). Monetary-only routes auto-redirect when `false`. |

---

## License

Internal project of Andhra Pradesh Transmission Corporation Limited. Not licensed for redistribution.
