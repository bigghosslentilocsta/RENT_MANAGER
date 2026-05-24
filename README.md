# Punnam Rent Manager

A full-stack rent management application for tracking 11 flats, tenants, payments, and rental history. Built with React, Node.js/Express, MongoDB, and Tailwind CSS.

## ✨ Features

### Core Functionality
- **Dashboard** - View all 11 flats with current tenant info, rent status (Paid/Pending), and due dates
- **Rent History** - Track monthly rent payments with filtering by month/year
- **Tenant History** - Archive of past tenants with stay duration
- **Rent Status Toggle** - Mark rent as Paid/Pending with confirmation dialog
- **Edit Paid Date** - Change the date when rent was paid in Rent History

### Modern UI/UX
- Clean, responsive design with Tailwind CSS
- Green (Paid) and red (Pending) status indicators
- Mobile-friendly card grid layout
- Interactive modals for tenant management

### Additional Features
- **WhatsApp Integration** - "Inform" button to send rent reminders via WhatsApp
- **Manual Voice Call Agent** - "Call Tenant" button triggers an automated Vapi voice reminder call
- **Multi-language Support** - English/Telugu translation toggle for key UI labels
- **PWA Ready** - Progressive Web App with offline support via Service Worker
- **Authentication** - Basic login protection (hardcoded credentials for demo)
- **Currency** - All amounts displayed in Indian Rupees (₹)

## 🛠️ Tech Stack

**Frontend**
- React 18.3 with Vite
- Tailwind CSS for styling
- Lucide React icons
- Context API for state management & translations

**Backend**
- Node.js with Express.js
- MongoDB Atlas (cloud database)
- CORS enabled for frontend communication
- Auto-seeding of 11 flats on startup

**Infrastructure**
- Deployed on Render.com
- MongoDB Atlas cloud database
- GitHub for version control

## 📋 Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account (or local MongoDB)
- Git

## 🚀 Quick Start (Development)

### 1. Clone the Repository
```bash
git clone https://github.com/bigghosslentilocsta/RENT_MANAGER.git
cd RENT_MANAGER
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb+srv://admin:<password>@healthcluster.p0oj6ri.mongodb.net/rent_management
PORT=5000
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```
Backend runs on http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file (optional):
```env
VITE_API_URL=/api
```

Start frontend:
```bash
npm run dev
```
Frontend runs on http://localhost:5173

### 4. Login
- **URL:** http://localhost:5173
- **Username:** `PUNNAM444`
- **Password:** `PUNNAM444`

## 🌐 Deployment to Render

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete step-by-step deployment instructions.

**Quick Summary:**
1. Connect GitHub repo to Render
2. Set build command: `npm ci --include=dev --prefix frontend && npm run build --prefix frontend && npm ci --prefix backend`
3. Set start command: `npm start --prefix backend`
4. Add environment variables (MongoDB URI, PORT, NODE_ENV)
5. Deploy!

**Live URL:** `https://punnam-rent-manager.onrender.com`

## 📱 Default Credentials

| Field | Value |
|-------|-------|
| Username | PUNNAM444 |
| Password | PUNNAM444 |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get all flats with current tenants and payment status |
| POST | `/api/move-in` | Add new tenant to vacant flat |
| POST | `/api/vacate/:tenantId` | Vacate tenant and archive to history |
| PATCH | `/api/payments/:id` | Toggle payment status (Paid/Pending) |
| PATCH | `/api/payments/:id/date` | Update paid date for a payment |
| POST | `/api/tenants/:tenantId/call-reminder` | Trigger automated Vapi voice reminder call for pending rent |
| GET | `/api/rent-history?month=YYYY-MM` | Get rent records for a specific month |
| GET | `/api/history` | Get all past tenants |
| GET | `/api/tenants/:tenantId/history` | Get payment/deposit history for a tenant |
| POST | `/api/tenants/:tenantId/deposits` | Record deposit payment |

