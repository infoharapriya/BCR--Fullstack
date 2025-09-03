// routes/events.js (ESM)

import express from "express";
import Event from "../models/Event.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Public: list
router.get("/", async (req, res) => {
  console.log("📥 /api/events called");
  const events = await Event.find().sort({ name: 1 });
  res.json(events);
});

// Admin: create
router.post("/", auth("admin"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const exists = await Event.findOne({ name });
    if (exists) return res.status(400).json({ message: "Event already exists" });

    const ev = await Event.create({ name });
    res.json(ev);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: update
router.put("/:id", auth("admin"), async (req, res) => {
  try {
    const ev = await Event.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    if (!ev) return res.status(404).json({ message: "Not found" });
    res.json(ev);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin: delete
router.delete("/:id", auth("admin"), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
