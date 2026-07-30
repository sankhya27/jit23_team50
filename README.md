# DDoS Guard — Full Stack Detection System

A full-stack DDoS detection app with a React frontend, Express/Mongo backend, JWT authentication, role-based authorization, server-side validation, incident logging, and an attack simulation engine.

## What’s included

- Responsive React frontend built with Vite
- Express.js REST API backend
- MongoDB database support for users and incidents
- JWT authentication with secure token-based sessions
- Admin / analyst role-based authorization
- Request validation via Joi
- Global error handling middleware
- Real-time simulation via Server-Sent Events
- Clean project layout with separated frontend and backend code

## Run the project

### 1) Configure environment variables

Copy `.env.example` to `.env` and update the values:

```powershell
copy .env.example .env
```

### 2) Start the backend

```powershell
cd server
npm install
npm run dev
```

### 3) Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

### 4) Access the app

Open the URL shown by Vite (typically `http://localhost:5173`).

## API Endpoints

- `POST /api/auth/signup` — create a new user
- `POST /api/auth/login` — authenticate and receive JWT
- `GET /api/auth/me` — return current user profile
- `POST /api/predict` — submit flow data for attack detection
- `POST /api/simulate/start` — start attack simulation (authenticated)
- `POST /api/simulate/stop` — stop simulation (authenticated)
- `GET /api/simulate/stream` — subscribe to SSE traffic metrics
- `GET /api/metrics` — performance summary
- `GET /api/incidents` — incident history (authenticated)
- `GET /api/users` — admin-only user list

## Notes

- The app uses MongoDB when `MONGO_URI` is configured.
- If MongoDB is unavailable, the server falls back to in-memory storage.
- JWT secrets must be set via `JWT_SECRET` in `.env`.
- The Flask ML microservice is optional; if unavailable, predictions will return a fallback error.
