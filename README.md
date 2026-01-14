# HubSpot Bidirectional Data Synchronization Tool

## Overview

The **HubSpot Bidirectional Data Synchronization Tool** is a full-stack application designed to maintain consistent, reliable, and up-to-date contact and company data between a custom application and HubSpot CRM. The system enables two-way synchronization, ensuring that changes made in either platform are reflected accurately in the other without data loss or duplication.

This application addresses real-world integration challenges such as asynchronous updates, API rate limits, partial failures, and simultaneous data modifications. It leverages HubSpot webhooks (simulated or real) and polling mechanisms to ensure data integrity.

## Features

-   **Bidirectional Sync**: Real-time updates between local DB and HubSpot.
-   **Conflict Resolution**: Detects concurrent edits and provides a UI for manual resolution.
-   **Resilience**: Implements polling fallbacks and queue-based processing (BullMQ) for reliability.
-   **Rate Limiting**: Respects HubSpot's API limits (100 requests/10s) and protects local endpoints.
-   **Dashboard**: A React-based UI to monitor sync status, view logs, and manage conflicts.

## Setup Instructions

### Prerequisites

-   Node.js (v18+)
-   MongoDB (v6+)
-   HubSpot Developer Account (for API Access Token)

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hubspot-sync
HUBSPOT_ACCESS_TOKEN=your_hubspot_private_app_token
REDIS_URL=rediss://default:password@host:port  # For production (Upstash, Render, etc)
CORS_ORIGIN=http://localhost:5173  # Add your production frontend URL here
```

Start the backend server:

```bash
npm start
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory for production:

```env
VITE_API_URL=http://your-backend-domain.com/api
```

Start the React development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Architecture Decisions & Trade-offs

### Conflict Resolution Strategy

We prioritize data integrity over automation for conflicting changes. When a record is modified in both systems simultaneously:
1.  **Detection**: We compare the `lastModified` timestamps and content hashes.
2.  **State**: The record enters a `CONFLICT` state locally.
3.  **Resolution**: No automatic winner is picked (no "Last Write Wins" for conflicts). Instead, an administrator must use the Conflict Resolution UI to choose the correct version (Local vs. Remote). This prevents accidental data loss in complex CRM scenarios.

### Rate Limiting

To comply with HubSpot's strict API limits (100 requests per 10 seconds):
-   We use the `bottleneck` library to wrap all HubSpot API calls.
-   It enforces a global rate limit of roughly 10 requests per second with a reservoir recharge strategy.
-   On the API surface, we use `express-rate-limit` to protect our own endpoints from abuse.

### Error Recovery Strategy

Reliability is achieved through a multi-layered approach:
-   **Queueing**: All sync operations are offloaded to `BullMQ`. If a job fails (e.g., network error), it is automatically retried with exponential backoff.
-   **Dead Letter Queue**: Persistent failures are moved to a "Failed" list, visible in the dashboard for manual inspection.
-   **Polling Fallback**: If webhooks fail or are missed, a periodic "Pull All" job runs every 5 minutes to catch up on any drift.

### Performance Optimizations

-   **Echo Checks**: Before writing to the DB or HubSpot, we generate a hash of the content. If the incoming data matches the existing hash, the write is skipped, reducing DB I/O and API calls.
-   **Indexing**: MongoDB collections are indexed on `hubspotId`, `email`, and `syncStatus` to ensure fast lookups during high-volume syncs.
-   **Pagination**: All list endpoints support pagination to handle large datasets efficiently.

## API Documentation

### Contacts

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/contacts` | List all contacts |
| `POST` | `/api/contacts` | Create a new contact |
| `PUT` | `/api/contacts/:id` | Update a contact |
| `DELETE` | `/api/contacts/:id` | Delete a contact |

### Companies

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/companies` | List all companies |
| `POST` | `/api/companies` | Create a new company |
| `PUT` | `/api/companies/:id` | Update a company |
| `DELETE` | `/api/companies/:id` | Delete a company |

### Sync & Conflicts

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/sync/pull-all` | Trigger manual pull from HubSpot |
| `POST` | `/api/sync/push-all` | Trigger manual push to HubSpot |
| `GET` | `/api/conflicts` | List active conflicts |
| `POST` | `/api/conflicts/:id/resolve` | Resolve a conflict |
