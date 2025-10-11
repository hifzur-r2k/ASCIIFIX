const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { checkPlagiarism, getStatus, clearCache } = require('../controllers/plagiarismCheck.controller');

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, 'plagiarism-' + uniqueSuffix + fileExtension);
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = /\.(txt|doc|docx|pdf)$/i;
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.test(file.originalname)) {
        cb(null, true);
    } else {
        cb(new Error('Only TXT, DOC, DOCX, and PDF files are allowed'), false);
    }
};

// Multer configuration
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Single file only
    },
    fileFilter: fileFilter
});

// Middleware to log requests
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Plagiarism API: ${req.method} ${req.path}`);
    next();
});

// Routes
router.post('/check', upload.single('file'), checkPlagiarism);
router.get('/status', getStatus);
router.post('/clear-cache', clearCache); // For admin use

// Health check route
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: 'File size too large. Maximum size is 10MB.',
                    errorCode: 'FILE_TOO_LARGE'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: 'Too many files. Only one file allowed.',
                    errorCode: 'TOO_MANY_FILES'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: 'Unexpected file field. Use "file" field name.',
                    errorCode: 'UNEXPECTED_FIELD'
                });
            default:
                return res.status(400).json({
                    success: false,
                    error: 'File upload error: ' + error.message,
                    errorCode: 'UPLOAD_ERROR'
                });
        }
    }
    
    // Handle custom file filter errors
    if (error.message.includes('Only TXT, DOC, DOCX, and PDF')) {
        return res.status(400).json({
            success: false,
            error: 'Invalid file type. Only TXT, DOC, DOCX, and PDF files are allowed.',
            errorCode: 'INVALID_FILE_TYPE'
        });
    }
    
    // Generic error handling
    res.status(400).json({
        success: false,
        error: error.message || 'Request processing error',
        errorCode: 'PROCESSING_ERROR'
    });
});

module.exports = router;
