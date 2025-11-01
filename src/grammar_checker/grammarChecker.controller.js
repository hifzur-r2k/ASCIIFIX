// ASCIIFIX/src/grammar_checker/grammarChecker.controller.js

const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
// const { calculateStatistics } = require('./utils/textStatistics');
const { checkHomophones } = require('./utils/homophoneChecker');
const { applyCustomRules } = require('./utils/customRules');
const { filterByConfidence, addSeverityLevels, mergeDuplicateErrors } = require('./utils/confidenceFilter');
const { groupErrorsByCategory, createErrorSummary, enhanceErrorForDisplay, sortErrorsByImportance } = require('./utils/errorClassifier');


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /txt|doc|docx|pdf|ppt|pptx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only TXT, DOC, DOCX, PDF, PPT, PPTX files are allowed'));
        }
    }
}).single('file');

// LanguageTool API endpoint (free public server)
const LANGUAGETOOL_API = 'https://api.languagetool.org/v2/check';

// ✅ ADD THIS - Simple cache
const resultCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Check grammar using LanguageTool API with cache busting
 */
const checkGrammar = async (req, res) => {
    try {
        console.log('✅ Grammar check request received');
        console.log('Request body:', req.body);

        const { text, language = 'en-US' } = req.body;

        // Validate input
        if (!text || text.trim().length === 0) {
            console.log('❌ No text provided');
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }

        console.log(`📝 Checking text (${text.length} chars) in ${language}`);

        const cacheKey = `${text.substring(0, 100)}-${language}`;
        if (resultCache.has(cacheKey)) {
            const cached = resultCache.get(cacheKey);
            console.log('💾 Returning cached result');
            return res.status(200).json(cached);
        }

        // Check text length
        if (text.length > 20000) {
            console.log('❌ Text too long');
            return res.status(400).json({
                success: false,
                error: 'Text exceeds 20,000 character limit. Please check smaller portions.'
            });
        }

        console.log('🌐 Calling LanguageTool API...');

        // Add cache busting to avoid rate limits
        const timestamp = Date.now();

        // Call LanguageTool API with additional parameters
        const response = await axios.post(LANGUAGETOOL_API, null, {
            params: {
                text: text,
                language: language,
                enabledOnly: false,
                level: 'picky',
                enabledCategories: 'GRAMMAR,TYPOS,STYLE,CONFUSED_WORDS',
                _t: timestamp  // Cache buster
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'ASCIIFIX-Grammar-Checker/1.0'
            },
            timeout: 30000
        });

        console.log('✅ LanguageTool API responded successfully');
        console.log('Found errors:', response.data.matches.length);

        // ✅ ADD: Apply custom rules
        const customErrors = applyCustomRules(text);
        console.log('🔧 Custom rules found:', customErrors.length, 'additional errors');

        // ✅ ADD: Check homophones
        const homophoneErrors = checkHomophones(text);
        console.log('📝 Homophone check found:', homophoneErrors.length, 'potential issues');

        // ✅ ADD: Combine all errors
        // ✅ IMPROVED: Combine all errors from all sources
        let allMatches = [
            ...response.data.matches,      // From LanguageTool API
            ...customErrors,               // From custom rules
            ...homophoneErrors             // From homophone checker
        ];

        console.log('🔗 Combined errors:', allMatches.length);

        // ✅ IMPROVED: Filter by confidence (remove uncertain errors)
        allMatches = filterByConfidence(allMatches, 70);
        console.log('✨ After confidence filter:', allMatches.length, 'errors');

        // ✅ IMPROVED: Merge duplicate errors (same position)
        allMatches = mergeDuplicateErrors(allMatches);
        console.log('🔀 After merging duplicates:', allMatches.length, 'unique errors');

        // ✅ IMPROVED: Add severity levels (Critical/Warning/Suggestion)
        allMatches = addSeverityLevels(allMatches);
        console.log('🎯 Severity levels added');

        const uniqueMatches = allMatches;


        // ✅ ADD: Calculate text statistics
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const statistics = {
            wordCount: words.length,
            sentenceCount: sentences.length,
            characterCount: text.length,
            readingTime: Math.ceil(words.length / 225)
        };
        console.log('📈 Basic statistics calculated:', statistics.wordCount, 'words');


        // ✅ NEW: Enhanced result object
        // ✅ ENHANCED: Classify and organize errors
        const groupedErrors = groupErrorsByCategory(uniqueMatches);
        const errorSummary = createErrorSummary(groupedErrors);

        // ✅ ENHANCED: Enhance each error for frontend display
        const enhancedErrors = uniqueMatches.map(error => enhanceErrorForDisplay(error));

        // ✅ ENHANCED: Sort by importance (critical first)
        const sortedErrors = sortErrorsByImportance(enhancedErrors);

        // ✅ NEW: Enhanced result object with categories
        const result = {
            success: true,
            matches: sortedErrors,
            groupedByCategory: groupedErrors,
            summary: errorSummary,
            language: response.data.language || {},
            software: response.data.software || {},
            statistics: statistics,
            errorCounts: {
                total: sortedErrors.length,
                critical: errorSummary.bySeverity.critical.length,
                warning: errorSummary.bySeverity.warning.length,
                suggestion: errorSummary.bySeverity.suggestion.length,
                languageTool: response.data.matches.length,
                customRules: customErrors.length,
                homophones: homophoneErrors.length,
                byType: Object.fromEntries(
                    Object.entries(groupedErrors).map(([type, errors]) => [type, errors.length])
                )
            }
        };

        // Cache the enhanced result
        resultCache.set(cacheKey, result);
        setTimeout(() => resultCache.delete(cacheKey), CACHE_DURATION);
        console.log('💾 Enhanced result cached');

        // Return enhanced result
        return res.status(200).json(result);


    } catch (error) {
        console.error('❌ Grammar check error:', error.message);
        console.error('Error details:', error.response?.data || error);

        // Handle rate limiting specifically
        if (error.response && error.response.status === 429) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit reached. Please wait a moment and try again.',
                rateLimited: true
            });
        }

        // Handle specific errors
        if (error.response) {
            console.error('API Status:', error.response.status);
            return res.status(error.response.status).json({
                success: false,
                error: 'Grammar checking service error. Please try again.'
            });
        }

        if (error.code === 'ECONNABORTED') {
            console.error('⏰ Request timeout');
            return res.status(408).json({
                success: false,
                error: 'Request timeout. Please try again with shorter text.'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to check grammar. Please try again.'
        });
    }
};


