const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileConverterController = require('./fileConverter.controller');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.heic'];
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp', 'image/heic'];

const imageFileFilter = (req, file, cb) => {
  console.log('🔍 Image file filter triggered for:', file.originalname);
  console.log('🔍 File mimetype:', file.mimetype);

  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext) && allowedMimeTypes.some(type => file.mimetype.includes(type))) {
    console.log('✅ Image file type validation passed');
    cb(null, true);
  } else {
    console.log('❌ Image file type validation failed');
    cb(new Error(`Invalid image file type. Allowed types: ${allowedExtensions.join(', ')}`));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
  fileFilter: imageFileFilter,
}).single('file');

const handleUpload = (req, res, next) => {
  console.log('📁 Image upload route hit');
  
  upload(req, res, function (err) {
    if (err) {
      console.log('❌ Upload error:', err.message);
      
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File too large. Maximum allowed size is 20MB.' 
        });
      }
      
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file uploaded.' 
      });
    }
    
    console.log('📁 Image file after upload:', req.file);
    next();
  });
};

router.use((req, res, next) => {
  console.log('🔍 Image Converter Route hit:', req.method, req.path);
  console.log('🔍 Content-Type:', req.headers['content-type']);
  next();
});

router.post('/convert', handleUpload, fileConverterController.imageToImage);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Image Converter',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    supportedFormats: ['jpeg', 'jpg', 'png', 'bmp', 'tiff', 'webp', 'heic'],
  });
});

router.use((req, res) => {
  console.log('❌ Image converter route not found:', req.method, req.path);
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: ['/convert', '/health']
  });
});

router.use((err, req, res, next) => {
  console.error('❌ Image converter router error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

module.exports = router;
