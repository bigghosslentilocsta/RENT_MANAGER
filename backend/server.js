const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { connectDb, ensureFlatsSeeded } = require("./src/config/db");
const apiRoutes = require("./src/routes");

dotenv.config();

const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

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

startServer();