## 📦 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/db.js - MongoDB connection
│   │   ├── models/ - Mongoose schemas (Flat, Tenant, Payment, etc.)
│   │   ├── routes/index.js - API routes
│   │   └── utils/ - Helper functions
│   ├── server.js - Express app with frontend serving
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/ - React components (FlatCard, Modals, etc.)
│   │   ├── context/ - RentContext, TranslationContext
│   │   ├── pages/ - Dashboard, RentHistory, TenantHistory
│   │   ├── App.jsx - Main app with auth gating
│   │   └── main.jsx - React entry with providers
│   ├── public/ - PWA manifest & service worker
│   └── package.json
├── DEPLOYMENT.md - Render deployment guide
└── README.md - This file
```

## 🔐 Security Notes

⚠️ **Development Only:** This app uses hardcoded credentials for demo purposes.
For production, implement proper authentication (JWT, OAuth, etc.).

## 📝 Environment Variables

### Backend
```env
MONGODB_URI=<your-mongodb-atlas-connection-string>
PORT=5000
NODE_ENV=production
VAPI_API_KEY=<your-vapi-api-key>
VAPI_ASSISTANT_ID=<your-vapi-assistant-id>
VAPI_PHONE_NUMBER_ID=<your-vapi-phone-number-id>
```

### Frontend
```env
VITE_API_URL=/api
```

## 🐛 Troubleshooting

**Port 5000 already in use:**
```bash
PORT=5001 npm start
```

**MongoDB connection error:**
- Ensure MongoDB Atlas IP whitelist includes your IP
- Check connection string has correct password

**Frontend shows blank page:**
- Check browser console for errors
- Verify backend is running on correct port

**WhatsApp button doesn't open:**
- Ensure phone number is in valid format
- Check browser popup settings allow new tabs

- **Manual call button returns configuration error:**
- Ensure VAPI_API_KEY, VAPI_ASSISTANT_ID, and VAPI_PHONE_NUMBER_ID are set in backend environment
- Restart backend after adding environment variables

## 📄 License

This project is open source and available under the MIT License.

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment troubleshooting.

## Vapi Assistant: Ready-made Prompt

A ready-to-use rent reminder assistant prompt is included at `backend/vapi-assistant/assistant_prompt.txt`.

Quick steps to start using the assistant:

1. Create an assistant in your Vapi.ai dashboard and copy its `assistantId`.
2. Import or configure a phone number in Vapi and get its `phoneNumberId`.
3. Copy the content of `backend/vapi-assistant/assistant_prompt.txt` into your Vapi assistant's script (or pass variables when creating a call).
4. Add the following environment variables to your backend `.env` file and restart the server:

```env
VAPI_API_KEY=<your-vapi-api-key>
VAPI_ASSISTANT_ID=<your-vapi-assistant-id>
VAPI_PHONE_NUMBER_ID=<your-vapi-phone-number-id>
```

5. Test a manual call using the API (replace `:tenantId` with a valid tenant id):

```bash
curl -X POST http://localhost:5000/api/tenants/:tenantId/call-reminder \
	-H "Content-Type: application/json" \
	-d '{}'
```

The endpoint will return the provider call id or an error message. If you want, I can also add a call-logs collection and a webhook endpoint to persist call events.

### Webhook setup (recommended)

1. (Optional but recommended) Set a secret for inbound webhooks in your backend `.env`:

```env
VAPI_WEBHOOK_SECRET=<a-random-secret-string>
```

2. In the Vapi dashboard, configure your webhook URL for call events to point to:

```
https://your-server.example.com/api/webhook/vapi
```

3. Configure Vapi to include the header `x-vapi-webhook-secret` with the value of `VAPI_WEBHOOK_SECRET` (if your Vapi dashboard supports custom headers) or otherwise include the secret in the webhook payload under `variables.CALL_ATTEMPT_ID`.

4. Test the webhook locally (use ngrok or similar) with a sample payload:

```bash
curl -X POST http://localhost:5000/api/webhook/vapi \
	-H "Content-Type: application/json" \
	-H "x-vapi-webhook-secret: <your-secret>" \
	-d '{"id":"test-call-1","status":"completed","customer":{"number":"+919876543210"}}'
```

The backend will record incoming webhook events under the `CallAttempt` records (see `backend/src/models/CallAttempt.js`).

