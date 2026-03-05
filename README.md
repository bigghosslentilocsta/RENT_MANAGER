# Rent Management System

Personal rent tracker for a building with 11 flats (101-111). Includes a React + Tailwind dashboard with a Node/Express + MongoDB API.

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file in the `backend` folder with:

```
MONGODB_URI=mongodb://127.0.0.1:27017/rent_management
PORT=5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set an optional API URL in `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

- `GET /api/dashboard` - Flats with current tenant and payment status for the month
- `POST /api/move-in` - Add a new tenant to a vacant flat
- `POST /api/vacate/:tenantId` - Move tenant to history and free the flat
- `PATCH /api/payments/:id` - Toggle payment status
- `GET /api/history` - Past tenants with stay duration
