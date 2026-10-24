# FloodGuard

Flood Emergency Reporting and Response System.

## Technology Stack

- Frontend: React
- Backend: Node.js and Express
- Database: MongoDB
- CI/CD: GitHub Actions

## Run the full application with Docker Compose

Start Docker Desktop with its Linux engine running. From the repository root:

```powershell
docker compose up --build --wait
docker compose ps
Invoke-RestMethod http://localhost:8080/api/ready
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:5000/api/ready
```

Open http://localhost:8080 to view the frontend. Nginx forwards `/api/` requests
to the backend inside the Compose network.

Ports 8080 and 5000 must be available before starting Compose.
The backend waits for MongoDB, the frontend waits for the backend, and `--wait` waits for all services
to be healthy. The readiness endpoint should report `database: connected`.

This configuration is for local development. It uses a separate containerized
MongoDB database, not the connection in `backend/.env`. MongoDB is available only
inside the Compose network; the API is published only on the local machine.
Database files persist in the `mongodb-data` named volume.

View logs or stop the stack:

```powershell
docker compose logs --tail 100 frontend backend mongodb
docker compose down
```

`docker compose down` preserves database data. Adding `--volumes` deletes it.
After source or dependency changes, rerun `docker compose up --build --wait`.
The containers serve built application files without live reload. For frontend
live reload, you can still run `npm.cmd run dev` from `frontend/`; its Vite proxy
uses the backend published on localhost:5000.
