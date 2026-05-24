# Logging Fullstack System

Fullstack logging platform built with Node.js, Express, Mongoose, and React.

It includes:
- a backend API for developer auth, application management, and log ingestion/retrieval
- a React dashboard for registering, logging in, managing applications, and viewing logs
- support for in-memory MongoDB for local smoke testing

## Project Structure

- `src/` - backend API
- `frontend/` - React dashboard
- `server-sdk/` - standalone logging SDK package

## Prerequisites

- Node.js 16 or newer
- MongoDB running locally, or use in-memory mode for testing

## Setup

1. Copy `.env.example` to `.env` and configure the values.
2. Install backend dependencies from the repo root:

```bash
npm install
```

3. Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run Locally

### Backend

```bash
npm run dev
```

Use in-memory MongoDB for testing:

```bash
USE_INMEMORY=true npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

The frontend runs on Vite's default port and talks to the backend API.

## Environment Variables

- `PORT` - backend port, defaults to `3000`
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - secret used to sign developer sessions
- `JWT_EXPIRES_IN` - JWT lifetime, defaults to `7d`
- `USE_INMEMORY` - set to `true` to start MongoDB memory server locally
- `VITE_API_BASE_URL` - optional frontend API base URL

## Main API Routes

- `POST /api/users/register` - register a developer
- `POST /api/users/login` - log in and receive a JWT plus API key
- `POST /api/applications` - create an application
- `GET /api/applications` - list applications for the signed-in developer
- `POST /api/applications/:name/logs` - ingest a log using the API key
- `GET /api/applications/:name/logs` - fetch logs with pagination, sorting, and filters

## SDK

The publishable SDK lives in `server-sdk/` and exposes `init()` and `log()` for sending logs from a Node.js app.

## Quick Smoke Test

1. Start the backend.
2. Register a developer.
3. Create an application.
4. Use the SDK or the API to send a log.
5. Open the dashboard to verify the log appears.
