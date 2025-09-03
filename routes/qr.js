import express from "express";
import multer from "multer";
import fs from "fs";
import Jimp from "jimp";
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from "@zxing/library";
import auth from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/qr-upload", auth(), upload.single("qrImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file "qrImage"' });
  }

  try {
    const image = await Jimp.read(req.file.path);
    const { data, width, height } = image.bitmap;

    const lum = new Uint8ClampedArray(width * height);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      lum[j] = (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    const source = new RGBLuminanceSource(lum, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);

    const reader = new MultiFormatReader();
    const result = reader.decode(bitmap, hints);

    fs.unlinkSync(req.file.path);
    res.json({ decodedText: result.getText() });
  } catch (e) {
    console.error("QR decode error:", e.message);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Failed to decode QR" });
  }
});

export default router;
