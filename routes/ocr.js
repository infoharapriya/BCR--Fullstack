
import express from "express";
import multer from "multer";
// import fetch from "node-fetch";
// import FormData from "form-data";
import auth from "../middleware/auth.js";
import OCRresult from "../models/OCRresult.js";
import ExcelJS from "exceljs";
import Tesseract from "tesseract.js"; //  Added import

const router = express.Router();

//  Limit file size to 1MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
});


function parseOCRText(text) {
  const fields = {
    name: "",
    designation: "",
    company: "",
    number: "",
    numbers: [],
    email: "",
    emails: [],
    site: "",
    sites: [],
    address: "",
  };

  // --- Clean text ---
  const cleanText = text.replace(/\s+/g, " ").trim();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // --- Regex patterns ---
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,15}\b/gi;
  const phoneRegex = /\+?\d[\d\s\-()]{7,20}\d/g;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.[a-z]{2,15})/gi;

  // Expanded job keywords (multi-word support)
  const jobKeywords = [
    "Managing Director",
    "Assistant Vice President",
    "Vice President",
    "Software Engineer",
    "Senior Software Engineer",
    "Software Development Engineer",
    "Business Development Executive",
    "Head of Operations",
    "Product Manager",
    "Project Manager",
    "Marketing Manager",
    "Sales Executive",
    "Design Lead",
    "Chief Executive Officer",
    "Chief Technology Officer",
    "Chief Financial Officer",
    "Chief Operating Officer",
    "Consultant",
    "Specialist",
    "Engineer",
    "Developer",
    "Designer",
    "Executive",
    "Officer",
    "Head",
    "Lead",
    "Manager",
    "Director",
    "Founder",
    "Partner",
  ];

  const companyKeywords =
    /\b(LTD|LLP|INC|PVT|TECH|TECHNOLOGIES|SOLUTIONS|SYSTEMS|CORP|COMPANY|ENTERPRISES|INDUSTRIES|GROUP|PRIVATE|LIMITED|INCORPORATED)\b/i;

  // --- Extract emails ---
  const emails = cleanText.match(emailRegex);
  if (emails) {
    fields.emails = [...new Set(emails)];
    fields.email = fields.emails[0];
  }

  // --- Extract phones ---
  const phones = cleanText.match(phoneRegex);
  if (phones) {
    fields.numbers = [
      ...new Set(phones.map((num) => num.replace(/[^0-9+]/g, ""))),
    ];
    fields.numbers = fields.numbers.map((num) => {
      if (!num.startsWith("+") && num.length === 10) return "+91" + num;
      return num;
    });
    fields.number = fields.numbers[0];
  }

  // --- Extract websites ---
  const sites = cleanText.match(urlRegex);
  if (sites) {
    fields.sites = [...new Set(sites.map((s) => s.replace(/[,;]$/, "")))];
    fields.site = fields.sites[0];
  }

  // --- Extract designation (multi-word support) ---
  const designationLine = lines.find((l) =>
    jobKeywords.some((job) => l.toLowerCase().includes(job.toLowerCase()))
  );
  if (designationLine) {
    fields.designation = designationLine;
  }

  // --- Extract company ---
  const companyLine = lines.find((l) => companyKeywords.test(l));
  if (companyLine) {
    fields.company = companyLine;
  } else if (fields.email) {
    const domain = fields.email.split("@")[1].split(".")[0];
    fields.company = domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  // --- Extract name ---
  const possibleNames = lines.filter(
    (l) =>
      /^[A-Za-z .]{2,40}$/.test(l) &&
      l.split(" ").length <= 4 &&
      !jobKeywords.some((job) => l.toLowerCase().includes(job.toLowerCase())) &&
      !companyKeywords.test(l)
  );
  if (possibleNames.length) {
    fields.name = possibleNames[0];
  }

  // Fallback: from email username
  if (!fields.name && fields.email) {
    let username = fields.email.split("@")[0];
    username = username.replace(/\d+/g, "").replace(/[._-]/g, " ");
    fields.name = username
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // --- Extract address ---
  const used = new Set(
    [
      fields.name,
      fields.designation,
      fields.company,
      fields.email,
      fields.site,
      ...fields.emails,
      ...fields.sites,
      ...fields.numbers,
    ].filter(Boolean)
  );
  const addressLines = lines.filter(
    (l) => ![...used].some((u) => l.includes(u))
  );
  if (addressLines.length) fields.address = addressLines.join(", ");

  return fields;
}

// --- OCR endpoint ---
router.post("/scan", auth(), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const {
      data: { text },
    } = await Tesseract.recognize(req.file.buffer, "eng");

    const parsed = parseOCRText(text);

    res.json({
      raw: text,
      fields: parsed,
    });
  } catch (err) {
    console.error("OCR error:", err.message);
    res.status(500).json({ message: "OCR failed" });
  }
});
/**
 * Save Scanned Card
 */
router.post("/save", auth(), async (req, res) => {
  try {
    const {
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
    } = req.body;

    //  Flexible duplicate check
    const query = [];
    if (email) query.push({ email });
    if (number) query.push({ number });
    const exists = query.length
      ? await OCRresult.findOne({ $or: query })
      : null;

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
    console.error("Save error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});



//08/09/2025
router.get("/history", auth(), async (req, res) => {
  try {
    const { event, type, limit } = req.query;

    let query = { createdBy: req.user.id };
    if (event) query.event = event;
    if (type) query.type = type;

    const docs = await OCRresult.find(query)
      .populate("event", "name")
      .sort({ createdAt: 1 }) // ascending order
      .limit(Number(limit) || 200);

    res.json(docs);
  } catch (err) {
    console.error("History fetch error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//table data into excel
//08/09/2025
router.get("/export", auth(), async (req, res) => {
  try {
    const { event, type, limit } = req.query;

    let query = { createdBy: req.user.id };
    if (event) query.event = event;
    if (type) query.type = type;

    const rows = await OCRresult.find(query)
      .populate("event", "name")
      .sort({ createdAt: 1 })
      .limit(Number(limit) || 200);

    // res.json(docs);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("OCR Records");

    worksheet.columns = [
      { header: "S.No", key: "sno", width: 6 },
      { header: "Date", key: "date", width: 15 },
      { header: "Event", key: "event", width: 25 },
      { header: "Type", key: "type", width: 15 },
      { header: "Name", key: "name", width: 20 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Company", key: "company", width: 25 },
      { header: "Number", key: "number", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Website", key: "site", width: 25 },
      { header: "Address", key: "address", width: 30 },
      { header: "Raw OCR Text", key: "raw", width: 50 },
    ];

    rows.forEach((r, index) => {
      worksheet.addRow({
        sno: index + 1,
        date: r.createdAt.toLocaleDateString(),
        event: r.event?.name || "—",
        type: r.type,
        name: r.name,
        designation: r.designation,
        company: r.company,
        number: r.number,
        email: r.email,
        site: r.site,
        address: r.address,
        raw: r.raw,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ocr_records.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export error:", err.message);
    res.status(500).json({ message: "Failed to export Excel" });
  }
});

/**
 * Get Single Record
 */
router.get("/:id", auth(), async (req, res) => {
  try {
    const record = await OCRresult.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) {
    console.error("Fetch single record error:", err.message);
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

/**
 * Update Record
 */
router.put("/update/:id", auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await OCRresult.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Record not found or not authorized" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Delete Record
 */
router.delete("/delete/:id", auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OCRresult.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Record not found or not authorized" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
