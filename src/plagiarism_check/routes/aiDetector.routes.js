const express = require('express');
const router = express.Router();
const aiDetectorController = require('../controllers/aiDetector.controller');

// Main AI detection endpoint
router.post('/detect', aiDetectorController.detectAIContent);

// Health check endpoint
router.get('/health', aiDetectorController.healthCheck);

// Statistics endpoint
router.get('/stats', aiDetectorController.getStats);

// Batch detection endpoint
router.post('/batch', aiDetectorController.batchDetect);

module.exports = router;