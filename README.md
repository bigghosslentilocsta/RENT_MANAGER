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

## 📄 License

This project is open source and available under the MIT License.

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment troubleshooting.

