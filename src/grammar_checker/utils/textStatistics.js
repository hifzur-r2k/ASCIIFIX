// ASCIIFIX/src/grammar_checker/utils/textStatistics.js
// Calculates writing statistics (word count, readability, etc.)

const syllableModule = require('syllable');
const fleschModule = require('flesch');
const fleschKincaidModule = require('flesch-kincaid');

// Handle both CommonJS and ES module exports
const syllable = syllableModule.default || syllableModule;
const flesch = fleschModule.default || fleschModule;
const fleschKincaid = fleschKincaidModule.default || fleschKincaidModule;


/**
 * Calculate comprehensive text statistics
 * @param {string} text - The text to analyze
 * @returns {object} Statistics object with all metrics
 */
function calculateStatistics(text) {
    if (!text || text.trim().length === 0) {
        return getEmptyStats();
    }

    const cleanText = text.trim();
    
    // Basic counts
    const words = getWords(cleanText);
    const sentences = getSentences(cleanText);
    const paragraphs = getParagraphs(cleanText);
    const characters = cleanText.length;
    const charactersNoSpaces = cleanText.replace(/\s/g, '').length;
    
    // Word analysis
    const uniqueWords = getUniqueWords(words);
    const difficultWords = getDifficultWords(words);
    const commonWords = getMostCommonWords(words, 5);
    
    // Sentence analysis
    const avgWordsPerSentence = words.length / sentences.length || 0;
    const avgSyllablesPerWord = getAverageSyllables(words);
    
    // Readability scores
    const readabilityScore = flesch(cleanText) || 0;
    const gradeLevel = fleschKincaid(cleanText) || 0;
    
    // Advanced metrics
    const passiveVoiceCount = countPassiveVoice(cleanText);
    const adverbCount = countAdverbs(words);
    
    // Reading time (average adult reads 200-250 words per minute)
    const readingTimeMinutes = Math.ceil(words.length / 225);
    
    // Determine writing complexity
    const complexity = determineComplexity(readabilityScore);
    
    return {
        // Basic counts
        wordCount: words.length,
        characterCount: characters,
        characterCountNoSpaces: charactersNoSpaces,
        sentenceCount: sentences.length,
        paragraphCount: paragraphs.length,
        
        // Averages
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
        
        // Readability
        readabilityScore: Math.round(readabilityScore),
        gradeLevel: Math.round(gradeLevel * 10) / 10,
        readingTime: readingTimeMinutes,
        
        // Word quality
        uniqueWordCount: uniqueWords.size,
        vocabularyRichness: Math.round((uniqueWords.size / words.length) * 100),
        difficultWordCount: difficultWords.length,
        difficultWordPercentage: Math.round((difficultWords.length / words.length) * 100),
        
        // Style metrics
        passiveVoiceCount: passiveVoiceCount,
        adverbCount: adverbCount,
        adverbPercentage: Math.round((adverbCount / words.length) * 100),
        
        // Top words
        mostCommonWords: commonWords,
        
        // Overall assessment
        writingComplexity: complexity,
        readabilityLevel: getReadabilityLevel(readabilityScore)
    };
}

// Helper functions
function getWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0);
}

function getSentences(text) {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function getParagraphs(text) {
    return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

function getUniqueWords(words) {
    return new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
}

function getDifficultWords(words) {
    return words.filter(word => syllable(word) >= 3);
}

function getAverageSyllables(words) {
    if (words.length === 0) return 0;
    const totalSyllables = words.reduce((sum, word) => sum + syllable(word), 0);
    return totalSyllables / words.length;
}

function getMostCommonWords(words, limit) {
    const frequency = {};
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'it', 'this', 'that', 'these', 'those']);
    
    words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleanWord.length > 2 && !commonWords.has(cleanWord)) {
            frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
        }
    });
    
    return Object.entries(frequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([word, count]) => ({ word, count }));
}

function countPassiveVoice(text) {
    const passivePatterns = [
        /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
        /\b(is|are|was|were|been|being)\s+\w+en\b/gi
    ];
    
    let count = 0;
    passivePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) count += matches.length;
    });
    
    return count;
}

function countAdverbs(words) {
    return words.filter(word => word.toLowerCase().endsWith('ly')).length;
}

function determineComplexity(readabilityScore) {
    if (readabilityScore >= 80) return 'Simple';
    if (readabilityScore >= 60) return 'Moderate';
    if (readabilityScore >= 40) return 'Complex';
    return 'Very Complex';
}

function getReadabilityLevel(score) {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (score >= 30) return 'Difficult (College)';
    return 'Very Difficult (College graduate)';
}

function getEmptyStats() {
    return {
        wordCount: 0,
        characterCount: 0,
        characterCountNoSpaces: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        avgWordsPerSentence: 0,
        avgSyllablesPerWord: 0,
        readabilityScore: 0,
        gradeLevel: 0,
        readingTime: 0,
        uniqueWordCount: 0,
        vocabularyRichness: 0,
        difficultWordCount: 0,
        difficultWordPercentage: 0,
        passiveVoiceCount: 0,
        adverbCount: 0,
        adverbPercentage: 0,
        mostCommonWords: [],
        writingComplexity: 'N/A',
        readabilityLevel: 'N/A'
    };
}

module.exports = {
    calculateStatistics
};
