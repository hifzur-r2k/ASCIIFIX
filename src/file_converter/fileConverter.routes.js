const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileConverterController = require('./fileConverter.controller');

// Debug middleware
router.use((req, res, next) => {
  console.log('🔍 Route:', req.method, req.path);
  next();
});

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

// File type definitions
const fileTypes = {
  word: { 
    extensions: ['.doc', '.docx'], 
    mimetypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] 
  },
  excel: { 
    extensions: ['.xls', '.xlsx', '.xlsm', '.csv'], 
    mimetypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'] 
  },
  image: { 
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'], 
    mimetypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'] 
  },
  text: { 
    extensions: ['.txt', '.text'], 
    mimetypes: ['text/plain'] 
  },
  pdf: {
    extensions: ['.pdf'],
    mimetypes: ['application/pdf']
  },
  powerpoint: {
    extensions: ['.ppt', '.pptx'],
    mimetypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
  }
};

// File filter
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.extensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.extensions.join(', ')}`));
    }
  };
};

// Create upload middleware
const createUpload = (type, maxSize = 50 * 1024 * 1024) => {
  return multer({
    storage: storage,
    limits: { fileSize: maxSize, files: 1 },
    fileFilter: createFileFilter(fileTypes[type])
  }).single('file');
};

// Upload handler
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large (max 50MB)' });
        }
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      next();
    });
  };
};

// Text upload handler (allows both file and manual text)
const handleTextUpload = (req, res, next) => {
  const textUpload = createUpload('text', 5 * 1024 * 1024);
  textUpload(req, res, (err) => {
    if (err && !err.message.includes('Unexpected field') && err.code !== 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// ==========================================
// TEXT CONVERSION ROUTES
// ==========================================
router.post('/text-to-pdf', handleTextUpload, fileConverterController.textToPdf);
router.post('/text-to-word', handleTextUpload, fileConverterController.textToWord);
router.post('/text-to-excel', handleTextUpload, fileConverterController.textToExcel);
router.post('/text-to-image', handleTextUpload, fileConverterController.textToImage);

// ==========================================
// WORD CONVERSION ROUTES
// ==========================================
router.post('/word-to-pdf', handleUpload(createUpload('word')), fileConverterController.wordToPdf);
router.post('/word-to-text', handleUpload(createUpload('word')), fileConverterController.wordToText);
router.post('/word-to-excel', handleUpload(createUpload('word')), fileConverterController.wordToExcel);
router.post('/word-to-image', handleUpload(createUpload('word')), fileConverterController.wordToImage);

// ==========================================
// EXCEL CONVERSION ROUTES
// ==========================================
router.post('/excel-to-pdf', handleUpload(createUpload('excel', 100 * 1024 * 1024)), fileConverterController.excelToPdf);
router.post('/excel-to-text', handleUpload(createUpload('excel', 100 * 1024 * 1024)), fileConverterController.excelToText);
router.post('/excel-to-word', handleUpload(createUpload('excel', 100 * 1024 * 1024)), fileConverterController.excelToWord);
router.post('/excel-to-image', handleUpload(createUpload('excel', 100 * 1024 * 1024)), fileConverterController.excelToImage);

// ==========================================
// IMAGE CONVERSION ROUTES
// ==========================================
router.post('/image-to-pdf', handleUpload(createUpload('image', 20 * 1024 * 1024)), fileConverterController.imageToPdf);
router.post('/image-to-text', handleUpload(createUpload('image', 20 * 1024 * 1024)), fileConverterController.imageToText);
router.post('/image-to-word', handleUpload(createUpload('image', 20 * 1024 * 1024)), fileConverterController.imageToWord);
router.post('/image-to-excel', handleUpload(createUpload('image', 20 * 1024 * 1024)), fileConverterController.imageToExcel);

// ==========================================
// PDF CONVERSION ROUTES
// ==========================================
router.post('/pdf-to-text', handleUpload(createUpload('pdf', 50 * 1024 * 1024)), fileConverterController.pdfToText);
router.post('/pdf-to-word', handleUpload(createUpload('pdf', 50 * 1024 * 1024)), fileConverterController.pdfToWord);
router.post('/pdf-to-excel', handleUpload(createUpload('pdf', 50 * 1024 * 1024)), fileConverterController.pdfToExcel);
router.post('/pdf-to-image', handleUpload(createUpload('pdf', 50 * 1024 * 1024)), fileConverterController.pdfToImage);

// ==========================================
// POWERPOINT CONVERSION ROUTES
// ==========================================
router.post('/powerpoint-to-pdf', handleUpload(createUpload('powerpoint', 100 * 1024 * 1024)), fileConverterController.powerpointToPdf);

// ==========================================
// LEGACY ROUTES (Backward Compatibility)
// ==========================================
router.post('/text', handleTextUpload, fileConverterController.textToPdf);
router.post('/word', handleUpload(createUpload('word')), fileConverterController.wordToPdf);
router.post('/excel', handleUpload(createUpload('excel', 100 * 1024 * 1024)), fileConverterController.excelToPdf);
router.post('/image', handleUpload(createUpload('image', 20 * 1024 * 1024)), fileConverterController.imageToPdf);

// ==========================================
// UTILITY ROUTES
// ==========================================
router.get('/test-api', fileConverterController.testConvertAPI);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    conversions: [
      'text-to-pdf', 'text-to-word', 'text-to-excel', 'text-to-image',
      'word-to-pdf', 'word-to-text', 'word-to-excel', 'word-to-image',
      'excel-to-pdf', 'excel-to-text', 'excel-to-word', 'excel-to-image',
      'image-to-pdf', 'image-to-text', 'image-to-word', 'image-to-excel',
      'pdf-to-text', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-image',
      'powerpoint-to-pdf'
    ]
  });
});

// ==========================================
// ERROR HANDLERS (MUST BE LAST)
// ==========================================
router.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

router.use((err, req, res, next) => {
  console.log('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal error' });
});

module.exports = router;
