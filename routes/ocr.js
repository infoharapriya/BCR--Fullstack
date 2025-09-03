const express = require("express");
const multer = require("multer");
const tesseract = require("node-tesseract-ocr");
const auth = require("../middleware/auth");
const OCRresult = require("../models/OCRresult");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Utility: Extract fields from OCR text ---
function extractFields(text) {
  const fields = {
    name: "",
    designation: "",
    company: "",
    number: "",
    email: "",
    site: "",
    address: "",
  };

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // email
  const e = lines.find(l => l.includes("@") && l.includes("."));
  if (e) fields.email = e;

  // phone
  for (const l of lines) {
    const digits = (l.match(/\d/g) || []).length;
    if (!fields.number && digits >= 8) {
      fields.number = l;
      break;
    }
  }

  // site
  const s = lines.find(l => /www\.|http/i.test(l));
  if (s) fields.site = s;

  // designation
  const desigK = [
    "director", "manager", "ceo", "cto", "cfo", "founder",
    "engineer", "marketing", "owner", "sales", "lead", "consultant"
  ];
  const d = lines.find(l => desigK.some(k => l.toLowerCase().includes(k)));
  if (d) fields.designation = d;

  // company (first all caps line not email/site)
  const c = lines.find(l => l === l.toUpperCase() && !l.includes("@") && !/www\.|http/i.test(l) && l.length > 2);
  if (c) fields.company = c;

  // name (two capitalized words)
  const n = lines.find(l => {
    if (l === fields.company || l === fields.designation) return false;
    if (/@|www\.|http/.test(l)) return false;
    const parts = l.split(/\s+/);
    return parts.length === 2 && parts.every(p => /^[A-Z][a-zA-Z]+$/.test(p));
  });
  if (n) fields.name = n;

  // address (bottom area, with digits/commas)
  const rev = [...lines].reverse();
  const a = rev.find(l => l.length > 12 && /[,0-9]/.test(l) && !/@|www\.|http/.test(l));
  if (a) fields.address = a;

  return fields;
}

// --- OCR Scan ---
router.post("/scan", auth(), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const text = await tesseract.recognize(req.file.buffer, { lang: "eng" });
    const fields = extractFields(text);

    res.json({ raw: text, fields });
  } catch (e) {
    console.error("OCR failed:", e);
    res.status(500).json({ message: "OCR failed", error: e.message });
  }
});

// --- Save Card ---
router.post("/save", auth(), async (req, res) => {
  try {
    const { name, designation, company, number, email, site, address, event, type, raw } = req.body;

    // Prevent duplicates by email or phone
    const exists = await OCRresult.findOne({ $or: [{ email }, { number }] });
    if (exists) {
      return res.status(400).json({ message: "Duplicate entry found" });
    }

    const card = new OCRresult({
      name,
      designation,
      company,
      number,
      email,
      site,
      address,
      event,
      type,
      raw,
      createdBy: req.user.id,
    });

    await card.save();
    res.json({ message: "Card saved", card });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- History (must come before /:id !) ---
router.get("/history", auth(), async (req, res) => {
  try {
    const docs = await OCRresult.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(docs);
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get single record by ID ---
router.get("/:id", auth(), async (req, res) => {
  try {
    const record = await OCRresult.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(record);
  } catch (err) {
    console.error("Fetch single record error:", err);
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

// --- Update Record ---
router.put("/update/:id", auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await OCRresult.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Record not found or not authorized" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Delete Record ---
router.delete("/delete/:id", auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OCRresult.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Record not found or not authorized" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
