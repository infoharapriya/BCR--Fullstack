// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import path from "path";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // ⭐ Allow all origins in production (or keep CLIENT_URL if you want strict)
// const allowedOrigins = [
//   "http://localhost:5173",   // dev
//   "https://bcr-fullstack.onrender.com", // prod
// ];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Mongo
// mongoose
//   .connect(process.env.MONGO_URI, {})
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ MongoDB error", err));

// // Routes (ESM syntax)
// import authRoutes from "./routes/auth.js";
// import eventsRoutes from "./routes/events.js";
// import ocrRoutes from "./routes/ocr.js";
// import qrRoutes from "./routes/qr.js";
// import eventRoutes from "./routes/event.js";

// app.use("/api/auth", authRoutes);
// app.use("/api/events", eventsRoutes);
// app.use("/api/ocr", ocrRoutes);
// app.use("/api/qr", qrRoutes);
// app.use("/api/event", eventRoutes);

// // ⭐ Serve React frontend (AFTER API routes)
// const __dirname = path.resolve();


// // ✅ Correct (since build/ is inside server root)
// app.use(express.static(path.join(__dirname, "dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });



// // Start server
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./models/User.js";   // 👈 import User model

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",   // dev
  "https://bcr-fullstack.onrender.com", // prod
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mongo
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ MongoDB connected");
    seedDefaultUsers(); // 👈 Seed users after DB connect
  })
  .catch((err) => console.error("❌ MongoDB error", err));

// -------------------------
// Automatic Seeding Function
// -------------------------
async function seedDefaultUsers() {
  try {
    // Admin
    const adminExists = await User.findOne({ email: "admin@demo.com" });
    if (!adminExists) {
      const hash = await bcrypt.hash("Admin@123", 10);
      await User.create({
        name: "Admin",
        email: "admin@demo.com",
        password: hash,
        role: "admin",
      });
      console.log("✅ Admin seeded: admin@demo.com / Admin@123");
    } else {
      console.log("⚡ Admin already exists");
    }

    // Read-only User
    const userExists = await User.findOne({ email: "user@gmail.com" });
    if (!userExists) {
      const hash = await bcrypt.hash("User@123", 10);
      await User.create({
        name: "ReadOnlyUser",
        email: "user@gmail.com",
        password: hash,
        role: "user",
      });
      console.log("✅ Read-only user seeded: user@gmail.com / User@123");
    } else {
      console.log("⚡ Read-only user already exists");
    }
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
  }
}

// Routes
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

// Serve frontend
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
