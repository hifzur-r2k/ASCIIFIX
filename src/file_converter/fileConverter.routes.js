// src/file_converter/fileConverter.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileConverterController = require('./fileConverter.controller');

// Unified upload directory for this tool (one place)
const UPLOAD_DIR = "C:\\Users\\acerf\\OneDrive\\Desktop\\ASCIIFIX\\uploads";

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Use safe filename: timestamp + sanitized original name
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

// Allowed types map: route key -> { extRegex, mimeRegex }
const allowedMap = {
  '/image': {
    ext: /\.(jpe?g|png|gif|bmp|webp)$/i,
    mime: /^image\//,
  },
  '/text': {
    ext: /\.(txt|csv|md)$/i,
    mime: /(text\/|application\/csv)/,
  },
  '/word': {
    ext: /\.(docx?|odt)$/i,
    mime: /(wordprocessingml|msword|officedocument.wordprocessingml)/i,
  },
  '/excel': {
    ext: /\.(xlsx?|xls|ods)$/i,
    mime: /(spreadsheetml|ms-excel|officedocument.spreadsheetml)/i,
  },
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max (adjust)
  fileFilter: (req, file, cb) => {
    const route = req.path.toLowerCase();
    const allowed = Object.entries(allowedMap).find(([key]) => route.startsWith(key));
    if (!allowed) return cb(new Error('No validation rules for this route'));

    const { ext, mime } = allowed[1];
    const nameOk = ext.test(file.originalname);
    const mimeOk = !!file.mimetype && mime.test(file.mimetype);

    if (nameOk && mimeOk) return cb(null, true);

    return cb(new Error('Invalid file type for this route.'));
  },
}).single('file');

// Routes
router.post('/image', upload, fileConverterController.imageToPdf);
router.post('/text', upload, fileConverterController.textToPdf);
router.post('/word', upload, fileConverterController.wordToPdf);
router.post('/excel', upload, fileConverterController.excelToPdf);

module.exports = router;
