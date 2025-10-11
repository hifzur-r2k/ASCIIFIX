const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileConverterController = require('./fileConverter.controller');

// Enhanced debug logging middleware
router.use((req, res, next) => {
  console.log('🔍 Image Converter Route hit:', req.method, req.path);
  console.log('🔍 Content-Type:', req.headers['content-type']);
  next();
});

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Enhanced multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and add timestamp
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

// Image file validation
const imageFileFilter = (req, file, cb) => {
  console.log('🔍 Image file filter triggered for:', file.originalname);
  console.log('🔍 File mimetype:', file.mimetype);

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.heic'];
  const allowedMimetypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp', 'image/heic'];


  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension) &&
    allowedMimetypes.some(mime => file.mimetype.includes(mime))) {
    console.log('✅ Image file type validation passed');
    cb(null, true);
  } else {
    console.log('❌ Image file type validation failed');
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

// Single image upload configuration
const singleImageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 1
  },
  fileFilter: imageFileFilter
}).single('file');

// Enhanced upload handler with better error handling
const handleImageUpload = (req, res, next) => {
  console.log('📁 Image upload route hit');

  singleImageUpload(req, res, (err) => {
    if (err) {
      console.log('❌ Upload error:', err.message);

      // Enhanced error responses
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File too large',
            maxSize: '20MB',
            details: 'Please choose a smaller image file'
          });
        }
      }

      return res.status(400).json({
        error: err.message,
        details: 'Please check your image file type and size'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        details: 'Please select an image file to convert'
      });
    }

    console.log('📁 Image file after upload:', req.file);
    next();
  });
};

// MAIN CONVERSION ROUTE
router.post('/convert',
  handleImageUpload,
  fileConverterController.imageToImage
);

// TEST ROUTE
router.get('/test-api', fileConverterController.testConvertAPI);

// HEALTH CHECK ROUTE
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Image Converter',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'heic']
  });
});

// 404 handler for unmatched routes
router.use((req, res) => {
  console.log('❌ Image converter route not found:', req.method, req.path);
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      'POST /convert',
      'GET /test-api',
      'GET /health'
    ]
  });
});

// Global error handler for this router
router.use((err, req, res, next) => {
  console.log('❌ Image converter router error:', err.message);

  // Multer-specific errors
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message,
      code: err.code
    });
  }

  // Generic errors
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = router;
