const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDb, ensureFlatsSeeded } = require("./src/config/db");
const apiRoutes = require("./src/routes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectDb();
  await ensureFlatsSeeded();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
