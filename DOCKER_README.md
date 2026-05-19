# APTRANSCO Internship Portal — Docker Setup

Single-command bring-up of the **entire stack**: PostgreSQL, the unified
Nginx + Node.js + Vite portals, and the template-filling Next.js sidecar
used for offer-letter generation.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- 6 GB free RAM, 8 GB free disk space (extra room is for the Next.js sidecar)

## Run the application

```bash
# 1. Clone / unzip the project, then open a terminal in the project root
cd "internship portal"

# 2. Build and start everything (first run takes ~10-15 minutes)
docker compose up --build

# 3. Wait until you see:
#    aptransco_db                 | ...database system is ready to accept connections
#    aptransco_template_filling   | ==> [template-filling] Starting Next.js on port 3100...
#    aptransco_app                | 🚀 Starting APTRANSCO backend server...
```

## Services

| Service | Container | Host URL | Purpose |
|---|---|---|---|
| `postgres` | `aptransco_db` | `localhost:5432` | Single PostgreSQL instance shared by both apps (two schemas: `public` + `template_filling`) |
| `template-filling` | `aptransco_template_filling` | `localhost:3100` | Next.js sidecar — visual offer-letter template designer + `/api/fill` |
| `app` | `aptransco_app` | `localhost` (port 80) | Nginx serving student frontend + admin portal, proxying `/api` to the Express backend on internal port 5001 |

## Access the apps

| App | URL |
|-----|-----|
| Student Portal | <http://localhost/> |
| Admin / PRTI / HOD / Mentor Portal | <http://localhost/admin> |
| Offer-Letter Template Designer | <http://localhost:3100/admin/templates> |
| Backend API | <http://localhost/api/v1> |

## First-time offer-letter setup

After the stack is up:

1. Open <http://localhost:3100/admin/templates> and upload a blank offer-letter PDF.
2. Click the template and visually place fields on it. **Name each field using the exact labels listed in [template-filling/INTEGRATION.md](template-filling/INTEGRATION.md)** (e.g. `Student Name`, `Roll Number`, `Internship Title`, ...).
3. Sign into the admin portal as PRTI/ADMIN → **System → Offer Letter Setup**.
4. Click your template — it's now active. Students hitting "Download Offer Letter" will receive the filled PDF.

## Stop the application

```bash
# Stop containers (keeps data + uploaded templates)
docker compose down

# Stop AND delete all data + uploaded templates (fresh start)
docker compose down -v
```

## Rebuild after code changes

```bash
docker compose up --build
```

To rebuild only the sidecar without recompiling the main app:

```bash
docker compose up --build template-filling
```

## Notes

- **File uploads** (student documents) are stored in the `uploads_data` volume.
- **Offer-letter templates** uploaded into the sidecar are stored in the `template_uploads` volume — they survive `down`/`up` cycles but are wiped by `down -v`.
- **Email notifications** call the live APTRANSCO email API — they only work when connected to the APTRANSCO network/VPN. All other features work offline.
- **Database credentials** are pre-configured for Docker; no manual setup needed. The sidecar uses the `template_filling` Postgres schema while the main portal uses `public`.
- **Schema migrations**: both the main backend and the sidecar run `prisma db push` on startup, so new columns/tables get applied automatically.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Students see "Offer letter generator is currently unreachable" | Check `docker compose logs template-filling` — likely a build error or DB connection issue |
| PRTI "Offer Letter Setup" page shows an amber banner | The sidecar isn't running. `docker compose up template-filling` |
| Template was uploaded but field labels don't fill | Open <http://localhost/admin/prti/offer-letter-setup>, expand "View mapped field labels" — they must match the names in INTEGRATION.md exactly |
| Sidecar crash loop after `docker compose down -v` | Expected — first start re-creates the `template_filling` schema. Wait ~10 seconds |
