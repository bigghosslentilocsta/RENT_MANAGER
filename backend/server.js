const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDb, ensureFlatsSeeded } = require("./src/config/db");
const authenticateRequest = require("./src/middleware/authenticateRequest");
const apiRoutes = require("./src/routes");

dotenv.config();

const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";
let isDbReady = false;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  }
};

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false
});

const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "128kb" }));

// Simple request logger to troubleshoot static asset requests in production
app.use((req, res, next) => {
  try {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  } catch (e) {}
  next();
});
app.use("/api", apiRateLimiter);
app.use("/api/auth/login", loginRateLimiter);

// API data should always be fresh for dashboard/rent status on all devices.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use("/api", (req, res, next) => {
  if (!isDbReady) {
    return res.status(503).json({ message: "Service is starting. Please retry in a few seconds." });
  }

  return next();
});

app.use("/api", authenticateRequest, apiRoutes);

// Serve frontend build in production
if (NODE_ENV === "production") {
  const fs = require("fs");
  const candidatePaths = [
    path.join(__dirname, "frontend-dist"),
    path.join(__dirname, "../frontend/dist"),
    path.join(process.cwd(), "frontend/dist")
  ];

  let frontendBuildPath = candidatePaths.find((p) => {
    try {
      return fs.existsSync(p);
    } catch (e) {
      return false;
    }
  });

  if (!frontendBuildPath) {
    // fallback to first candidate for clearer error messages
    frontendBuildPath = candidatePaths[0];
  }

  console.log(`Serving static files from: ${frontendBuildPath}`);
  if (!fs.existsSync(frontendBuildPath)) {
    console.warn(`⚠️  WARNING: Frontend dist folder not found at any of: ${candidatePaths.join(", ")}`);
  } else {
    console.log(`✓ Frontend dist folder found`);
  }

  app.use(express.static(frontendBuildPath, {
    maxAge: "1y",
    etag: false,
    index: false
  }));

  // If an asset path is requested but file is missing, return explicit 404
  app.use((req, res, next) => {
    if (req.path && req.path.startsWith("/assets/")) {
      const assetFile = path.join(frontendBuildPath, req.path.replace(/^\//, ""));
      try {
        if (!fs.existsSync(assetFile)) {
          console.error(`Asset not found: ${assetFile}`);
          return res.status(404).type("text/plain").send("Not Found");
        }
      } catch (e) {
        console.error("Error checking asset file", e && (e.stack || e.message || e));
        return res.status(500).type("text/plain").send("Internal Server Error");
      }
    }

    return next();
  });

  // Debug endpoint to list static files (remove in production when resolved)
  app.get("/_debug/static-files", (req, res) => {
    try {
      const walk = (dir) => {
        const list = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const it of items) {
          const full = path.join(dir, it.name);
          if (it.isDirectory()) {
            walk(full).forEach((p) => list.push(path.relative(frontendBuildPath, p)));
          } else {
            list.push(path.relative(frontendBuildPath, full));
          }
        }
        return list;
      };

      if (!fs.existsSync(frontendBuildPath)) {
        return res.status(404).json({ error: 'frontend dist not found', path: frontendBuildPath });
      }

      const files = walk(frontendBuildPath);
      return res.json({ path: frontendBuildPath, files });
    } catch (err) {
      console.error('Error listing static files', err && (err.stack || err.message || err));
      return res.status(500).json({ error: 'failed to list static files' });
    }
  });
  
  // Fallback route for React Router (never for direct file requests like .js/.css)
  app.get("*", (req, res) => {
    if (path.extname(req.path)) {
      return res.status(404).type("text/plain").send("Not Found");
    }

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Rent Management API" });
  });
}

// Generic error logger so static file problems show up clearly in platform logs
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && (err.stack || err.message || err));
  if (!res.headersSent) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const port = process.env.PORT || 5000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initializeDatabaseWithRetry = async () => {
  const retryDelayMs = 5000;

  while (!isDbReady) {
    try {
      await connectDb();
      await ensureFlatsSeeded();
      isDbReady = true;
      console.log("Database is ready.");
    } catch (error) {
      console.error("Database initialization failed. Retrying in 5 seconds...");
      console.error(error.message || error);
      await delay(retryDelayMs);
    }
  }
};

const startServer = async () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  initializeDatabaseWithRetry().catch((error) => {
    console.error("Unexpected database initialization error.");
    console.error(error.message || error);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend server.");
  console.error(error.message || error);
  process.exit(1);
});
