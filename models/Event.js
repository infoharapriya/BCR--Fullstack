const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
