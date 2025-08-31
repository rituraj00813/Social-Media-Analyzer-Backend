const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const cors = require("cors");
const fs = require("fs");

require("dotenv").config();

const Document = require("./models/Document");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("➡️ Received file:", req.file);

  try {
    const file = req.file;
    let text = "";

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (file.mimetype === "application/pdf") {
      console.log("📄 Parsing PDF...");
      const buffer = fs.readFileSync(file.path);
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (file.mimetype.startsWith("image/")) {
      console.log("🖼 Running OCR...");
      const result = await Tesseract.recognize(file.path, "eng");
      text = result.data.text;
    } else {
      return res.status(400).json({ error: "Only PDF or image allowed" });
    }

    console.log("💾 Saving to Mongo...");
    const doc = await Document.create({
      filename: file.originalname,
      textContent: text,
    });

    console.log("✅ Saved:", doc._id);

    res.json({
      message: "✅ File uploaded & text extracted",
      docId: doc._id,
      text,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
});

app.get("/document/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log(
    `🚀 Server running on http://localhost:${process.env.PORT || 5000}`
  )
);
