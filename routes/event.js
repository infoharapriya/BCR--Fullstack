// routes/event.js (ESM)

import express from "express";
import auth from "../middleware/auth.js";

const router = express.Router();

//  Only admin can create/update/delete
router.post("/", auth("admin"), async (req, res) => {
  res.json({ message: "Event created" });
});

router.put("/:id", auth("admin"), async (req, res) => {
  res.json({ message: "Event updated" });
});

router.delete("/:id", auth("admin"), async (req, res) => {
  res.json({ message: "Event deleted" });
});

//  Both admin + user can view events
router.get("/", auth(), async (req, res) => {
  res.json({ message: "Events list" });
});

export default router;
