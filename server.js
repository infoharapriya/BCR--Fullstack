const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ⭐ Allow all origins in production (or keep CLIENT_URL if you want strict)
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mongo
mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/ocr", require("./routes/ocr"));
app.use("/api/qr", require("./routes/qr"));
app.use("/api/event", require("./routes/event"));

// ⭐ Serve React frontend (AFTER API routes)
const __dirname = path.resolve(); // 👈 Move this here
app.use(express.static(path.join(__dirname, "build"))); // 👈 remove "server/"

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html")); // 👈 remove "server/"
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
