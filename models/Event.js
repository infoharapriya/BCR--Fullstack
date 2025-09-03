// models/Event.js (ESM)

import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
