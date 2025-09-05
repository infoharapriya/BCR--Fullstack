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



import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import auth from "../middleware/auth.js";
import OCRresult from "../models/OCRresult.js";
import { Readable } from "stream";
import Tesseract from "tesseract.js"; // ✅ Added import

const router = express.Router();

// ✅ Limit file size to 1MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
});

/**
 * Extract fields from OCR text
 */
// --- Helper parser ---
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

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  lines.forEach(line => {
    if (/director|manager|engineer|developer/i.test(line)) fields.designation = line;
    else if (/pvt|ltd|software|solutions|technologies|business/i.test(line)) fields.company = line;
    else if (/^\+?\d{5,}/.test(line)) {
      fields.number += (fields.number ? " / " : "") + line.replace(/;/g, " / ");
    }
    else if (/\S+@\S+\.\S+/.test(line)) fields.email = line;
    else if (/www\./i.test(line)) fields.site = line;
    else if (/road|society|garden|nagar|block|city|state|gujar|delhi|india/i.test(line)) {
      fields.address += (fields.address ? " " : "") + line;
    }
    else if (!fields.name) {
      fields.name = line; // fallback first line as name
    }
  });

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
    const { name, designation, company, phone, email, site, address, event, type, raw } = req.body;

    // ✅ Flexible duplicate check
    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });
    const exists = query.length ? await OCRresult.findOne({ $or: query }) : null;

    if (exists) {
      return res.status(400).json({ message: "Duplicate entry found" });
    }

    const card = new OCRresult({
      name,
      designation,
      company,
      phone,
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

router.get("/history", auth(), async (req, res) => {
  try {
    const docs = await OCRresult.find({ createdBy: req.user.id })
      .populate("event", "name")   // 🔹 fetch only the name field from Event model
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(docs);
  } catch (err) {
    console.error("History fetch error:", err.message);
    res.status(500).json({ message: "Server error" });
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