/**
 * Extract text from uploaded file
 */
const extractText = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        try {
            const filePath = req.file.path;
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            let extractedText = '';

            console.log('📄 Extracting text from:', filePath, 'Type:', fileExtension);

            // Extract text based on file type
            switch (fileExtension) {
                case '.txt':
                    extractedText = await extractFromTxt(filePath);
                    break;

                case '.docx':
                    extractedText = await extractFromDocx(filePath);
                    break;

                case '.pdf':
                    extractedText = await extractFromPdf(filePath);
                    break;

                case '.doc':
                case '.ppt':
                case '.pptx':
                    throw new Error('DOC, PPT, PPTX formats coming soon. Please use DOCX or PDF for now.');
                    break;


                default:
                    throw new Error('Unsupported file type. Please use TXT, DOCX, or PDF files.');
            }

            // Clean up uploaded file
            await fs.unlink(filePath);

            // Validate extracted text
            if (!extractedText || extractedText.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No text found in the uploaded file'
                });
            }

            console.log('✅ Text extracted:', extractedText.length, 'characters');

            return res.status(200).json({
                success: true,
                text: extractedText.trim()
            });

        } catch (error) {
            console.error('Text extraction error:', error.message);

            // Clean up file on error
            if (req.file && req.file.path) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Failed to delete file:', unlinkError);
                }
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to extract text from file. ' + error.message
            });
        }
    });
};

/**
 * Extract text from TXT file
 */
const extractFromTxt = async (filePath) => {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('utf-8');
};

/**
 * Extract text from DOCX file
 */
const extractFromDocx = async (filePath) => {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
};

/**
 * Extract text from PDF file
 */
const extractFromPdf = async (filePath) => {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
};

/**
 * Extract text from DOC/PPT/PPTX files
 */
// const extractWithTextract = (filePath) => {
//     return new Promise((resolve, reject) => {
//         textract.fromFileWithPath(filePath, (error, text) => {
//             if (error) {
//                 reject(error);
//             } else {
//                 resolve(text);
//             }
//         });
//     });
// };

/**
 * Get supported languages
 */
const getSupportedLanguages = async (req, res) => {
    try {
        const response = await axios.get('https://api.languagetool.org/v2/languages');

        return res.status(200).json({
            success: true,
            languages: response.data
        });
    } catch (error) {
        console.error('Failed to fetch languages:', error.message);

        // Return default languages if API fails
        return res.status(200).json({
            success: true,
            languages: [
                { name: 'English (US)', code: 'en-US' },
                { name: 'English (UK)', code: 'en-GB' },
                { name: 'English (Canada)', code: 'en-CA' },
                { name: 'English (Australia)', code: 'en-AU' }
            ]
        });
    }
};
/**
 * Remove duplicate errors based on offset position
 */
function removeDuplicateErrors(errors) {
    const seen = new Set();
    return errors.filter(error => {
        const key = `${error.offset}-${error.length}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

module.exports = {
    checkGrammar,
    extractText,
    getSupportedLanguages
};

