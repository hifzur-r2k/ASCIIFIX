// ASCIIFIX/src/grammar_checker/utils/errorClassifier.js

/**
 * Classify errors into categories (Grammar, Spelling, Punctuation, etc.)
 * This helps organize errors by type for better UI display
 */

/**
 * Categorize a single error
 * @param {object} error - Error object from LanguageTool or custom rules
 * @returns {string} Category name
 */
function classifyErrorType(error) {
  const ruleId = error.ruleId || '';
  const category = error.category?.id || '';
  const issueType = error.rule?.issueType || '';
  const message = (error.message || '').toLowerCase();

  // SPELLING & TYPOS
  if (issueType === 'misspelling' || 
      category === 'SPELLING' || 
      ruleId.includes('SPELL') ||
      message.includes('spelling') ||
      message.includes('typo')) {
    return 'Spelling';
  }

  // GRAMMAR
  if (category === 'GRAMMAR' || 
      ruleId.includes('GRAMMAR') ||
      ruleId.includes('SUBJECT_VERB') ||
      ruleId.includes('ARTICLE') ||
      ruleId.includes('TENSE') ||
      ruleId.includes('AGREEMENT') ||
      message.includes('grammar') ||
      message.includes('agreement')) {
    return 'Grammar';
  }

  // PUNCTUATION
  if (category === 'PUNCTUATION' || 
      ruleId.includes('PUNCT') ||
      ruleId.includes('COMMA') ||
      ruleId.includes('PERIOD') ||
      ruleId.includes('APOSTROPHE') ||
      ruleId.includes('QUOTE') ||
      message.includes('punctuation') ||
      message.includes('comma') ||
      message.includes('period') ||
      message.includes('quote')) {
    return 'Punctuation';
  }

  // STYLE (Wordiness, passive voice, etc.)
  if (category === 'STYLE' ||
      ruleId.includes('STYLE') ||
      ruleId.includes('PASSIVE') ||
      ruleId.includes('WORDINESS') ||
      ruleId.includes('RUN_ON') ||
      message.includes('style') ||
      message.includes('passive') ||
      message.includes('wordiness')) {
    return 'Style';
  }

  // CLARITY
  if (ruleId.includes('CLARITY') ||
      ruleId.includes('REPEATED') ||
      message.includes('clarity') ||
      message.includes('repeated')) {
    return 'Clarity';
  }

  // CONFUSABLE WORDS (homophones, confused words)
  if (issueType === 'confused_words' ||
      ruleId.includes('HOMOPHONE') ||
      ruleId.includes('CONFUSED') ||
      message.includes('confused') ||
      message.includes('homophone')) {
    return 'Confused Words';
  }

  // DEFAULT
  return 'Other';
}

/**
 * Assign severity level based on error type
 * @param {object} error - Error object
 * @returns {string} Severity: 'critical', 'warning', or 'suggestion'
 */
function assignSeverity(error) {
  // If already has severity, keep it
  if (error.severity) {
    return error.severity;
  }

  const errorType = classifyErrorType(error);
  const issueType = error.rule?.issueType || '';

  // CRITICAL: Must fix these
  if (errorType === 'Spelling' || 
      errorType === 'Grammar' ||
      issueType === 'misspelling' ||
      errorType === 'Confused Words') {
    return 'critical';
  }

  // WARNING: Should fix these
  if (errorType === 'Punctuation' || 
      errorType === 'Grammar' ||
      error.message.includes('subject-verb')) {
    return 'warning';
  }

  // SUGGESTION: Nice to fix
  return 'suggestion';
}

/**
 * Organize errors into grouped structure
 * @param {array} errors - Array of error objects
 * @returns {object} Grouped errors with statistics
 */
function groupErrorsByCategory(errors) {
  const grouped = {
    Spelling: [],
    Grammar: [],
    Punctuation: [],
    Style: [],
    Clarity: [],
    'Confused Words': [],
    Other: []
  };

  // Classify each error
  errors.forEach(error => {
    const category = classifyErrorType(error);
    const severity = assignSeverity(error);
    
    error.category = category;
    error.severity = severity;
    
    grouped[category].push(error);
  });

  return grouped;
}

/**
 * Create summary statistics for display
 * @param {object} groupedErrors - Output from groupErrorsByCategory
 * @returns {object} Summary with counts and severity breakdown
 */
function createErrorSummary(groupedErrors) {
  const summary = {
    byType: {},
    bySeverity: {
      critical: [],
      warning: [],
      suggestion: []
    },
    total: 0,
    topIssue: null
  };

  let maxCount = 0;
  let topCategory = null;

  Object.entries(groupedErrors).forEach(([type, errors]) => {
    if (errors.length > 0) {
      summary.byType[type] = {
        count: errors.length,
        errors: errors
      };

      // Track top issue type
      if (errors.length > maxCount) {
        maxCount = errors.length;
        topCategory = type;
      }

      // Organize by severity
      errors.forEach(error => {
        const severity = error.severity || 'suggestion';
        summary.bySeverity[severity].push(error);
      });

      summary.total += errors.length;
    }
  });

  summary.topIssue = topCategory;
  
  return summary;
}

/**
 * Create display-friendly error message with severity badge
 * @param {object} error - Error object
 * @returns {object} Error with display properties
 */
function enhanceErrorForDisplay(error) {
  const severity = error.severity || 'suggestion';
  
  // Badge emoji and color
  const severityInfo = {
    critical: { badge: '🔴', label: 'Critical', color: '#dc3545' },
    warning: { badge: '🟡', label: 'Warning', color: '#ffc107' },
    suggestion: { badge: '💡', label: 'Suggestion', color: '#17a2b8' }
  };

  const info = severityInfo[severity] || severityInfo.suggestion;

  return {
    ...error,
    severityBadge: info.badge,
    severityLabel: info.label,
    severityColor: info.color,
    displayMessage: `${info.badge} ${error.message}`
  };
}

/**
 * Sort errors by importance (severity first, then by position in text)
 * @param {array} errors - Array of errors
 * @returns {array} Sorted errors
 */
function sortErrorsByImportance(errors) {
  const severityOrder = { critical: 0, warning: 1, suggestion: 2 };

  return errors.sort((a, b) => {
    // First sort by severity
    const severityDiff = (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
    if (severityDiff !== 0) return severityDiff;

    // Then by position in text (offset)
    return a.offset - b.offset;
  });
}

/**
 * Get quick stats for the dashboard
 * @param {object} summary - From createErrorSummary
 * @returns {object} Quick stats
 */
function getQuickStats(summary) {
  return {
    totalErrors: summary.total,
    criticalCount: summary.bySeverity.critical.length,
    warningCount: summary.bySeverity.warning.length,
    suggestionCount: summary.bySeverity.suggestion.length,
    mostCommonType: summary.topIssue,
    errorRate: summary.total > 0 ? '⚠️ High' : '✅ Good'
  };
}

module.exports = {
  classifyErrorType,
  assignSeverity,
  groupErrorsByCategory,
  createErrorSummary,
  enhanceErrorForDisplay,
  sortErrorsByImportance,
  getQuickStats
};
