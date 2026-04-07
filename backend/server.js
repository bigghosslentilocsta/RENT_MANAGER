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
app.use("/api", apiRateLimiter);
app.use("/api/auth/login", loginRateLimiter);

// API data should always be fresh for dashboard/rent status on all devices.
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use("/api", authenticateRequest, apiRoutes);

// Serve frontend build in production
if (NODE_ENV === "production") {
  const frontendBuildPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendBuildPath));
  
  // Fallback route for React Router
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Rent Management API" });
  });
}

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectDb();
  await ensureFlatsSeeded();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend server.");
  console.error(error.message || error);
  process.exit(1);
});
