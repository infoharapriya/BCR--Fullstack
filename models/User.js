const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, required: true },
  password: { type: String, required: true }, // hashed
  role: { type: String, enum: ["admin", "user"], default: "user" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
