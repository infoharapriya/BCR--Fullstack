import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ⭐ Allow all origins in production (or keep CLIENT_URL if you want strict)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mongo
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

// Routes (ESM syntax)
import authRoutes from "./routes/auth.js";
import eventsRoutes from "./routes/events.js";
import ocrRoutes from "./routes/ocr.js";
import qrRoutes from "./routes/qr.js";
import eventRoutes from "./routes/event.js";

app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/event", eventRoutes);

// ⭐ Serve React frontend (AFTER API routes)
const __dirname = path.resolve();


// ✅ Correct (since build/ is inside server root)
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});



// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
