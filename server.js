require('dotenv').config();

const express = require('express');
const app = express();
app.set('trust proxy', true);

const path = require('path');
const fs = require('fs');

// Import routes
const fileConverterRoutes = require('./src/file_converter/fileConverter.routes');
const plagiarismRoutes = require('./src/plagiarism_check/routes/plagiarismCheck.routes');
const aiDetectorRoutes = require('./src/plagiarism_check/routes/aiDetector.routes');
const imageConverterRoutes = require('./src/image_converter/fileConverter.routes');
const grammarCheckerRoutes = require('./src/grammar_checker/grammarChecker.routes'); // ✅ ADD THIS

// ✅ Render dynamically assigns a port
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ ADD THIS

// Serve static frontend if exists
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/file_converter', express.static(path.join(__dirname, 'public/file_converter')));
app.use('/image_converter', express.static(path.join(__dirname, 'public/image_converter')));
app.use('/plagiarism_check', express.static(path.join(__dirname, 'public/plagiarism_check')));
app.use('/grammar_checker', express.static(path.join(__dirname, 'public/grammar_checker'))); // ✅ ADD THIS

// Mount APIs
app.use('/convert', fileConverterRoutes);
app.use('/image-convert', imageConverterRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/ai-detector', aiDetectorRoutes);
app.use('/api/grammar', grammarCheckerRoutes); // ✅ ADD THIS

// Create required directories safely
const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'logs'),
    path.join(__dirname, 'cache'),
    path.join(__dirname, 'cache/ai-detection'),
];

dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ✅ Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ASCIIFIX server live on port ${PORT}`);
    console.log(`🤖 AI Detection API available at: /api/ai-detector`);
    console.log(`✍️ Grammar Checker API available at: /api/grammar`); // ✅ ADD THIS
});
