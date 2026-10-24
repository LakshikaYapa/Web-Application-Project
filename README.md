# FloodGuard

Flood Emergency Reporting and Response System.

## Technology Stack

- Frontend: React
- Backend: Node.js and Express
- Database: MongoDB
- CI/CD: GitHub Actions

## Run the backend and MongoDB with Docker Compose

Start Docker Desktop with its Linux engine running. From the repository root:

```powershell
docker compose up --build --wait
docker compose ps
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:5000/api/ready
```

Stop any locally running backend on port 5000 before starting Compose.
The backend waits for MongoDB to be healthy, and `--wait` waits for both services
to be healthy. The readiness endpoint should report `database: connected`.

This configuration is for local development. It uses a separate containerized
MongoDB database, not the connection in `backend/.env`. MongoDB is available only
inside the Compose network; the API is published only on the local machine.
Database files persist in the `mongodb-data` named volume.

View logs or stop the stack:

```powershell
docker compose logs --tail 100 backend mongodb
docker compose down
```

`docker compose down` preserves database data. Adding `--volumes` deletes it.
After backend source or dependency changes, rerun `docker compose up --build --wait`.
The frontend still runs separately with `npm.cmd run dev` from `frontend/`.
