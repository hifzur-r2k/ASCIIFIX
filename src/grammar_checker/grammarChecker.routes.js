// ASCIIFIX/src/grammar_checker/grammarChecker.routes.js

const express = require('express');
const router = express.Router();
const grammarController = require('./grammarChecker.controller');

/**
 * @route   POST /api/check-grammar
 * @desc    Check grammar and spelling of text
 * @access  Public
 */
router.post('/check-grammar', grammarController.checkGrammar);

/**
 * @route   POST /api/extract-text
 * @desc    Extract text from uploaded file
 * @access  Public
 */
router.post('/extract-text', grammarController.extractText);

/**
 * @route   GET /api/languages
 * @desc    Get supported languages
 * @access  Public
 */
router.get('/languages', grammarController.getSupportedLanguages);

module.exports = router;
