# Logging Fullstack System

Fullstack logging platform built with Node.js, Express, Mongoose, and React.

It includes:
- a backend API for developer auth, application management, and log ingestion/retrieval
- a React dashboard for registering, logging in, managing applications, and viewing logs
- support for in-memory MongoDB for local smoke testing

## Project Structure

- `backend/` - Express API and MongoDB models
- `frontend/` - React dashboard
- root `package.json` - workspace entrypoint for the two apps

## Prerequisites

- Node.js 16 or newer
- MongoDB running locally, or use in-memory mode for testing

## Setup

1. Copy `backend/.env.example` to `backend/.env` and configure the values.
2. Install dependencies from the repo root:

```bash
npm install
```

## Run Locally

### Backend

```bash
npm run dev:backend
```

Use in-memory MongoDB for testing:

```bash
USE_INMEMORY=true npm run dev:backend
```

### Frontend

```bash
npm run dev:frontend
```

The frontend runs on Vite's default port and proxies `/api` requests to the backend during development.

## Free Deploy Option

The easiest no-card-friendly path for this repo is Netlify plus MongoDB Atlas free tier.

- Frontend: deploy the `frontend/` app through Netlify.
- API: use the included Netlify Function wrapper in `netlify/functions/api.js`.
- Database: use MongoDB Atlas free tier.

For Netlify, set `MONGO_URI` and `JWT_SECRET` as environment variables, then deploy from the repo root using `netlify.toml`.

## Environment Variables

- `backend/.env`
	- `PORT` - backend port, defaults to `3000`
	- `MONGO_URI` - MongoDB connection string
	- `JWT_SECRET` - secret used to sign developer sessions
	- `JWT_EXPIRES_IN` - JWT lifetime, defaults to `7d`
	- `USE_INMEMORY` - set to `true` to start MongoDB memory server locally
- `frontend` (optional)
	- `VITE_API_BASE_URL` - override the API base URL when you are not using the local Vite proxy

## Main API Routes

- `POST /api/users/register` - register a developer
- `POST /api/users/login` - log in and receive a JWT plus API key
- `POST /api/applications` - create an application
- `GET /api/applications` - list applications for the signed-in developer
- `POST /api/applications/:name/logs` - ingest a log using the API key
- `GET /api/applications/:name/logs` - fetch logs with pagination, sorting, and filters

## SDK

The backend exposes JSON endpoints for auth, applications, and log ingestion/retrieval. Add a separate SDK package when you are ready to publish a client library.

## Quick Smoke Test

1. Start the backend.
2. Register a developer.
3. Create an application.
4. Use the SDK or the API to send a log.
5. Open the dashboard to verify the log appears.
