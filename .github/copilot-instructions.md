## Project Overview

**Rent Management System** - An 11-flat rental property management application.

### Tech Stack
- **Frontend**: React with Vite, Tailwind CSS
- **Backend**: Node.js/Express, MongoDB Atlas
- **API Base URL**: http://localhost:5000/api
- **Database**: MongoDB Atlas (Cloud-hosted, auto-backed up)

### Key Features Implemented

#### 1. Dashboard
- Displays all 11 flats in a card grid layout
- Shows current tenant info, rental amount, and payment status (Paid/Pending)
- Due date display: Shows monthly due date based on lease start date (e.g., "Due: Every 5th")
- Quick actions: Add tenant, toggle payment status, vacate tenant
- Real-time payment status updates

#### 2. Rent History Page
- Filter rent records by month and year
- View all rent payments for a specific month across all flats
- Summary cards showing: Total Due, Total Paid, Total Pending
- Detailed table with:
  - Flat number
  - Tenant name and phone
  - Rent amount
  - Payment status (Paid/Pending)
  - Date paid (if applicable)

#### 3. Tenant History Page
- View all past tenants who have vacated
- Shows tenure information:
  - Tenant name and phone
  - Agreed rent amount
  - Lease start date
  - Vacating date
  - Days stayed (calculated duration)

### Navigation
Three main navigation tabs:
1. **Dashboard** - Current flats and tenants
2. **Rent History** - Monthly rent payment tracking (with month/year filters)
3. **Tenant History** - Past tenants archive

### Backend API Endpoints

#### GET /api/dashboard
Returns current month's flat and payment data with tenant details.

#### GET /api/rent-history?month=YYYY-MM
Returns rent records for specified month.
- Query param: `month` (format: YYYY-MM, e.g., "2026-03")
- Returns: Array of rent records with flat, tenant, amount, status, paid date
- Includes historical data from past tenants for accurate business reporting

#### GET /api/history
Returns all past tenants with stay duration.

#### POST /api/move-in
Create new tenant and occupancy (transactional).

#### POST /api/vacate/:tenantId
Mark tenant as vacated and free up flat (transactional).

#### PATCH /api/payments/:id
Toggle payment status between Paid/Pending.

#### GET /api/tenants/:tenantId/history
Get payment and deposit history for specific tenant.

#### POST /api/tenants/:tenantId/deposits
Add deposit payment record for tenant.

### Models

#### Tenant Schema
- currentTenant (ref to Tenant)

#### Payment Schema
- tenantId, flatId, amount, month (YYYY-MM format)
- status (Paid/Pending), date (when paid)
- Index: unique combination of tenantId + month

#### DepositPayment Schema
- tenantId, amount, date, note

### Context & Hooks
**RentContext** provides:
- `flats`, `month`, `history`, `rentHistory`, `tenantHistory`
- `loadDashboard()`, `loadHistory()`, `loadRentHistory(monthKey)`
- `moveIn()`, `vacate()`, `togglePayment()`
- `formatCurrency()` - Format numbers as USD
- Auto-refresh polling: 30 seconds for all pages

### Database Configuration
**MongoDB Atlas Cloud Storage** provides automatic backups and data safety:
- Connection: `mongodb+srv://admin:<password>@healthcluster.p0oj6ri.mongodb.net/rent_management`
- Database: rent_management
- Configuration: Stored in `backend/.env` (MONGODB_URI)
- Atlas handles data replication and backups automatically
- Fail-fast mode in production: Server will not start if MONGODB_URI is missing

### Setup Instructions

1. **Start Backend Server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend Server** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

### Recent Changes
- Removed one-click backup feature (no longer needed with MongoDB Atlas)
- Removed backupUtils.js and backup endpoint
- Switched from local MongoDB to MongoDB Atlas cloud storage
- Simplified data management - Atlas handles all backups automatically

### Important Notes
- **MongoDB Atlas**: All data is automatically backed up and replicated in the cloud
- **No Manual Backups Required**: Data is safe with Atlas's infrastructure
- **Connection String**: Stored securely in MONGODB_URI environment variable
- **Database**: rent_management on Atlas cluster (healthcluster)Production Features
- **MongoDB Atlas**: All data is automatically backed up and replicated in the cloud
- **Error Handling**: Comprehensive try/catch blocks on all async routes with user-friendly error messages
- **Transactions**: Move-in and vacate operations wrapped in MongoDB sessions for data consistency
- **Data Validation**: Calendar dates validated to prevent invalid inputs (e.g., February 31st)
- **Modal Error Handling**: Add Tenant modal stays open on API failure for data correction
- **Optimized Polling**: 30-second auto-refresh intervals to reduce server load
- **Fail-Fast DB**: Production mode requires MONGODB_URI environment variable
- **Rent History Accuracy**: Includes past tenant data for complete historical reporting

### Important Notes
- **MongoDB Atlas**: All data automatically backed up and replicated in the cloud
- **Connection String**: Stored securely in MONGODB_URI environment variable
- **Database**: rent_management on Atlas cluster (healthcluster)
- **Authentication**: Hardcoded credentials for family use only - no public deployment intended