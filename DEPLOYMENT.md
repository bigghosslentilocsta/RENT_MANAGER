# Deployment Guide: Render

This guide walks you through deploying the Punnam Rent Manager application to Render.com.

## Architecture Overview

The application is deployed as a single Node.js service that:
- Runs the backend API on PORT 5000 (configurable)
- Serves the built frontend React files
- Connects to MongoDB Atlas for database

## Prerequisites

1. **Render.com Account** - Sign up at [render.com](https://render.com)
2. **GitHub Repository** - Your code pushed to GitHub (✓ already done)
3. **MongoDB Atlas** - Cloud database with connection string (✓ already configured)
4. **Environment Variables** - Ready to configure in Render dashboard

## Step 1: Prepare Your Code

### 1.1 Update Backend Server (Already Done)
The backend `server.js` is already configured to serve the frontend build in production.

### 1.2 Build the Frontend Locally (Optional Testing)
```bash
cd frontend
npm install
npm run build
```
This creates a `dist/` folder that the backend will serve in production.

## Step 2: Create a Render Service

### 2.1 Connect Git Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Select **Connect a repository**
4. Choose your GitHub repository (bigghosslentilocsta/RENT_MANAGER)
5. Click **Connect**

### 2.2 Configure the Web Service

**Name:**
```
punnam-rent-manager
```

**Environment:**
```
Node
```

**Region:**
```
Singapore (or closest to your users)
```

**Branch:**
```
main
```

**Build Command:**
```bash
npm ci --include=dev --prefix frontend && npm run build --prefix frontend && npm ci --prefix backend
```

**Start Command:**
```bash
npm start --prefix backend
```

## Step 3: Configure Environment Variables

In the Render dashboard, go to **Environment** tab and add:

```
MONGODB_URI=mongodb+srv://admin:<YOUR_PASSWORD>@healthcluster.p0oj6ri.mongodb.net/rent_management
PORT=5000
NODE_ENV=production
```

### To get your MongoDB Atlas connection string:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **Databases** → **healthcluster**
3. Click **Connect** → **Drivers**
4. Copy the connection string and replace `<password>` with your actual password
5. Paste it in Render's `MONGODB_URI` environment variable

## Step 4: Deploy

1. Click **Create Web Service**
2. Render will automatically:
   - Build the frontend (creates `dist/` folder)
   - Install backend dependencies
   - Deploy the service
   - Provide a live URL (e.g., `https://punnam-rent-manager.onrender.com`)

**Deployment usually takes 2-5 minutes.**

## Step 5: First-Time Setup

1. Visit your Render URL: `https://punnam-rent-manager.onrender.com`
2. You should see the login page
3. Log in with:
   - **Username:** `PUNNAM444`
   - **Password:** `PUNNAM444`

## Step 6: Enable Auto-Deploy (Recommended)

**In Render dashboard:**
1. Go to your service settings
2. Enable **Auto-Deploy** for the `main` branch
3. Now every push to GitHub triggers a redeploy

## Troubleshooting

### Issue: "Cannot find module" errors during build
**Solution:** Ensure all dependencies are listed in `package.json`
```bash
# Run locally to test
npm install
npm run build
```

### Issue: Frontend shows blank or 404 errors
**Solution:** Check that:
1. The `frontend/dist/` folder is built before deployment
2. Build command includes `frontend` build
3. Backend's `NODE_ENV=production` in environment variables

### Issue: API calls return 404 or CORS errors
**Solution:** 
1. Verify `VITE_API_URL=/api` in frontend code (same-domain routing)
2. Check that backend is serving from `/api` routes
3. Ensure `MONGODB_URI` is correct and available

### Issue: Database connection fails
**Solution:**
1. Verify `MONGODB_URI` is correct (including password)
2. Add Render's IP to MongoDB Atlas IP whitelist:
   - Go to MongoDB Atlas → **Network Access** → **Add IP Address**
   - Select **Allow access from anywhere** (for testing) OR
   - Add Render's IP range (get from Render logs when deployment fails)

## Monitoring & Logs

**View live logs in Render:**
1. From the service dashboard, click **Logs** tab
2. See real-time logs for debugging

## Update & Redeploy

To redeploy after code changes:

```bash
# Make changes locally
git add .
git commit -m "Your message"
git push origin main

# Render auto-deploys if enabled
# Or manually trigger in Render dashboard
```

## Environment Variables Reference

| Variable | Example | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `PORT` | `5000` | Server port (Render assigns dynamically, safe to set) |
| `NODE_ENV` | `production` | Environment mode |

## SSL/HTTPS

Render automatically provides SSL certificates for all services. Your app runs on `https://` by default.

## Cost Estimate

**Render Pricing (as of March 2026):**
- **Web Service:** Free tier includes 750 compute hours/month (shared CPU)
- **PostgreSQL/MySQL:** Not needed (using MongoDB Atlas)
- **Upgrade to paid:** ~$7-12/month for dedicated resources

**MongoDB Atlas Pricing:**
- Free tier: 512MB storage (sufficient for small apps)
- Paid tier: ~$9+/month for shared clusters

## Final Checklist

- [ ] GitHub repo created and pushed
- [ ] MongoDB Atlas cluster set up
- [ ] Render account created
- [ ] Build command includes frontend build
- [ ] All environment variables configured
- [ ] Deployed service running
- [ ] Login works (PUNNAM444 / PUNNAM444)
- [ ] Dashboard loads and shows flats
- [ ] WhatsApp notifications work
- [ ] Translation toggle works
- [ ] Auto-deploy enabled

## Support & Resources

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/cloud
- **React/Vite:** https://vitejs.dev/guide/ssr.html
- **Express.js:** https://expressjs.com/

---

**Deployed at:** `https://punnam-rent-manager.onrender.com`

