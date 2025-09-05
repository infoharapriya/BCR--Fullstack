// const mongoose = require("mongoose");

// const ocrResultSchema = new mongoose.Schema({
//   customId: { type: String, unique: true },   // Example: TAT-EVE-CUS-001
//   name: String,
//   designation: String,
//   company: String,
//   number: String,
//   email: String,
//   site: String,
//   address: String,
//   event: String,       // selected on Home
//   type: String,        // Customer | Supplier
//   raw: String,
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
// }, { timestamps: true });

// // Pre-save hook for customId generation
// ocrResultSchema.pre("save", async function (next) {
//   if (!this.customId && this.company && this.event && this.type) {
//     try {
//       const prefix = this.company.substring(0, 3).toUpperCase();
//       const eventPrefix = this.event.substring(0, 3).toUpperCase();
//       const typePrefix = this.type.toLowerCase() === "customer" ? "CUS" : "SUP";

//       const base = `${prefix}-${eventPrefix}-${typePrefix}`;

//       // Find latest record with same base
//       const lastRecord = await mongoose.model("OCRresult").findOne({
//         customId: new RegExp(`^${base}-\\d+$`)
//       }).sort({ createdAt: -1 });

//       let serial = 1;
//       if (lastRecord && lastRecord.customId) {
//         const lastSerial = parseInt(lastRecord.customId.split("-").pop(), 10);
//         serial = lastSerial + 1;
//       }

//       this.customId = `${base}-${String(serial).padStart(3, "0")}`;
//       next();
//     } catch (err) {
//       next(err);
//     }
//   } else {
//     next();
//   }
// });

// ocrResultSchema.index({ name: 1, company: 1, email: 1, number: 1 }, { unique: false });

// module.exports = mongoose.model("OCRresult", ocrResultSchema);



// const mongoose = require("mongoose");

// const ocrResultSchema = new mongoose.Schema({
//   customId: { type: String, unique: true },   // Example: TATA-001
//   name: String,
//   designation: String,
//   company: String,
//   number: String,
//   email: String,
//   site: String,
//   address: String,
//   event: String,       // selected on Home
//   type: String,        // Customer | Supplier
//   raw: String,
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
// }, { timestamps: true });

// // ✅ Pre-save hook for customId generation (global serial)
// ocrResultSchema.pre("save", async function (next) {
//   if (!this.customId && this.company) {
//     try {
//       // Take first 4 letters of company (uppercase, no spaces)
//       const prefix = this.company.replace(/\s+/g, "").substring(0, 4).toUpperCase();

//       // Find the latest record (any company)
//       const lastRecord = await mongoose.model("OCRresult").findOne({})
//         .sort({ createdAt: -1 });

//       let serial = 1;
//       if (lastRecord && lastRecord.customId) {
//         const lastSerial = parseInt(lastRecord.customId.split("-").pop(), 10);
//         serial = lastSerial + 1;
//       }

//       // Final customId format: PREFIX-001 (global counter)
//       this.customId = `${prefix}-${String(serial).padStart(3, "0")}`;
//       next();
//     } catch (err) {
//       next(err);
//     }
//   } else {
//     next();
//   }
// });

// ocrResultSchema.index({ name: 1, company: 1, email: 1, number: 1 }, { unique: false });

// module.exports = mongoose.model("OCRresult", ocrResultSchema);
// models/OCRresult.js (ESM)

import mongoose from "mongoose";

const ocrResultSchema = new mongoose.Schema(
  {
    // customId: { type: String, unique: true }, // Example: TATA-001
    name: String,
    designation: String,
    company: String,
    number: String,
    email: String,
    site: String,
    address: String,
   
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    type: String, // Customer | Supplier
    raw: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// ✅ Pre-save hook for customId generation
ocrResultSchema.pre("save", async function (next) {
  if (!this.customId && this.company) {
    try {
      const OCRresult = mongoose.model("OCRresult"); // avoid import recursion

      // Take first 4 letters of company (uppercase, no spaces)
      const prefix = this.company.replace(/\s+/g, "").substring(0, 4).toUpperCase();

      // Find the latest record
      const lastRecord = await OCRresult.findOne({}).sort({ createdAt: -1 });

      let serial = 1;
      if (lastRecord?.customId) {
        const lastSerial = parseInt(lastRecord.customId.split("-").pop(), 10);
        if (!isNaN(lastSerial)) {
          serial = lastSerial + 1;
        }
      }

      // Final customId format: PREFIX-001
      this.customId = `${prefix}-${String(serial).padStart(3, "0")}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Index for faster lookups (not unique to allow duplicates in edge cases)
ocrResultSchema.index({ name: 1, company: 1, email: 1, number: 1 });

const OCRresult = mongoose.model("OCRresult", ocrResultSchema);

export default OCRresult;
