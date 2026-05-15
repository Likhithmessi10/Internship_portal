# APTRANSCO Internship Portal — Docker Setup

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- 4 GB free RAM, 5 GB free disk space

## Run the application

```bash
# 1. Clone / unzip the project, then open a terminal in the project root
cd "internship portal"

# 2. Build and start all services (first run takes ~5-10 minutes)
docker compose up --build

# 3. Wait until you see:
#    ✅ Database schema is up to date.
#    🚀 Starting APTRANSCO backend server...
```

## Access the apps

| App | URL |
|-----|-----|
| Student Portal | http://localhost:5173 |
| Admin / PRTI / HOD Portal | http://localhost:5174 |
| Backend API | http://localhost:5001/api/v1 |

## Stop the application

```bash
# Stop containers (keeps data)
docker compose down

# Stop AND delete all data (fresh start)
docker compose down -v
```

## Rebuild after code changes

```bash
docker compose up --build
```

## Notes
- File uploads are stored in a Docker volume (`uploads_data`) and persist across restarts.
- Email notifications call the live APTRANSCO email API — they will work only if connected to the APTRANSCO network/VPN. All other features work offline.
- Database credentials are pre-configured for Docker; no manual setup needed.
