// import express from "express";
// import multer from "multer";
// import fetch from "node-fetch";
// import FormData from "form-data";
// import auth from "../middleware/auth.js";
// import OCRresult from "../models/OCRresult.js";
// import { Readable } from "stream";
// // import dotenv from dotenv;
// // dotenv.config();


// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// function extractFields(text) {
//   const fields = { name: "", designation: "", company: "", number: "", email: "", site: "", address: "" };
//   const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

//   // email
//   const e = lines.find(l => l.includes("@") && l.includes("."));
//   if (e) fields.email = e;

//   // phone
//   for (const l of lines) {
//     const digits = (l.match(/\d/g) || []).length;
//     if (!fields.number && digits >= 8) {
//       fields.number = l;
//       break;
//     }
//   }

//   // site
//   const s = lines.find(l => /www\.|http/i.test(l));
//   if (s) fields.site = s;

//   // designation
//   const desigK = ["director","manager","ceo","cto","cfo","founder","engineer","marketing","owner","sales","lead","consultant"];
//   const d = lines.find(l => desigK.some(k => l.toLowerCase().includes(k)));
//   if (d) fields.designation = d;

//   // company (all caps)
//   const c = lines.find(l => l === l.toUpperCase() && !l.includes("@") && !/www\.|http/i.test(l) && l.length > 2);
//   if (c) fields.company = c;

//   // name
//   const n = lines.find(l => {
//     if (l === fields.company || l === fields.designation) return false;
//     if (/@|www\.|http/.test(l)) return false;
//     const parts = l.split(/\s+/);
//     return parts.length === 2 && parts.every(p => /^[A-Z][a-zA-Z]+$/.test(p));
//   });
//   if (n) fields.name = n;

//   // address (bottom line with numbers/commas)
//   const rev = [...lines].reverse();
//   const a = rev.find(l => l.length > 12 && /[,0-9]/.test(l) && !/@|www\.|http/.test(l));
//   if (a) fields.address = a;

//   return fields;
// }


// router.post("/scan", auth(), upload.single("image"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   try {
//     // Run OCR locally with Tesseract.js
//     const { data: { text } } = await Tesseract.recognize(req.file.buffer, "eng");

//     res.json({ raw: text, fields: extractFields(text) });
//   } catch (err) {
//     console.error("Tesseract OCR error:", err);
//     res.status(500).json({ message: "OCR failed", error: err.message });
//   }
// });
// // router.post("/scan", auth(), upload.single("image"), async (req, res) => {
// //   if (!req.file) {
// //     return res.status(400).json({ message: "No file uploaded" });
// //   }

// //   try {
// //     const formData = new FormData();
// //     formData.append("apikey", process.env.FREE_OCR_SPACE_API_KEY);
// //     formData.append("language", "eng");
// //     formData.append("isOverlayRequired", "false");
// //     formData.append("file", req.file.buffer, {
// //   filename: req.file.originalname,
// //   contentType: req.file.mimetype,
// // });
   

// // console.log("Uploading file:", {
// //   name: req.file.originalname,
// //   size: req.file.size,
// //   type: req.file.mimetype,
// // });


// //     const response = await fetch("https://api.ocr.space/parse/image", {
// //       method: "POST",
// //       body: formData,
// //       headers: formData.getHeaders(),
// //     });

// //     const result = await response.json();
// //     console.log("OCR API result:", JSON.stringify(result, null, 2));

// //     if (result.IsErroredOnProcessing) {
// //       return res.status(500).json({
// //         message: "OCR API error",
// //         error: result.ErrorMessage,
// //       });
// //     }

// //     const text = result.ParsedResults?.[0]?.ParsedText || "";
// //     return res.json({ raw: text, fields: extractFields(text) });
// //   } catch (e) {
// //     console.error("OCR API failed:", e);
// //     return res.status(500).json({ message: "OCR failed", error: e.message });
// //   }
// // });



// /**
//  * Save Scanned Card
//  */
// router.post("/save", auth(), async (req, res) => {
//   try {
//     const { name, designation, company, number, email, site, address, event, type, raw } = req.body;

//     const exists = await OCRresult.findOne({ $or: [{ email }, { number }] });
//     if (exists) {
//       return res.status(400).json({ message: "Duplicate entry found" });
//     }

//     const card = new OCRresult({
//       name,
//       designation,
//       company,
//       number,
//       email,
//       site,
//       address,
//       event,
//       type,
//       raw,
//       createdBy: req.user.id,
//     });

