// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://13.209.72.3", // Allow only your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

app.use(express.json());

app.use("/api", require("./routes/employee"));
app.use("/api", require("./routes/timeTrack"));
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    authSource: "admin",
    user: process.env.User,
    pass: process.env.Pass,
  })
  .then(() => {
    console.log("Db connected!");
  });
// Basic Route
app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

// Start Server
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // Bind to all available network interfaces

app.listen(PORT, HOST, () => console.log(`Server running on port ${PORT}`));
