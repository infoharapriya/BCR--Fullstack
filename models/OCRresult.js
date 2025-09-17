import mongoose from "mongoose";

const ocrResultSchema = new mongoose.Schema(
  {
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const OCRresult = mongoose.model("OCRresult", ocrResultSchema);

export default OCRresult;
