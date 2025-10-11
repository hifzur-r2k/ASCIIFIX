require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const fileConverterRoutes = require('./src/file_converter/fileConverter.routes');
const plagiarismRoutes = require('./src/plagiarism_check/routes/plagiarismCheck.routes');
const aiDetectorRoutes = require('./src/plagiarism_check/routes/aiDetector.routes');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve homepage (adjust in case your homepage is elsewhere)
app.use('/', express.static(path.join(__dirname, 'public')));

// Serve static frontend per tool (example)
app.use('/file_converter', express.static(path.join(__dirname, 'public/file_converter')));
app.use('/image_converter', express.static(path.join(__dirname, 'public/image_converter')));
app.use('/plagiarism_check', express.static(path.join(__dirname, 'public/plagiarism_check')));

// Mount File Converter API routes
app.use('/convert', fileConverterRoutes);

// Mount Image Converter API routes
const imageConverterRoutes = require('./src/image_converter/fileConverter.routes');
app.use('/image-convert', imageConverterRoutes);

// Mount Plagiarism Checker API routes
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/ai-detector', aiDetectorRoutes);

// Create necessary directories
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const LOGS_DIR = path.join(__dirname, 'logs');
const CACHE_DIR = path.join(__dirname, 'cache');
const AI_CACHE_DIR = path.join(__dirname, 'cache/ai-detection');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true }); 
if (!fs.existsSync(AI_CACHE_DIR)) fs.mkdirSync(AI_CACHE_DIR, { recursive: true }); 
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
    console.log(`🤖 AI Detection API available at: http://localhost:${PORT}/api/ai-detector`);
});
