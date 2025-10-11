const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileConverterController = require('./fileConverter.controller');

// Enhanced debug logging middleware
router.use((req, res, next) => {
  console.log('🔍 Route hit:', req.method, req.path);
  console.log('🔍 Content-Type:', req.headers['content-type']);
  console.log('🔍 User-Agent:', req.headers['user-agent']);
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

// Enhanced file validation function
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    console.log('🔍 File filter triggered for:', file.originalname);
    console.log('🔍 File mimetype:', file.mimetype);
    console.log('🔍 Request path:', req.path);

    // File type validation based on route
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.extensions.includes(fileExtension) && 
        allowedTypes.mimetypes.some(mime => file.mimetype.includes(mime))) {
      console.log('✅ File type validation passed');
      cb(null, true);
    } else {
      console.log('❌ File type validation failed');
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.extensions.join(', ')}`));
    }
  };
};

// File type definitions for each converter
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
  }
};

// Single file upload configurations
const createSingleUpload = (type, maxSize = 50 * 1024 * 1024) => {
  return multer({
    storage: storage,
    limits: { 
      fileSize: maxSize,
      files: 1
    },
    fileFilter: createFileFilter(fileTypes[type])
  }).single('file');
};

// Settings extraction middleware
const extractSettings = (req, res, next) => {
  req.conversionSettings = {
    pageSize: req.body.pageSize || 'A4',
    orientation: req.body.orientation || 'portrait',
    quality: req.body.quality || 'high',
    password: req.body.password || null,
    margin: req.body.margin || 'normal',
    compression: req.body.compression || 'auto'
  };
  
  console.log('⚙️ Conversion settings:', req.conversionSettings);
  next();
};

// Enhanced upload handler with better error handling
const handleUpload = (uploadMiddleware, routeName) => {
  return (req, res, next) => {
    console.log(`📁 ${routeName} route hit`);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.log('❌ Upload error:', err.message);
        
        // Enhanced error responses
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'File too large',
              maxSize: '50MB',
              details: 'Please choose a smaller file'
            });
          }
        }
        
        return res.status(400).json({
          error: err.message,
          details: 'Please check your file type and size'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          details: 'Please select a file to convert'
        });
      }
      
      console.log('📁 File after upload:', req.file);
      next();
    });
  };
};

// INDIVIDUAL CONVERSION ROUTES (Using your existing controller functions)

// Word to PDF route - Enhanced
router.post('/word', 
  handleUpload(createSingleUpload('word'), 'Word'),
  extractSettings,
  fileConverterController.wordToPdf
);

// Excel to PDF route - Enhanced  
router.post('/excel',
  handleUpload(createSingleUpload('excel', 100 * 1024 * 1024), 'Excel'), // 100MB for large spreadsheets
  extractSettings,
  fileConverterController.excelToPdf
);

// Image to PDF route - Enhanced
router.post('/image',
  handleUpload(createSingleUpload('image', 20 * 1024 * 1024), 'Image'), // 20MB for high-res images
  extractSettings,
  fileConverterController.imageToPdf
);

// Text to PDF route - Enhanced (Fixed for manual text input)
router.post('/text',
  // Custom middleware that handles BOTH file upload AND manual text
  (req, res, next) => {
    console.log('📁 Text route hit');
    console.log('📁 Content-Type:', req.headers['content-type']);
    console.log('📁 Checking for text input...');
    
    // Create multer instance for optional file upload
    const textUpload = createSingleUpload('text', 5 * 1024 * 1024);
    
    textUpload(req, res, (err) => {
      console.log('📁 Multer callback executed');
      console.log('📁 Multer error:', err ? err.message : 'none');
      console.log('📁 Has file after multer:', !!req.file);
      console.log('📁 Body keys after multer:', Object.keys(req.body));
      
      // If there's a serious multer error (not just "no file"), handle it
      if (err && !err.message.includes('Unexpected field') && err.code !== 'LIMIT_UNEXPECTED_FILE') {
        console.log('❌ Serious upload error:', err.message);
        return res.status(400).json({
          error: err.message,
          details: 'Please check your file type and size'
        });
      }
      
      // Continue regardless of whether file upload succeeded or failed
      // The controller will handle both file and text scenarios
      console.log('📁 Proceeding to controller...');
      next();
    });
  },
  extractSettings,
  fileConverterController.textToPdf
);

// UTILITY ROUTES (Using your existing controller functions)

// Test route
router.get('/test-api', fileConverterController.testConvertAPI);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      convertAPI: 'active',
      fileUpload: 'active',
      storage: 'active'
    }
  });
});

// ENHANCED ERROR HANDLING MIDDLEWARE

// 404 handler for unmatched routes
router.use((req, res) => {
  console.log('❌ Route not found:', req.method, req.path);
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      'POST /word',
      'POST /excel', 
      'POST /image',
      'POST /text',
      'GET /test-api',
      'GET /health'
    ]
  });
});

// Global error handler for this router
router.use((err, req, res, next) => {
  console.log('❌ Router error:', err.message);
  
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
