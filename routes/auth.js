// routes/auth.js (ESM)

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Seed read-only user
router.post("/seed-user", async (req, res) => {
  try {
    const exists = await User.findOne({ email: "user@gmail.com" });
    if (exists) return res.json({ message: "Read-only user already exists" });

    const hash = await bcrypt.hash("User@123", 10);
    const user = await User.create({
      name: "ReadOnlyUser",
      email: "user@gmail.com",
      password: hash,
      role: "user", // 👈 only read permissions
    });

    res.json({ message: "Read-only user seeded", user: { email: user.email } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Seed an admin if none exists
router.post("/seed-admin", async (req, res) => {
  try {
    const exists = await User.findOne({ email: "admin@demo.com" });
    if (exists) return res.json({ message: "Admin already exists" });

    const hash = await bcrypt.hash("Admin@123", 10);
    const user = await User.create({
      name: "Admin",
      email: "admin@demo.com",
      password: hash,
      role: "admin",
    });

    res.json({ message: "Admin seeded", user: { email: user.email } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Register (optional, for demo; admin can create users too)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role });

    res.json({
      message: "Registered",
      user: { id: user._id, email, role },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  console.log(req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({ token, role: user.role, name: user.name });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: e.message });
  }
});

export default router;
