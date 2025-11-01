// ASCIIFIX/src/grammar_checker/utils/confidenceFilter.js

/**
 * Filter errors based on confidence score
 * Only returns errors the tool is very confident about
 * 
 * @param {array} errors - Raw errors from LanguageTool
 * @param {number} minConfidence - Minimum confidence (0-100). Default: 70
 * @returns {array} Filtered, high-confidence errors only
 */
function filterByConfidence(errors, minConfidence = 70) {
    return errors.filter(error => {
        // LanguageTool has a "rule" object with confidence scores
        const confidence = error.rule?.issueType === 'misspelling' ? 95 :
            error.rule?.confidence !== undefined ? error.rule.confidence : 80;

        return confidence >= minConfidence;
    });
}

/**
 * Add severity level to each error
 * Helps users understand: "Is this CRITICAL or just a suggestion?"
 */
function addSeverityLevels(errors) {
    return errors.map(error => {
        const issueType = error.rule?.issueType || 'unknown';

        // Assign severity: CRITICAL 🔴 / WARNING 🟡 / SUGGESTION 💡
        let severity = 'suggestion';
        let severityBadge = '💡';

        if (issueType === 'misspelling') {
            severity = 'critical';
            severityBadge = '🔴';
        } else if (issueType === 'grammar') {
            severity = 'critical';
            severityBadge = '🔴';
        } else if (issueType === 'uncorrected_words' || issueType === 'confused_words') {
            severity = 'warning';
            severityBadge = '🟡';
        }

        return {
            ...error,
            severity: severity,
            severityBadge: severityBadge
        };
    });
}

/**
 * Merge duplicate errors (same position, different source)
 * Keep the one with highest confidence
 */
function mergeDuplicateErrors(errors) {
    const errorMap = new Map();

    errors.forEach(error => {
        const key = `${error.offset}-${error.length}`;

        // If we already have this error, keep the one with better confidence
        if (errorMap.has(key)) {
            const existing = errorMap.get(key);
            const existingConfidence = existing.rule?.confidence || 75;
            const newConfidence = error.rule?.confidence || 75;

            if (newConfidence > existingConfidence) {
                errorMap.set(key, error);
            }
        } else {
            errorMap.set(key, error);
        }
    });

    return Array.from(errorMap.values());
}

module.exports = {
    filterByConfidence,
    addSeverityLevels,
    mergeDuplicateErrors
};