//     await card.save();
//     res.json({ message: "Card saved", card });
//   } catch (err) {
//     console.error("Save error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /**
//  * Fetch History
//  */
// router.get("/history", auth(), async (req, res) => {
//   try {
//     const docs = await OCRresult.find({ createdBy: req.user.id })
//       .sort({ createdAt: -1 })
//       .limit(50);
//     res.json(docs);
//   } catch (err) {
//     console.error("History fetch error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /**
//  * Get Single Record
//  */
// router.get("/:id", auth(), async (req, res) => {
//   try {
//     const record = await OCRresult.findOne({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });

//     if (!record) return res.status(404).json({ error: "Record not found" });

//     res.json(record);
//   } catch (err) {
//     console.error("Fetch single record error:", err);
//     res.status(500).json({ error: "Failed to fetch record" });
//   }
// });

// /**
//  * Update Record
//  */
// router.put("/update/:id", auth(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updated = await OCRresult.findOneAndUpdate(
//       { _id: id, createdBy: req.user.id },
//       req.body,
//       { new: true, runValidators: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Record not found or not authorized" });
//     }

//     res.json(updated);
//   } catch (err) {
//     console.error("Update error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /**
//  * Delete Record
//  */
// router.delete("/delete/:id", auth(), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await OCRresult.findOneAndDelete({
//       _id: id,
//       createdBy: req.user.id,
//     });

//     if (!deleted) {
//       return res.status(404).json({ message: "Record not found or not authorized" });
//     }

//     res.json({ message: "Deleted successfully" });
//   } catch (err) {
//     console.error("Delete error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// export default router;


//09/09/2025 - REGEX
/**
 * Extract fields from OCR text
 */
// --- Helper parser ---
// function parseOCRText(text) {
//   const fields = {
//     name: "",
//     designation: "",
//     company: "",
//     number: "",
//     email: "",
//     site: "",
//     address: "",
//   };

//   const lines = text
//     .split(/\r?\n/)
//     .map(l => l.trim())
//     .filter(Boolean);

//   lines.forEach(line => {
//     // Email
//     if (!fields.email && /^[\w.\-]+@[\w\-]+\.[A-Za-z]{2,}$/i.test(line)) {
//       fields.email = line;
//     }
//     // Phone numbers (handles +91, spaces, dashes, brackets)
//     else if (
//       !fields.number &&
//       /(\+?\d{1,3}[-.\s]?)?(\(?\d{3,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/.test(line)
//     ) {
//       fields.number = line.replace(/[^\d+]/g, "").replace(/(\d{5})(?=\d)/g, "$1 "); // format
//     }
//     // Website
//     else if (!fields.site && /(https?:\/\/[^\s]+|www\.[^\s]+)/i.test(line)) {
//       fields.site = line.replace(/^(https?:\/\/)?(www\.)?/i, "");
//     }
//     // Designation
//     else if (
//       !fields.designation &&
//       /\b(ceo|cto|coo|founder|director|manager|engineer|developer|consultant|officer|president|chairman|head|lead)\b/i.test(
//         line
//       )
//     ) {
//       fields.designation = line;
//     }
//     // Company (keywords + suffix detection)
//     else if (
//       !fields.company &&
//       /\b(pvt|ltd|private|limited|llp|inc|corp|corporation|group|technologies|solutions|systems|industries|enterprise|company)\b/i.test(
//         line
//       )
//     ) {
//       fields.company = line;
//     }
//     // Address (keywords for locations)
//     else if (
//       /(road|street|avenue|nagar|block|sector|city|state|pin|zip|india|usa|uk)/i.test(
//         line
//       )
//     ) {
//       fields.address += (fields.address ? " " : "") + line;
//     }
//   });

//   // Guess Name → must not look like designation/company/email/number
//   if (!fields.name) {
//     const possibleName = lines.find(
//       line =>
//         !line.match(
//           /(director|manager|engineer|developer|pvt|ltd|software|solutions|www\.|\@|\d{5,}|technologies|systems|inc|corp)/i
//         ) && /^[A-Z][a-z]+(\s[A-Z][a-z]+){0,2}$/.test(line) // looks like a human name
//     );
//     fields.name = possibleName || "";
//   }

//   return fields;
// }

import express from "express";
import multer from "multer";
// import fetch from "node-fetch";
// import FormData from "form-data";
import auth from "../middleware/auth.js";
import OCRresult from "../models/OCRresult.js";
import ExcelJS from "exceljs";
import Tesseract from "tesseract.js"; // ✅ Added import

const router = express.Router();

// ✅ Limit file size to 1MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
});

// 10/09/2025
// function parseOCRText(text) {
//   const fields = {
//     name: "",
//     designation: "",
//     company: "",
//     number: "",
//     email: "",
//     site: "",
//     address: "",
//   };

//   const lines = text
//     .split(/\r?\n/)
//     .map(l => l.trim())
//     .filter(Boolean);

//   // Helper regex patterns
//   const emailRegex = /[\w.\-]+@[\w\-]+\.[A-Za-z]{2,}/;
//   const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?){1,2}\d{5,}/;
//   const siteRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
//   const designationKeywords = /\b(ceo|cto|coo|founder|director|manager|engineer|developer|consultant|officer|president|chairman|head|lead|designer|analyst|architect)\b/i;
//   const companyKeywords = /\b(pvt|ltd|private|limited|llp|inc|corp|corporation|group|technologies|solutions|systems|industries|enterprise|company|software)\b/i;
//   const addressKeywords = /(road|street|avenue|nagar|block|sector|city|state|pin|zip|india|usa|uk|suite|building|floor)/i;

//   // Regex to detect human names (first and last, capitalized)
//   const nameRegex = /^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}$/;

//   lines.forEach(line => {
//     const digitsCount = (line.match(/\d/g) || []).length;

//     // Email: any line containing @
//     if (!fields.email && emailRegex.test(line)) {
//       fields.email = line;
//     }
//     // Phone: any line with ≥10 digits
//     else if (!fields.number && digitsCount >= 10 && phoneRegex.test(line)) {
//       fields.number = line.replace(/[^\d+]/g, "");
//     }
//     // Website
//     else if (!fields.site && siteRegex.test(line)) {
//       fields.site = line.replace(/^(https?:\/\/)?(www\.)?/i, "");
//     }
//     // Designation
//     else if (!fields.designation && designationKeywords.test(line)) {
//       fields.designation = line;
//     }
//     // Company
//     else if (!fields.company && companyKeywords.test(line)) {
//       fields.company = line;
//     }
//     // Address (concatenate multiple lines)
//     else if (addressKeywords.test(line)) {
//       fields.address += (fields.address ? " " : "") + line;
//     }
//     // Name (detect with regex if not already filled)
//     else if (!fields.name && nameRegex.test(line)) {
//       fields.name = line;
//     }
//   });

//   // Fallback: guess Name from lines not identified as other fields
//   if (!fields.name) {
//     const possibleName = lines.find(line => {
//       return (
//         line.length > 1 &&
//         !line.includes("@") &&
//         (line.match(/\d/g) || []).length < 2 &&
//         !designationKeywords.test(line) &&
//         !companyKeywords.test(line) &&
//         !siteRegex.test(line)
//       );
//     });
//     fields.name = possibleName || "";
//   }

//   return fields;
// }
// function parseOCRText(text) {
//   const fields = { 
//     name: "", 
//     email: "", 
//     number: "", 
//     designation: "", 
//     company: "", 
//     site: "", 
//     address: "" 
//   };

//   const lines = text
//     .split(/\r?\n/)
//     .map(l => l.replace(/\s+/g, " ").trim())
//     .filter(l => l.length > 1);

//   // Regex patterns
//   const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
//   // Require at least 10 digits (mobile/landline), avoid postal codes
//   const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{6,}/;
//   const siteRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;
//   const designationKeywords = /\b(ceo|cto|coo|founder|director|manager|engineer|consultant|officer|president|chairman|head|lead|designer|analyst|architect)\b/i;
//   const companyKeywords = /\b(pvt|ltd|private|limited|llp|inc|corp|technologies|solutions|systems|industries|enterprise|company|software)\b/i;

//   // 1️⃣ Name
//   if (!fields.name) {
//     const possibleName = lines.find(l => 
//       !l.includes("@") &&
//       !/\d/.test(l) &&
//       !designationKeywords.test(l) &&
//       !companyKeywords.test(l) &&
//       l.length < 40
//     );
//     if (possibleName) fields.name = possibleName;
//   }

//   // 2️⃣ Email
//   if (!fields.email) {
//     const emailLine = lines.find(l => emailRegex.test(l));
//     if (emailLine) fields.email = emailLine.match(emailRegex)[0];
//   }

//   // 3️⃣ Phone Number (only numbers with ≥10 digits, ignore postal codes)
//   if (!fields.number) {
//     const phoneLine = lines.find(l => {
//       if (!phoneRegex.test(l)) return false;
//       const digits = l.replace(/[^\d+]/g, "");
//       return digits.length >= 10 && digits.length <= 13; // typical phone number length
//     });
//     if (phoneLine) {
//       fields.number = phoneLine.replace(/[^\d+]/g, "");
//     }
//   }

//   // 4️⃣ Designation
//   if (!fields.designation) {
//     const desigLine = lines.find(l => designationKeywords.test(l));
//     if (desigLine) fields.designation = desigLine;
//   }

//   // 5️⃣ Company
//   if (!fields.company) {
//     const compLine = lines.find(l => companyKeywords.test(l));
//     if (compLine) fields.company = compLine;
//   }

//   // 6️⃣ Website
//   if (!fields.site) {
//     const siteLine = lines.find(l => siteRegex.test(l));
//     if (siteLine) fields.site = siteLine.replace(/^(https?:\/\/)?(www\.)?/i, "");
//   }

//   // 7️⃣ Address = leftover lines
//   fields.address = lines.filter(l =>
//     !Object.values(fields).includes(l)
//   ).join(", ");

//   return fields;
// }

//10/09/2025

function parseOCRText(text) {
  const fields = {
    name: "",
    designation: "",
    company: "",
    number: "",
    email: "",
    site: "",
    address: "",
  };

  // Split into lines & clean
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Regex patterns
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phoneRegex = /(\+?\d{1,3}[\s-]?)?(\(?\d{2,5}\)?[\s-]?)?\d{5,}/;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.[a-z]{2,})/i;

  // Extract emails, phones, websites
  for (let line of lines) {
    if (!fields.email && emailRegex.test(line)) {
      fields.email = line.match(emailRegex)[0];
      continue;
    }
    if (!fields.number && phoneRegex.test(line)) {
      fields.number = line.match(phoneRegex)[0];
      continue;
    }
    if (!fields.site && urlRegex.test(line)) {
      fields.site = line.match(urlRegex)[0];
      continue;
    }
  }

  // Guess Name (first line without @, digits, www, etc.)
  const possibleNames = lines.filter(
    l => !/[0-9@]/.test(l) && l.split(" ").length <= 4
  );
  if (possibleNames.length) fields.name = possibleNames[0];

  // Guess Job Title (look for keywords)
  const jobKeywords = /(Manager|Director|Engineer|Consultant|CEO|CTO|Sales|Executive|Officer|Head|Specialist|Lead|Designer|Developer)/i;
  const jobLine = lines.find(l => jobKeywords.test(l));
  if (jobLine) fields.designation = jobLine;

  // Guess Company (all caps or contains business words)
  const companyKeywords = /(LTD|LLP|INC|PVT|TECH|TECHNOLOGIES|SOLUTIONS|SYSTEMS|CORP|COMPANY)/i;
  const companyLine =
    lines.find(l => companyKeywords.test(l)) ||
    lines.find(l => l === l.toUpperCase() && l.length > 2);
  if (companyLine) fields.company = companyLine;

  // Remaining lines → address
  const used = new Set([
    fields.name,
    fields.designation,
    fields.company,
    fields.number,
    fields.email,
    fields.site,
  ].filter(Boolean));

  const addressLines = lines.filter(l => ![...used].some(u => l.includes(u)));
  if (addressLines.length) fields.address = addressLines.join(", ");

  return fields;
}



// --- OCR endpoint ---
router.post("/scan", auth(), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { data: { text } } = await Tesseract.recognize(req.file.buffer, "eng");

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
    const { name, designation, company, number, email, site, address, event, type, raw } = req.body;

    // ✅ Flexible duplicate check
    const query = [];
    if (email) query.push({ email });
    if (number) query.push({ number });
    const exists = query.length ? await OCRresult.findOne({ $or: query }) : null;

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

/**
 * Fetch History
 */
// router.get("/history", auth(), async (req, res) => {
//   try {
//     const docs = await OCRresult.find({ createdBy: req.user.id })
//       .sort({ createdAt: -1 })
//       .limit(50);
//     res.json(docs);
//   } catch (err) {
//     console.error("History fetch error:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

//08/09/2025

// router.get("/history", auth(), async (req, res) => {
//   try {
//     const docs = await OCRresult.find({ createdBy: req.user.id })
//   .populate("event", "name")
//   .sort({ createdAt: 1 })  // sort only for this route
//   .limit(50);

//     res.json(docs);
//   } catch (err) {
//     console.error("History fetch error:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

//08/09/2025
router.get("/history", auth(), async (req, res) => {
  try {
    const { event, type, limit } = req.query;

    let query = { createdBy: req.user.id };
    if (event) query.event = event;
    if (type) query.type = type;

    const docs = await OCRresult.find(query)
      .populate("event", "name")
      .sort({ createdAt: 1 })  // ascending order
      .limit(Number(limit) || 50);

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
      .limit(Number(limit) || 50);

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
      return res.status(404).json({ message: "Record not found or not authorized" });
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
      return res.status(404).json({ message: "Record not found or not authorized" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
